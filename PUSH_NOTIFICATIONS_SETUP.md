# Push Notifications Setup Guide

## 1. Generate VAPID Keys

VAPID keys are required for Web Push notifications. Generate them using one of these methods:

### Method 1: Using web-push npm package
```bash
npm install -g web-push
web-push generate-vapid-keys
```

### Method 2: Using online generator
Visit: [https://vapidkeys.com/](https://vapidkeys.com/)

You'll get two keys:
- **Public Key**: Starts with `B`
- **Private Key**: Random string

## 2. Configure Environment Variables

### Frontend (.env file)
```
VITE_VAPID_PUBLIC_KEY=your_public_vapid_key_here
```

### Backend (Supabase Edge Function Secrets)
```bash
supabase secrets set VAPID_PUBLIC_KEY=your_public_vapid_key_here
supabase secrets set VAPID_PRIVATE_KEY=your_private_vapid_key_here
```

## 3. Browser Support

Web Push notifications are supported in:
- Chrome 42+
- Firefox 44+
- Safari 16+ (macOS Ventura+)
- Edge 17+
- Opera 29+

### Mobile Support
- Android: Full support via Chrome/Firefox
- iOS: Safari 16.4+ (iOS 16.4+)
- PWA required for iOS notifications

## 4. How It Works

### Automatic Notification Triggers

1. **Payment Request Created**
   - Sent to all parents on the team
   - Title: "New Payment Request"
   - Message: Payment details and due date

2. **Check-in Reminder**
   - Sent 1 hour before practice/game
   - Title: "Practice Starting Soon"
   - Message: Event location and time

3. **Drill of the Week Posted**
   - Sent to all team members
   - Title: "New Drill Posted"
   - Message: Drill title and description

4. **Blast Message**
   - Coach can send custom messages
   - Sent to all team members
   - Real-time delivery

5. **Payment Overdue**
   - Automatic after due date passes
   - Title: "Payment Overdue"
   - Includes late fee information

## 5. User Experience Flow

### First Time Setup
1. User logs in
2. App requests notification permission
3. User clicks "Allow" in browser prompt
4. Subscription saved to database

### Receiving Notifications
1. Push notification appears even when app is closed
2. User clicks notification
3. App opens to relevant section

## 6. Testing Push Notifications

1. Enable notifications in your test account
2. Create a payment request as coach
3. Check parent account for notification
4. Send a blast message
5. Verify all team members receive it

## 7. Privacy & Settings

- Users can disable notifications in browser settings
- Subscriptions are tied to device/browser
- Unsubscribe automatically removes all subscriptions
- No notification data stored on device

## 8. Production Considerations

### HTTPS Required
- Push notifications only work over HTTPS
- Development: localhost is allowed
- Production: Must use HTTPS domain

### Service Worker
- Must be served from root or subfolder
- Can't be served from CDN
- File: `/public/sw.js`

### Notification Permissions
- Can only be requested after user interaction
- Cannot be requested programmatically on page load
- Denied permissions cannot be re-requested without browser reset

## 9. Troubleshooting

### Notifications Not Appearing
1. Check browser notification permissions
2. Verify VAPID keys are configured
3. Check service worker registration
4. Inspect console for errors

### Subscription Fails
1. Verify HTTPS connection
2. Check VAPID public key format
3. Ensure service worker is registered
4. Try in different browser

### Push Not Delivered
1. Check push subscription is active in database
2. Verify endpoint is still valid
3. Check edge function logs
4. Test with simple notification first
