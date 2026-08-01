const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Telegraf } = require(path.join(__dirname, '..', 'bot', 'node_modules', 'telegraf'));

const cloudflaredPath = path.join(__dirname, '..', 'cloudflared.exe');
const botEnvPath = path.join(__dirname, '..', 'bot', '.env');

console.log('🚀 Starting Cloudflare Tunnel (http2) for http://localhost:3000 ...');

const cloudflare = spawn(cloudflaredPath, ['tunnel', '--protocol', 'http2', '--url', 'http://localhost:3000'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let tunnelUrl = '';

function checkOutput(data) {
  const str = data.toString();
  console.log(str);
  const match = str.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !tunnelUrl) {
    tunnelUrl = match[0];
    console.log(`\n==================================================`);
    console.log(`✅ CLOUDFLARE TUNNEL LIVE URL: ${tunnelUrl}`);
    console.log(`==================================================\n`);

    // Update bot/.env
    if (fs.existsSync(botEnvPath)) {
      let content = fs.readFileSync(botEnvPath, 'utf8');
      content = content.replace(/FRONTEND_URL=".*?"/, `FRONTEND_URL="${tunnelUrl}"`);
      fs.writeFileSync(botEnvPath, content, 'utf8');
      console.log('✅ Updated bot/.env FRONTEND_URL');
    }

    // Update Telegram Bot Menu Button
    try {
      const envContent = fs.readFileSync(botEnvPath, 'utf8');
      const tokenMatch = envContent.match(/BOT_TOKEN="(.*?)"/);
      if (tokenMatch) {
        const botToken = tokenMatch[1];
        const bot = new Telegraf(botToken);
        bot.telegram.setChatMenuButton({
          menuButton: { type: 'web_app', text: '💰 Open Dashboard', web_app: { url: tunnelUrl } }
        }).then(() => {
          console.log('✅ Updated Telegram Menu Button to Cloudflare URL!');
        }).catch(err => console.error('Failed to update Telegram menu button:', err));
      }
    } catch (e) {
      console.error('Error updating menu button:', e);
    }
  }
}

cloudflare.stdout.on('data', checkOutput);
cloudflare.stderr.on('data', checkOutput);

cloudflare.on('close', (code) => {
  console.log(`Cloudflare tunnel process exited with code ${code}`);
});
