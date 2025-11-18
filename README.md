# GRAPLNK

**Wrestling & Youth Sports Management Platform**

A modern, mobile-first Progressive Web App for managing youth wrestling and travel sports teams. Built for coaches, parents, and athletes.

## Features

### For Coaches
- ⚡ 60-second team creation
- 📅 Schedule practices, games, and tournaments
- 💵 Send payment requests with automatic late fees
- 📊 Export attendance and payment reports to CSV
- 📢 Send blast messages to all parents
- 📱 Generate QR codes for easy check-ins
- 🎥 Post drill of the week videos

### For Parents
- ✅ One-tap check-ins
- 💳 Secure Stripe payments (partial payments allowed)
- 🔔 Push notifications for reminders and updates
- 📆 View upcoming events and schedules
- 💰 Track payments and donation campaigns
- 🏆 Support team fundraisers

### Technical Features
- 🔒 Google OAuth authentication
- 💾 Offline check-in with automatic sync
- 📱 Installable PWA (works like a native app)
- 🌐 Public team pages with custom subdomains
- 🔐 Row Level Security (RLS) for data protection
- ⚡ Real-time notifications
- 🎨 Wrestling-inspired design (dark blue & neon green)

## Quick Start

### Prerequisites
- Node.js 18+
- Free Supabase account
- Stripe account (test mode)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/graplnk.git
cd graplnk

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your Supabase credentials to .env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step deployment instructions.

### One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

## Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete setup instructions
- [Stripe Setup](./STRIPE_SETUP.md) - Payment configuration
- [Push Notifications](./PUSH_NOTIFICATIONS_SETUP.md) - Notification setup

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Payments**: Stripe
- **Hosting**: Netlify
- **Fonts**: Bebas Neue, Oswald, Inter

## Project Structure

```
graplnk/
├── src/
│   ├── components/         # React components
│   ├── contexts/           # React contexts (Auth)
│   ├── lib/                # Utilities and helpers
│   └── main.tsx            # App entry point
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── docs/                   # Documentation
```

## Environment Variables

Required environment variables:

```env
# Supabase
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Push Notifications (optional)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

## Database Schema

Key tables:
- `users` - Coaches, parents, and players
- `teams` - Sports teams
- `events` - Practices, games, tournaments
- `checkins` - Attendance tracking
- `payment_requests` - Payment configuration
- `payment_records` - Individual payment tracking
- `donations` - Fundraising campaigns
- `notifications` - In-app notifications

See `supabase/migrations/` for complete schema.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@graplnk.com or open an issue on GitHub.

## Roadmap

- [ ] SMS notifications
- [ ] Team analytics dashboard
- [ ] Mobile apps (iOS/Android)
- [ ] League management
- [ ] Tournament brackets
- [ ] Video analysis tools
- [ ] Nutrition tracking
- [ ] Injury management

---

Made with 💪 for the wrestling community
