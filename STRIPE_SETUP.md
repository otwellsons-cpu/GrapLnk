# Stripe Integration Setup Guide

## 1. Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up for a Stripe account
3. Complete the verification process

## 2. Get Your API Keys

### Test Mode Keys (for development)
1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Live Mode Keys (for production)
1. Complete Stripe account activation
2. Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. Copy your **Publishable key** (starts with `pk_live_`)
4. Copy your **Secret key** (starts with `sk_live_`)

## 3. Configure Environment Variables

### Frontend (.env file)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Backend (Supabase Edge Function Secrets)
Run these commands in your terminal:

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here

# Set Stripe webhook secret (see step 4)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 4. Configure Webhook

1. Go to [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL:
   ```
   https://[your-project-ref].supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to your Supabase secrets (see step 3)

## 5. Test Payment Flow

1. Use Stripe test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future expiry date (e.g., 12/34)
   - Use any 3-digit CVC (e.g., 123)

2. Test in your app:
   - Create a payment request as a coach
   - View payment as a parent
   - Process payment with test card
   - Verify webhook receives payment confirmation

## 6. Switch to Live Mode

When ready for production:

1. Complete Stripe account activation
2. Update environment variables with live keys (`pk_live_` and `sk_live_`)
3. Create a new webhook endpoint for production URL
4. Test thoroughly before accepting real payments

## Important Security Notes

- NEVER commit secret keys to version control
- Always use test mode during development
- Validate all payments on the server side (via webhooks)
- Monitor Stripe dashboard for suspicious activity

## Late Fee Configuration

Late fees are automatically calculated:
- Default: $15 after 5 days past due date
- Configurable per payment request
- Applied automatically when payment is overdue
- Included in total amount due

## Partial Payments

When enabled:
- Parents can pay any amount up to the remaining balance
- Multiple partial payments are tracked
- Status updates automatically: pending → partial → paid
- Full history maintained in payment records
