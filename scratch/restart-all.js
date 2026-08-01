const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Dynamically require Telegraf from the bot's node_modules
const { Telegraf } = require(path.join(__dirname, '..', 'bot', 'node_modules', 'telegraf'));

const cloudflaredPath = path.join(__dirname, '..', 'cloudflared.exe');
const botEnvPath = path.join(__dirname, '..', 'bot', '.env');
const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');

console.log('🚀 Starting Cloudflare Tunnel for http://localhost:3000 ...');

const cloudflare = spawn(cloudflaredPath, ['tunnel', '--protocol', 'http2', '--url', 'http://localhost:3000'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let tunnelUrl = '';
let servicesStarted = false;

function startService(title, command, cwd) {
  const fullCommand = `start "${title}" cmd /k "${command}"`;
  exec(fullCommand, { cwd: cwd }, (error) => {
    if (error) {
      console.error(`❌ Failed to start service ${title}:`, error);
    } else {
      console.log(`🚀 Started service window: ${title}`);
    }
  });
}

async function startAllServices(url) {
  if (servicesStarted) return;
  servicesStarted = true;

  console.log('\n==================================================');
  console.log(`✅ CLOUDFLARE TUNNEL LIVE URL: ${url}`);
  console.log('==================================================\n');

  // 1. Update bot/.env
  if (fs.existsSync(botEnvPath)) {
    let content = fs.readFileSync(botEnvPath, 'utf8');
    content = content.replace(/FRONTEND_URL=".*?"/, `FRONTEND_URL="${url}"`);
    fs.writeFileSync(botEnvPath, content, 'utf8');
    console.log('✅ Updated bot/.env FRONTEND_URL');
  }

  // 2. Update backend/.env
  if (fs.existsSync(backendEnvPath)) {
    let content = fs.readFileSync(backendEnvPath, 'utf8');
    content = content.replace(/FRONTEND_URL=".*?"/, `FRONTEND_URL="${url}"`);
    fs.writeFileSync(backendEnvPath, content, 'utf8');
    console.log('✅ Updated backend/.env FRONTEND_URL');
  }

  // 3. Update Telegram Bot Menu Button
  try {
    const envContent = fs.readFileSync(botEnvPath, 'utf8');
    const tokenMatch = envContent.match(/BOT_TOKEN="(.*?)"/);
    if (tokenMatch) {
      const botToken = tokenMatch[1];
      const bot = new Telegraf(botToken);
      await bot.telegram.setChatMenuButton({
        menuButton: { type: 'web_app', text: '💰 Open Dashboard', web_app: { url: url } }
      });
      console.log('✅ Updated Telegram Menu Button to Cloudflare URL!');
    } else {
      console.warn('⚠️ BOT_TOKEN not found in bot/.env, skipped updating Menu Button.');
    }
  } catch (e) {
    console.error('❌ Failed to update Telegram menu button:', e);
  }

  // 4. Start the components sequentially
  const rootDir = path.join(__dirname, '..');

  console.log('⏳ Starting services sequence...');

  // Backend
  startService('BACKEND', 'C:\\xampp\\php\\php.exe artisan serve --port=3001', path.join(rootDir, 'backend'));
  
  setTimeout(() => {
    // Frontend
    startService('FRONTEND', 'npm run dev', path.join(rootDir, 'frontend'));
    
    setTimeout(() => {
      // Bot
      startService('BOT', 'npx ts-node --transpile-only src/index.ts', path.join(rootDir, 'bot'));
      
      setTimeout(() => {
        // Admin
        startService('ADMIN', 'npm run dev', path.join(rootDir, 'admin'));
        console.log('\n✨ All services successfully launched in separate windows!');
        console.log(`- Backend:      http://localhost:3001`);
        console.log(`- Frontend:     http://localhost:3000 -> ${url}`);
        console.log(`- Admin Panel:  http://localhost:3002`);
        console.log(`- Bot:          Active & polling Telegram\n`);
      }, 2000);
    }, 3000);
  }, 3000);
}

function checkOutput(data) {
  const str = data.toString();
  console.log(str.trim());
  const match = str.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !tunnelUrl) {
    tunnelUrl = match[0];
    startAllServices(tunnelUrl);
  }
}

cloudflare.stdout.on('data', checkOutput);
cloudflare.stderr.on('data', checkOutput);

cloudflare.on('close', (code) => {
  console.log(`Cloudflare tunnel process exited with code ${code}`);
});
