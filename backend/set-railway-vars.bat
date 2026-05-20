@echo off
set RAILWAY_API_TOKEN=8534ff71-2487-44ab-8a72-4dd80a744148
cd /d "%~dp0"

echo Setting DATABASE_URL...
railway variables set "DATABASE_URL=postgresql://postgres.crtvojcnivpanigawdti:Dd112211%%40%%4011@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

echo Setting DIRECT_URL...
railway variables set "DIRECT_URL=postgresql://postgres.crtvojcnivpanigawdti:Dd112211%%40%%4011@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

echo Setting BOT_TOKEN...
railway variables set "BOT_TOKEN=8007954105:AAFBg5tpbWVni70U0AmCUjeLYG13oc1jgjw"

echo Setting JWT_SECRET...
railway variables set "JWT_SECRET=finance_gm_super_secret_key_change_this_in_production_2024"

echo Setting JWT_EXPIRES_IN...
railway variables set "JWT_EXPIRES_IN=7d"

echo Setting NODE_ENV...
railway variables set "NODE_ENV=production"

echo Setting FRONTEND_URL...
railway variables set "FRONTEND_URL=https://frontend-one-beta-31.vercel.app"

echo All variables set!
