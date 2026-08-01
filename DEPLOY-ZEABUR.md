# Deploying Finance GM Bot on Zeabur (Zeabur.com)

Zeabur is a developer-friendly platform that makes it very easy to deploy monorepos. Since your project contains separate subfolders (`backend`, `frontend`, `bot`, and `admin`), you can deploy each folder as a separate service from the same GitHub repository.

---

## Deployment Architecture

You will create **4 services** in your Zeabur project:
1. **Backend API** (`backend/`) — Node.js Express server.
2. **Telegram Bot** (`bot/`) — Node.js script.
3. **Frontend (Mini App)** (`frontend/`) — Next.js 14 WebApp.
4. **Admin Panel** (`admin/`) — Next.js 14 Admin Dashboard.

---

## Step-by-Step Guide

### Step 1: Create a Zeabur Project
1. Log in to [Zeabur](https://zeabur.com).
2. Click **Create Project** and choose a region (e.g., Singapore or US West).

### Step 2: Deploy the Backend Service
1. In your project, click **Add Service** → **Deploy from GitHub** → Select your repository (`Khmer-finance-management`).
2. Once added, click the service, go to **Settings**, and rename it to `backend`.
3. Under **Settings** → **App Directory**, set it to `backend`.
4. Go to **Variables** and add:
   - `DATABASE_URL` = `postgresql://...` (your Supabase PostgreSQL URI)
   - `DIRECT_URL` = `postgresql://...` (your Supabase direct URI)
   - `BOT_TOKEN` = `your_telegram_bot_token`
   - `JWT_SECRET` = `a_secure_random_string_of_at_least_32_characters`
   - `JWT_EXPIRES_IN` = `7d`
   - `NODE_ENV` = `production`
   - `PORT` = `3001` (Zeabur will route traffic to this port automatically)
5. Go to **Domains** and click **Generate Domain** (e.g., `finance-api.zeabur.app`). Copy this URL.

### Step 3: Deploy the Frontend Service
1. Click **Add Service** → **Deploy from GitHub** → Select the same repository.
2. Rename the service to `frontend`.
3. Under **Settings** → **App Directory**, set it to `frontend`.
4. Go to **Variables** and add:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-domain.zeabur.app/api` (use the URL generated in Step 2)
   - `NEXT_PUBLIC_BOT_USERNAME` = `kh_mart_finance_bot`
5. Go to **Domains** and click **Generate Domain** (e.g., `finance-app.zeabur.app`). Copy this URL.

### Step 4: Deploy the Bot Service
1. Click **Add Service** → **Deploy from GitHub** → Select the same repository.
2. Rename the service to `bot`.
3. Under **Settings** → **App Directory**, set it to `bot`.
4. Go to **Variables** and add:
   - `DATABASE_URL` = `postgresql://...` (your Supabase connection URI)
   - `DIRECT_URL` = `postgresql://...` (your Supabase direct URI)
   - `BOT_TOKEN` = `your_telegram_bot_token`
   - `FRONTEND_URL` = `https://your-frontend-domain.zeabur.app` (use the URL generated in Step 3)
   - `NODE_ENV` = `production`
5. *Note:* The bot runs on **long polling** by default in production if no public domain is specified. This is perfect and doesn't require exposing ports or adding a domain.

### Step 5: Deploy the Admin Panel
1. Click **Add Service** → **Deploy from GitHub** → Select the same repository.
2. Rename the service to `admin`.
3. Under **Settings** → **App Directory**, set it to `admin`.
4. Go to **Variables** and add:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-domain.zeabur.app/api` (use the URL generated in Step 2)
5. Go to **Domains** and click **Generate Domain** (e.g., `finance-admin.zeabur.app`).

---

## Post-Deployment Settings (Telegram Bot Configuration)
Once your frontend is live, you must tell Telegram to open your live URL instead of the localhost URL:
1. Message **@BotFather** on Telegram.
2. Send `/editapp` and select your Mini App.
3. Update the **Mini App URL** to your live frontend URL (e.g., `https://finance-app.zeabur.app`).
4. Update the `FRONTEND_URL` variable in your Backend and Bot settings to match this URL.
