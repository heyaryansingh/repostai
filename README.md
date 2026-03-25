# RepostAI

Turn any blog post into a week of social media content with one API call.

## Features

- **One API Call** - Send content, get Twitter threads, LinkedIn posts, Instagram captions
- **Multiple Platforms** - Twitter, LinkedIn, Instagram, summary, quotes
- **Tone Control** - Professional, casual, or witty
- **Usage Tracking** - Built-in rate limiting and usage monitoring
- **Stripe Billing** - Automatic subscription management

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd repostai
npm run setup
```

Follow the wizard to configure your API keys.

### 2. Run Locally

```bash
npm run dev
```

Visit http://localhost:3000

### 3. Deploy

```bash
npx vercel
```

## Requirements

- Node.js 18+
- Accounts at (all have free tiers):
  - [Supabase](https://supabase.com) - Database & Auth
  - [Stripe](https://stripe.com) - Payments
  - [OpenAI](https://platform.openai.com) - AI
  - [Vercel](https://vercel.com) - Hosting

## API Usage

```bash
curl -X POST https://your-domain.vercel.app/api/v1/repurpose \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": "Your blog post text here..."}'
```

### Response

```json
{
  "id": "rp_abc123",
  "twitter_thread": ["1/ First tweet...", "2/ Second tweet..."],
  "linkedin": "LinkedIn post content...",
  "instagram": "Instagram caption #hashtags",
  "summary": "Brief summary...",
  "quotes": ["Quote 1", "Quote 2"],
  "usage": {
    "requests_used": 1,
    "requests_limit": 10
  }
}
```

## Pricing

| Plan | Price | Requests/Month |
|------|-------|----------------|
| Free | $0 | 10 |
| Starter | $19/mo | 100 |
| Pro | $49/mo | 500 |
| Scale | $99/mo | 2,000 |

## Tech Stack

- **Framework**: Next.js 14
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Stripe
- **Hosting**: Vercel
- **Styling**: Tailwind CSS

## Project Structure

```
repostai/
├── src/
│   ├── app/           # Next.js pages and API routes
│   ├── components/    # React components
│   ├── lib/           # Utilities and helpers
│   └── types/         # TypeScript types
├── supabase/          # Database migrations
├── scripts/           # Setup scripts
└── docs/              # Documentation
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `STRIPE_*_PRICE_ID` - Stripe price IDs for each tier
- `OPENAI_API_KEY` - OpenAI API key
- `NEXT_PUBLIC_APP_URL` - Your deployed URL

## License

MIT
