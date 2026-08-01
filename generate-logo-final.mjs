import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'logos-final');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--font-render-hinting=none'] });
const page = await browser.newPage();

// ─── Icon only (512×512, transparent) ───────────────────────────────────────
const iconHtml = `<!DOCTYPE html>
<html><head>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:512px; height:512px; background:transparent; display:flex; align-items:center; justify-content:center; }
</style></head><body>
<svg width="512" height="512" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Rounded square background — soft lavender -->
  <rect x="4" y="4" width="92" height="92" rx="20" fill="#EAE4F7"/>

  <!-- Baseline -->
  <line x1="20" y1="71" x2="80" y2="71" stroke="#7B52CC" stroke-width="2" stroke-linecap="round" opacity="0.35"/>

  <!-- Chart line — smooth bezier through 4 points -->
  <!-- Points: (20,66) → (38,52) → (58,37) → (78,44) -->
  <path d="M 20,66 C 28,60 32,56 38,52 C 46,47 50,34 58,37 C 66,40 70,43 78,44"
    stroke="#7B52CC" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Dots at each data point -->
  <circle cx="20" cy="66" r="4.5" fill="#7B52CC"/>
  <circle cx="38" cy="52" r="4.5" fill="#7B52CC"/>
  <circle cx="58" cy="37" r="4.5" fill="#7B52CC"/>
  <circle cx="78" cy="44" r="4.5" fill="#7B52CC"/>
</svg>
</body></html>`;

await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });
await page.setContent(iconHtml, { waitUntil: 'domcontentloaded' });
await page.screenshot({ path: path.join(outDir, 'icon-512.png'), clip: { x:0,y:0,width:512,height:512 }, omitBackground: true });
console.log('✓  icon-512.png');

// Also 192px and 64px icons
for (const sz of [256, 192, 64]) {
  await page.setViewport({ width: sz, height: sz, deviceScaleFactor: 2 });
  const small = iconHtml;
  await page.setContent(small, { waitUntil: 'domcontentloaded' });
  const scaledHtml = `<!DOCTYPE html><html><head><style>
    * { margin:0; padding:0; }
    html,body { width:${sz}px; height:${sz}px; background:transparent; display:flex; align-items:center; justify-content:center; }
  </style></head><body>
  <svg width="${sz}" height="${sz}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="92" height="92" rx="20" fill="#EAE4F7"/>
    <line x1="20" y1="71" x2="80" y2="71" stroke="#7B52CC" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
    <path d="M 20,66 C 28,60 32,56 38,52 C 46,47 50,34 58,37 C 66,40 70,43 78,44"
      stroke="#7B52CC" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="20" cy="66" r="4.5" fill="#7B52CC"/>
    <circle cx="38" cy="52" r="4.5" fill="#7B52CC"/>
    <circle cx="58" cy="37" r="4.5" fill="#7B52CC"/>
    <circle cx="78" cy="44" r="4.5" fill="#7B52CC"/>
  </svg></body></html>`;
  await page.setViewport({ width: sz, height: sz, deviceScaleFactor: 2 });
  await page.setContent(scaledHtml, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(outDir, `icon-${sz}.png`), clip: { x:0,y:0,width:sz,height:sz }, omitBackground: true });
  console.log(`✓  icon-${sz}.png`);
}

// ─── Full logo with text (light version, card style) — 800×380 ───────────────
const fullLogoHtml = `<!DOCTYPE html>
<html><head>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:800px; height:380px; background:transparent; display:flex; align-items:center; justify-content:center; }
  .card {
    width:600px;
    background:#FAFAFA;
    border-radius:20px;
    padding: 44px 60px 36px;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:0;
    box-shadow: 0 2px 24px rgba(0,0,0,0.07);
  }
  .tagline {
    font-family:'Poppins', sans-serif;
    font-size:10.5px;
    font-weight:600;
    letter-spacing:0.22em;
    color:#7B52CC;
    text-transform:uppercase;
    margin-top:6px;
  }
  .name {
    font-family:'Poppins', sans-serif;
    font-size:30px;
    font-weight:600;
    color:#1c1040;
    letter-spacing:-0.01em;
    margin-top:14px;
    line-height:1;
  }
  .divider {
    width:100%;
    height:1px;
    background:#e8e4f0;
    margin: 20px 0 14px;
  }
  .label {
    font-family:'Poppins', sans-serif;
    font-size:9px;
    font-weight:500;
    letter-spacing:0.25em;
    color:#b0a8c8;
    text-transform:uppercase;
  }
</style>
</head><body>
<div class="card">
  <!-- Icon -->
  <svg width="116" height="116" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="92" height="92" rx="20" fill="#EAE4F7"/>
    <line x1="20" y1="71" x2="80" y2="71" stroke="#7B52CC" stroke-width="2" stroke-linecap="round" opacity="0.35"/>
    <path d="M 20,66 C 28,60 32,56 38,52 C 46,47 50,34 58,37 C 66,40 70,43 78,44"
      stroke="#7B52CC" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="20" cy="66" r="4.5" fill="#7B52CC"/>
    <circle cx="38" cy="52" r="4.5" fill="#7B52CC"/>
    <circle cx="58" cy="37" r="4.5" fill="#7B52CC"/>
    <circle cx="78" cy="44" r="4.5" fill="#7B52CC"/>
  </svg>

  <p class="name">Finance GM</p>
  <p class="tagline">Smart Money Platform</p>

  <div class="divider"></div>
  <p class="label">Light &nbsp;—&nbsp; Full</p>
</div>
</body></html>`;

await page.setViewport({ width: 800, height: 380, deviceScaleFactor: 2 });
await page.setContent(fullLogoHtml, { waitUntil: 'domcontentloaded' });
// wait for Poppins to load
await new Promise(r => setTimeout(r, 1800));
await page.screenshot({ path: path.join(outDir, 'logo-full-light.png'), clip: { x:0,y:0,width:800,height:380 }, omitBackground: true });
console.log('✓  logo-full-light.png');

// ─── Dark version ────────────────────────────────────────────────────────────
const darkLogoHtml = fullLogoHtml
  .replace('#FAFAFA', '#14103A')
  .replace('#e8e4f0', '#2a2255')
  .replace('#1c1040', '#FFFFFF')
  .replace('#b0a8c8', '#6b5fa0')
  .replace('box-shadow: 0 2px 24px rgba(0,0,0,0.07)', 'box-shadow: 0 2px 32px rgba(0,0,0,0.4)');

await page.setContent(darkLogoHtml, { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: path.join(outDir, 'logo-full-dark.png'), clip: { x:0,y:0,width:800,height:380 }, omitBackground: true });
console.log('✓  logo-full-dark.png');

await browser.close();
console.log(`\nAll files → ${outDir}`);
