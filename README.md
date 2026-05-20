# Finance GM Bot 💰

A production-ready **Telegram Mini App** for personal finance management. Track expenses, view analytics, and receive automated weekly reports — all inside Telegram.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Stack](https://img.shields.io/badge/TypeScript-5-blue) ![Stack](https://img.shields.io/badge/PostgreSQL-Supabase-green) ![Stack](https://img.shields.io/badge/Bot-Telegraf-blue)

---

## Features

- **Telegram Mini App** — opens inside Telegram, native feel
- **Expense & Income tracking** with 10 categories
- **Dashboard** — balance, savings rate, top categories
- **Charts** — pie chart by category, monthly income vs expenses
- **Reports** — weekly & monthly summaries
- **Bot automation** — weekly finance summaries sent every Monday
- **Natural language parsing** — `"Spent $12 on lunch"` → logged automatically
- **Telegram auth** — zero-friction login via Telegram initData
- **AI-ready architecture** — hooks prepared for OpenAI/Anthropic integration

---

## Architecture

```
├── bot/          Telegraf bot (Railway)
├── frontend/     Next.js 14 Mini App (Vercel)
├── backend/      Express REST API (Railway)
├── prisma/       PostgreSQL schema (Supabase)
└── shared/       TypeScript types shared across packages
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- Supabase project (free tier works)
- Vercel account (free)
- Railway account (free tier)

---

## Step 1 — Create Your Telegram Bot

1. Open Telegram and message **@BotFather**
2. Send `/newbot` and follow the prompts
3. Copy the **bot token** (looks like `1234567890:ABCdef...`)
4. Send `/newapp` to BotFather to create a Mini App
5. Set the Mini App URL to your Vercel deployment URL (configure after deploy)

---

## Step 2 — Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy the **Connection String** from Settings → Database → URI
3. Keep it — you'll need it as `DATABASE_URL`

---

## Step 3 — Backend Setup (Railway)

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, BOT_TOKEN, JWT_SECRET

npm install
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to Supabase
npm run db:seed        # Seed categories (optional)
npm run dev            # Start local dev server
```

**Deploy to Railway:**
1. Push to a GitHub repo
2. Connect Railway → New Project → Deploy from GitHub → select `backend/`
3. Add environment variables in Railway dashboard
4. Copy the Railway deployment URL

---

## Step 4 — Frontend Setup (Vercel)

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your Railway backend URL

npm install
npm run dev    # http://localhost:3000
```

**Deploy to Vercel:**
1. Push to GitHub
2. Vercel → New Project → Import → set root directory to `frontend/`
3. Add env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BOT_USERNAME`
4. Deploy — copy the Vercel URL

**After deploying:**
- Go back to BotFather → `/editapp` → set Mini App URL to your Vercel URL
- Update `FRONTEND_URL` in your backend and bot env vars

---

## Step 5 — Bot Setup

```bash
cd bot
cp .env.example .env
# Fill in BOT_TOKEN, DATABASE_URL, FRONTEND_URL

npm install
npm run dev    # Start bot locally
```

**Deploy bot to Railway** (separate service):
1. Railway → New Service in the same project
2. Set root to `bot/`
3. Add same env vars

---

## Environment Variables Reference

| Variable | Where | Description |
|---|---|---|
| `DATABASE_URL` | backend, bot | Supabase PostgreSQL connection string |
| `BOT_TOKEN` | backend, bot | Telegram bot token from BotFather |
| `JWT_SECRET` | backend | Random 64-char secret for JWT signing |
| `FRONTEND_URL` | backend, bot | Vercel deployment URL |
| `NEXT_PUBLIC_API_URL` | frontend | Railway backend URL + `/api` |
| `NEXT_PUBLIC_BOT_USERNAME` | frontend | Your bot's username (without @) |

**Generate JWT_SECRET:**
```bash
openssl rand -base64 64
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/telegram` | None | Authenticate via Telegram initData |
| GET | `/api/transactions` | JWT | List transactions (paginated) |
| POST | `/api/transactions` | JWT | Create transaction |
| PUT | `/api/transactions/:id` | JWT | Update transaction |
| DELETE | `/api/transactions/:id` | JWT | Delete transaction |
| GET | `/api/analytics/weekly` | JWT | Weekly summary |
| GET | `/api/analytics/monthly` | JWT | Monthly summary |
| GET | `/api/reports` | JWT | Historical reports |
| GET | `/api/categories` | None | List all categories |
| GET | `/api/health` | None | Health check |

---

## Bot Commands

| Command | Description |
|---|---|
| `/start` | Welcome message + dashboard button |
| `/summary` | Current week's finance summary |
| `/report` | Monthly report (alias for /summary) |
| `/help` | Help message with all commands |

**Natural language expense logging:**
- `"Spent $12 on lunch"` → Food expense, $12
- `"Paid $50 for groceries"` → Shopping expense, $50
- `"Earned $500 from freelance"` → Freelance income, $500
- `"Bought coffee for $4"` → Food expense, $4

---

## Database Schema

| Table | Description |
|---|---|
| `users` | Telegram users (id, telegramId, name, etc.) |
| `categories` | Transaction categories (seeded) |
| `transactions` | Income/expense records |
| `budgets` | User budget limits per category |
| `weekly_reports` | Cached weekly summaries |
| `monthly_reports` | Cached monthly summaries |

---

## Project Structure

```
Finance GM Bot/
├── shared/
│   └── types/index.ts          Shared TypeScript types + CATEGORIES constant
│
├── prisma/
│   └── schema.prisma           Database models
│
├── backend/
│   └── src/
│       ├── index.ts            Express app entry point
│       ├── lib/prisma.ts       Prisma singleton
│       ├── middleware/auth.ts  Telegram auth + JWT middleware
│       ├── routes/index.ts     All API routes
│       ├── controllers/        Request handlers
│       │   ├── auth.controller.ts
│       │   ├── transactions.controller.ts
│       │   └── analytics.controller.ts
│       ├── services/
│       │   └── analytics.service.ts
│       └── utils/date.ts       Date helpers
│
├── bot/
│   └── src/
│       ├── index.ts            Telegraf bot entry point
│       ├── lib/prisma.ts       Prisma singleton
│       ├── commands/
│       │   ├── start.command.ts
│       │   └── summary.command.ts
│       ├── handlers/
│       │   └── message.handler.ts   NLP expense parsing
│       ├── services/
│       │   ├── nlp.service.ts       Natural language parser
│       │   ├── analytics.service.ts
│       │   └── api.service.ts
│       └── scheduler/
│           └── weekly-report.ts     Cron: Monday 09:00
│
└── frontend/
    └── src/
        ├── app/                Next.js App Router pages
        │   ├── layout.tsx      Root layout + Telegram SDK script
        │   ├── page.tsx        Dashboard
        │   ├── transactions/   Transaction list + filter
        │   ├── add/            Add transaction form
        │   ├── reports/        Monthly reports
        │   └── profile/        User profile
        ├── components/
        │   ├── ui/             shadcn/ui base components
        │   ├── layout/BottomNav.tsx
        │   ├── dashboard/      SummaryCard, QuickStats
        │   ├── charts/         PieChart, BarChart wrappers
        │   └── transactions/   TransactionItem, AddForm
        ├── hooks/
        │   ├── useTelegram.ts  Telegram WebApp SDK hook
        │   └── useAuth.ts      Auth state + JWT management
        ├── services/api.ts     Backend API client
        └── lib/utils.ts        Formatters + cn()
```

---

## AI Features (Roadmap)

The architecture is prepared for AI integration. To add AI features:

1. Install `openai` or `@anthropic-ai/sdk` in backend
2. Create `backend/src/services/ai.service.ts`
3. Wire into transaction creation for auto-categorization
4. Add `/api/ai/insights` endpoint for spending recommendations

Planned features:
- Auto-categorize transactions from note text
- Weekly "spending insights" generated by LLM
- Budget recommendations based on spending patterns
- Unusual spending detection with alerts

---

## Development Tips

**Run all services locally:**
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — Bot
cd bot && npm run dev
```

**Test the Mini App outside Telegram:**
- Open `http://localhost:3000` in your browser
- Dev mode uses mock Telegram user (id: 12345, name: "Test User")
- Set `NODE_ENV=development` in backend to skip initData validation

**Database management:**
```bash
cd backend
npm run db:studio   # Opens Prisma Studio UI at localhost:5555
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Telegram initData + JWT |
| Bot | Telegraf |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |
| DB Host | Supabase |

---

## License

MIT © Finance GM Bot
