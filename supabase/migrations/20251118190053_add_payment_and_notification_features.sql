/*
  # Payment and Notification Features Migration

  1. New Tables
    - `payment_requests`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `title` (text) - e.g., "Monthly Dues - March"
      - `description` (text)
      - `amount` (numeric) - base amount in dollars
      - `due_date` (timestamptz)
      - `late_fee_amount` (numeric) - default 15.00
      - `late_fee_days` (integer) - default 5
      - `allow_partial` (boolean) - default true
      - `recurring` (boolean) - default false
      - `recurring_interval` (text) - 'monthly', 'weekly', etc.
      - `stripe_product_id` (text)
      - `stripe_price_id` (text)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamptz)
    
    - `payment_records`
      - `id` (uuid, primary key)
      - `payment_request_id` (uuid, foreign key to payment_requests)
      - `parent_id` (uuid, foreign key to users)
      - `player_id` (uuid, foreign key to users)
      - `amount_paid` (numeric)
      - `amount_due` (numeric)
      - `late_fee_applied` (numeric) - default 0
      - `status` (text) - 'pending', 'partial', 'paid', 'overdue'
      - `stripe_payment_intent_id` (text)
      - `stripe_subscription_id` (text)
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `team_id` (uuid, foreign key to teams)
      - `type` (text) - 'payment_request', 'checkin_reminder', 'drill_posted', 'blast_message'
      - `title` (text)
      - `message` (text)
      - `read` (boolean) - default false
      - `sent_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `push_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `endpoint` (text, unique)
      - `p256dh_key` (text)
      - `auth_key` (text)
      - `created_at` (timestamptz)
    
    - `blast_messages`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `sent_by` (uuid, foreign key to users)
      - `subject` (text)
      - `message` (text)
      - `sent_at` (timestamptz)
    
    - `qr_checkin_codes`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `code` (text, unique)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for coaches to manage payments and send messages
    - Add policies for parents to view their payments and notifications
    - Add policies for QR code check-ins

  3. Important Notes
    - Late fees are automatically calculated based on due_date + late_fee_days
    - Partial payments are tracked with amount_paid vs amount_due
    - Push subscriptions use Web Push API standard
    - QR codes expire after event completion
*/

-- Payment Requests Table
CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  amount numeric NOT NULL CHECK (amount > 0),
  due_date timestamptz NOT NULL,
  late_fee_amount numeric DEFAULT 15.00 CHECK (late_fee_amount >= 0),
  late_fee_days integer DEFAULT 5 CHECK (late_fee_days >= 0),
  allow_partial boolean DEFAULT true,
  recurring boolean DEFAULT false,
  recurring_interval text DEFAULT NULL,
  stripe_product_id text DEFAULT NULL,
  stripe_price_id text DEFAULT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage payment requests for their teams"
  ON payment_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = payment_requests.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'coach'
    )
  );

CREATE POLICY "Parents can view payment requests for their teams"
  ON payment_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = payment_requests.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Payment Records Table
CREATE TABLE IF NOT EXISTS payment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id uuid REFERENCES payment_requests(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  player_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount_paid numeric DEFAULT 0 CHECK (amount_paid >= 0),
  amount_due numeric NOT NULL CHECK (amount_due > 0),
  late_fee_applied numeric DEFAULT 0 CHECK (late_fee_applied >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  stripe_payment_intent_id text DEFAULT NULL,
  stripe_subscription_id text DEFAULT NULL,
  paid_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their own payment records"
  ON payment_records FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can update their own payment records"
  ON payment_records FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Coaches can view payment records for their teams"
  ON payment_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment_requests pr
      JOIN team_members tm ON tm.team_id = pr.team_id
      WHERE pr.id = payment_records.payment_request_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'coach'
    )
  );

CREATE POLICY "System can insert payment records"
  ON payment_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('payment_request', 'checkin_reminder', 'drill_posted', 'blast_message', 'payment_overdue')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  endpoint text UNIQUE NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
  ON push_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Blast Messages Table
CREATE TABLE IF NOT EXISTS blast_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  sent_by uuid REFERENCES users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  message text NOT NULL,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE blast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view blast messages"
  ON blast_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = blast_messages.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can send blast messages"
  ON blast_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = blast_messages.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'coach'
    )
  );

-- QR Check-in Codes Table
CREATE TABLE IF NOT EXISTS qr_checkin_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  code text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE qr_checkin_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active QR codes"
  ON qr_checkin_codes FOR SELECT
  TO authenticated
  USING (expires_at > now());

CREATE POLICY "Coaches can create QR codes for their events"
  ON qr_checkin_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN team_members tm ON tm.team_id = e.team_id
      WHERE e.id = qr_checkin_codes.event_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'coach'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_team_id ON payment_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_parent_id ON payment_records(parent_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_request_id ON payment_records(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_blast_messages_team_id ON blast_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_qr_checkin_codes_event_id ON qr_checkin_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_qr_checkin_codes_code ON qr_checkin_codes(code);
