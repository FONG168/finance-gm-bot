# Finance GM Admin Panel — Setup Guide

## Architecture Overview

```
Finance GM Bot/
├── frontend/          → Telegram Mini App (user-facing)
├── backend/           → Shared API (Express + Prisma)
├── admin/             → Admin Dashboard (Next.js 14)
├── bot/               → Telegram Bot (Telegraf)
└── prisma/            → Shared database schema
```

## Step 1: Apply Database Schema

After the schema changes, run migration to add all new admin tables:

```bash
cd "Finance GM Bot"

# Apply schema changes (development)
npx prisma db push

# Or for production migration
npx prisma migrate deploy

# Regenerate Prisma client
cd backend
npx prisma generate
```

New tables added:
- `admin_users` — admin accounts with roles
- `audit_logs` — all admin action history
- `payment_requests` — manual QR payment submissions
- `subscription_logs` — subscription change history
- `qr_codes` — ABA/ACLEDA/Wing/KHQR images
- `announcements` — broadcast messages
- `system_settings` — key-value config store

## Step 2: Backend Environment Variables

Add these to `backend/.env`:

```env
# Existing vars...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
BOT_TOKEN=...
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://your-mini-app.vercel.app

# New admin vars
ADMIN_JWT_SECRET=your-admin-jwt-secret-different-from-jwt-secret
ADMIN_JWT_EXPIRES_IN=12h
ADMIN_URL=https://admin.yourapp.com
ADMIN_SEED_KEY=a-random-secret-used-once-to-bootstrap-first-admin
```

## Step 3: Create First SUPER_ADMIN Account

Use the one-time seed endpoint (only works once, before any SUPER_ADMIN exists):

```bash
curl -X POST https://your-backend.railway.app/api/admin/auth/seed \
  -H "Content-Type: application/json" \
  -d '{
    "seedKey": "your-ADMIN_SEED_KEY-value",
    "email": "admin@yourcompany.com",
    "password": "StrongPassword123!",
    "firstName": "Admin"
  }'
```

After this succeeds, the `ADMIN_SEED_KEY` can be removed from env — the endpoint will reject further requests.

## Step 4: Admin Frontend Environment

Create `admin/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

For production, create `admin/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

## Step 5: Run Admin Panel Locally

```bash
cd admin
npm install
npm run dev
# Opens at http://localhost:3002
```

## Step 6: Deploy Admin Panel

### Vercel (Recommended)

```bash
cd admin
vercel --prod
```

Set environment variable in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app/api`

### Manual (Node)

```bash
cd admin
npm run build
npm start
```

## Step 7: Backend Install & Restart

```bash
cd backend
npm install        # installs new bcryptjs dependency
npm run build
# restart on Railway
```

---

## Admin Roles & Permissions

| Role | Level | Default Access |
|------|-------|---------------|
| SUPER_ADMIN | 4 | All permissions (bypasses checks) |
| ADMIN | 3 | All permissions by default |
| MODERATOR | 2 | Configurable permissions |
| SUPPORT_AGENT | 1 | Configurable permissions |

### Available Permissions

- `manage_users` — view, suspend, ban users
- `manage_subscriptions` — extend trial, activate premium
- `manage_payments` — approve/reject payment requests
- `manage_balances` — edit account balances (future)
- `manage_roles` — create/edit admin users
- `view_reports` — dashboard stats, audit logs
- `manage_settings` — QR codes, system settings, announcements

---

## Admin API Endpoints

All admin endpoints are prefixed with `/api/admin/`.

### Auth
- `POST /api/admin/auth/login` — login
- `GET /api/admin/auth/me` — get current admin
- `POST /api/admin/auth/seed` — bootstrap first SUPER_ADMIN
- `POST /api/admin/auth/create-admin` — create new admin (SUPER_ADMIN only)

### Dashboard
- `GET /api/admin/dashboard/stats` — platform KPIs
- `GET /api/admin/dashboard/recent-activity` — recent events

### Users
- `GET /api/admin/users` — list with search/filter/pagination
- `GET /api/admin/users/:id` — full user detail
- `POST /api/admin/users/:id/suspend` — suspend
- `POST /api/admin/users/:id/unsuspend` — unsuspend
- `POST /api/admin/users/:id/ban` — ban
- `POST /api/admin/users/:id/unban` — unban
- `POST /api/admin/users/:id/extend-trial` — extend trial (body: `{ days }`)
- `POST /api/admin/users/:id/activate-premium` — activate (body: `{ days, plan }`)
- `POST /api/admin/users/:id/downgrade` — downgrade to free
- `DELETE /api/admin/users/:id` — delete user

### Payments
- `GET /api/admin/payments` — list with status filter
- `GET /api/admin/payments/:id` — payment detail
- `POST /api/admin/payments/:id/approve` — approve + auto-activate premium
- `POST /api/admin/payments/:id/reject` — reject with reason

### QR Codes
- `GET /api/admin/qr-codes` — list all providers
- `PUT /api/admin/qr-codes/:provider` — upsert (ABA/ACLEDA/WING/KHQR)
- `DELETE /api/admin/qr-codes/:provider` — delete

### Announcements
- `GET /api/admin/announcements` — list
- `POST /api/admin/announcements` — create
- `DELETE /api/admin/announcements/:id` — delete

### Audit Logs
- `GET /api/admin/audit-logs` — paginated log list with filters

### Settings
- `GET /api/admin/settings` — all system settings
- `PUT /api/admin/settings/:key` — update a setting
- `GET /api/admin/settings/admins/list` — list admin users
- `PUT /api/admin/settings/admins/:id/permissions` — update permissions

---

## User Payment Flow

1. User opens mini app → clicks Upgrade
2. User sees QR code (fetched from `/api/admin/qr-codes`)
3. User pays via bank app
4. User clicks "I Have Paid" → POST `/api/payments/request` (to be added to user API)
5. Admin sees pending payment in admin panel
6. Admin reviews and clicks Approve
7. System automatically activates premium for the user
8. User receives confirmation in Telegram

---

## Security Notes

- Admin JWT uses a separate secret (`ADMIN_JWT_SECRET`) from user JWT
- Admin routes are completely isolated under `/api/admin/`
- Every admin action writes to `audit_logs`
- SUPER_ADMIN bypasses all permission checks
- Never commit `.env` files
- Rate limiting is inherited from the main backend middleware
