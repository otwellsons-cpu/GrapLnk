# GrapLnk Deployment Guide

## Step-by-Step Deployment Instructions

### Step 1: Create Free Supabase Project (5 minutes)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - Name: `graplnk`
   - Database Password: (save this securely)
   - Region: Choose closest to you
4. Click "Create new project" (wait 2-3 minutes)

### Step 2: Get Supabase Credentials

1. In your project dashboard, click "Project Settings" (gear icon)
2. Go to "API" section
3. Copy these values:
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **Anon/Public Key**: `eyJhbGci...` (long string)

### Step 3: Update Environment Variables

1. Open `.env` file in your project
2. Replace with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### Step 4: Run Database Migrations

1. In Supabase dashboard, go to "SQL Editor"
2. Open the migration files in `supabase/migrations/` folder
3. Copy and paste each migration SQL into the SQL Editor
4. Run them in order:
   - `20231118184523_initial_schema.sql`
   - `20251118190053_add_payment_and_notification_features.sql`

### Step 5: Enable Google OAuth

1. In Supabase dashboard, go to "Authentication" → "Providers"
2. Enable "Google" provider
3. Follow Supabase instructions to:
   - Create Google OAuth app
   - Add Client ID and Secret
   - Add authorized redirect URLs

### Step 6: Connect Stripe (Test Mode)

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create account and get test keys
3. Add to `.env`:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. Set Stripe secret in Supabase:
   - Go to "Edge Functions" → "Manage secrets"
   - Add: `STRIPE_SECRET_KEY` = `sk_test_...`

See `STRIPE_SETUP.md` for complete Stripe configuration.

### Step 7: Deploy Edge Functions

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref [your-project-ref]
   ```

4. Deploy all edge functions:
   ```bash
   supabase functions deploy create-payment-intent
   supabase functions deploy stripe-webhook
   supabase functions deploy send-push-notification
   supabase functions deploy send-blast-message
   ```

### Step 8: Deploy to Netlify (One-Click)

1. Click the "Deploy to Netlify" button below
2. Connect your GitHub account
3. Netlify will:
   - Fork this repository to your GitHub
   - Create a new site
   - Build and deploy automatically

4. Add environment variables in Netlify:
   - Go to Site settings → Environment variables
   - Add all variables from your `.env` file

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/graplnk)

### Step 9: Set Up Custom Domain (graplnk.com)

#### Buy Domain

1. Go to [Namecheap](https://www.namecheap.com) or [Google Domains](https://domains.google)
2. Search for `graplnk.com`
3. Purchase domain ($10-15/year)

#### Configure DNS in Netlify

1. In Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Enter: `graplnk.com`
4. Click "Verify"

#### Update Name Servers

1. In Netlify, note the custom name servers:
   - `dns1.p01.nsone.net`
   - `dns2.p01.nsone.net`
   - `dns3.p01.nsone.net`
   - `dns4.p01.nsone.net`

2. In your domain registrar (Namecheap/Google):
   - Go to domain settings
   - Change name servers to Netlify's
   - Save (propagation takes 24-48 hours)

#### Set Up Subdomain (outlawpwc.graplnk.com)

1. In Netlify, go to "Domain settings"
2. Click "Add domain alias"
3. Enter: `outlawpwc.graplnk.com`
4. Netlify will automatically configure SSL

### Step 10: Enable Push Notifications (Optional)

1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Add to Netlify environment variables:
   - `VITE_VAPID_PUBLIC_KEY` = your public key

3. Add to Supabase edge function secrets:
   - `VAPID_PUBLIC_KEY` = your public key
   - `VAPID_PRIVATE_KEY` = your private key

See `PUSH_NOTIFICATIONS_SETUP.md` for complete setup.

## Production Checklist

Before going live:

- [ ] Database migrations run successfully
- [ ] Google OAuth configured and working
- [ ] Stripe webhook configured
- [ ] All edge functions deployed
- [ ] Environment variables set in Netlify
- [ ] Custom domain configured with SSL
- [ ] Test payments with Stripe test cards
- [ ] Test notifications on mobile and desktop
- [ ] Verify RLS policies are active

## Support

For issues or questions:
- Check Supabase logs: Project → Logs
- Check Netlify logs: Deploys → Function logs
- Check Stripe dashboard for payment issues

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Your site will be live at: `https://your-site.netlify.app`
