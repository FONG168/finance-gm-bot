import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'logos-v2');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const SIZE = 512;

const logos = [

  // ─── 1. BOLD "K" LETTERMARK ───────────────────────────────────────────────
  // Dark base, single geometric K, gold accent stroke on upper arm
  {
    name: '1-lettermark-K',
    html: `
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0d0820"/>
          <stop offset="100%" stop-color="#140d2e"/>
        </linearGradient>
        <linearGradient id="gold" x1="50" y1="22" x2="82" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fcd34d"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>
        <linearGradient id="vbar" x1="0" y1="20" x2="0" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#c4b5fd"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
      </defs>
      <!-- Background -->
      <rect width="100" height="100" rx="22" fill="url(#bg)"/>
      <!-- Subtle inner glow ring -->
      <rect width="100" height="100" rx="22" fill="none" stroke="#7c3aed" stroke-width="0.6" opacity="0.25"/>

      <!-- K — vertical bar -->
      <rect x="20" y="20" width="11" height="60" rx="3" fill="url(#vbar)"/>

      <!-- K — lower diagonal arm (white) -->
      <path d="M29 50 L76 80" stroke="white" stroke-width="11" stroke-linecap="round" fill="none"/>
      <!-- Lower arm cover-up to create clean K fork from center -->
      <rect x="20" y="20" width="11" height="60" rx="3" fill="url(#vbar)"/>

      <!-- K — upper diagonal arm (gold gradient — the "growth" arm) -->
      <path d="M29 50 L76 20" stroke="url(#gold)" stroke-width="11" stroke-linecap="round" fill="none"/>

      <!-- Gold arrowhead dot at peak -->
      <circle cx="76" cy="20" r="6" fill="#fcd34d"/>
      <circle cx="76" cy="20" r="10" fill="#fcd34d" opacity="0.18"/>
    </svg>`
  },

  // ─── 2. RISING LINE — Pure Minimal ────────────────────────────────────────
  // Violet rounded square, single bold ascending line, gold peak dot
  {
    name: '2-rising-line',
    html: `
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b1278"/>
          <stop offset="100%" stop-color="#5b21b6"/>
        </linearGradient>
        <linearGradient id="line" x1="18" y1="75" x2="82" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#a78bfa"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <!-- Background -->
      <rect width="100" height="100" rx="22" fill="url(#bg)"/>
      <!-- Shine overlay top -->
      <rect width="100" height="50" rx="22" fill="white" opacity="0.04"/>

      <!-- Baseline -->
      <line x1="18" y1="75" x2="82" y2="75" stroke="white" stroke-width="2.5" stroke-linecap="round" opacity="0.2"/>

      <!-- Rising line -->
      <polyline
        points="18,75 35,62 52,45 70,32 82,22"
        stroke="url(#line)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"
        fill="none" filter="url(#glow)"/>

      <!-- Start dot -->
      <circle cx="18" cy="75" r="5" fill="white" opacity="0.5"/>

      <!-- Peak dot — gold -->
      <circle cx="82" cy="22" r="7" fill="#fbbf24"/>
      <circle cx="82" cy="22" r="12" fill="#fbbf24" opacity="0.2"/>
    </svg>`
  },

  // ─── 3. HEXAGON BADGE ─────────────────────────────────────────────────────
  // Clean hexagon, gradient fill, white upward-arrow negative space
  {
    name: '3-hexagon-badge',
    html: `
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0d0820"/>
          <stop offset="100%" stop-color="#1a0d3a"/>
        </linearGradient>
        <linearGradient id="hex" x1="0" y1="10" x2="100" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#6d28d9"/>
          <stop offset="100%" stop-color="#4c1d95"/>
        </linearGradient>
        <linearGradient id="arrow" x1="50" y1="30" x2="50" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#e9d5ff"/>
        </linearGradient>
      </defs>
      <!-- Dark outer bg -->
      <rect width="100" height="100" rx="22" fill="url(#bg)"/>
      <!-- Hexagon: flat-top, centered -->
      <polygon points="50,8 88,29 88,71 50,92 12,71 12,29" fill="url(#hex)"/>
      <!-- Hex border -->
      <polygon points="50,8 88,29 88,71 50,92 12,71 12,29" fill="none" stroke="#a78bfa" stroke-width="1.5" opacity="0.5"/>
      <!-- Arrow up — thick, clean -->
      <!-- shaft -->
      <rect x="43.5" y="45" width="13" height="27" rx="3" fill="url(#arrow)"/>
      <!-- arrowhead -->
      <polygon points="50,28 34,50 66,50" fill="url(#arrow)"/>
      <!-- small gold base line -->
      <rect x="36" y="72" width="28" height="4" rx="2" fill="#fbbf24" opacity="0.85"/>
    </svg>`
  },

  // ─── 4. CIRCLE GAUGE — Dashboard Style ────────────────────────────────────
  // Dark square, open gradient arc (gauge), line chart inside, ultra clean
  {
    name: '4-gauge-chart',
    html: `
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0b0b18"/>
          <stop offset="100%" stop-color="#111122"/>
        </linearGradient>
        <linearGradient id="arc" x1="15" y1="65" x2="85" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#818cf8"/>
          <stop offset="50%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#fbbf24"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <!-- Background -->
      <rect width="100" height="100" rx="22" fill="url(#bg)"/>
      <!-- Subtle grid -->
      <line x1="10" y1="68" x2="90" y2="68" stroke="white" stroke-width="0.5" opacity="0.07"/>
      <line x1="10" y1="52" x2="90" y2="52" stroke="white" stroke-width="0.5" opacity="0.07"/>
      <line x1="10" y1="36" x2="90" y2="36" stroke="white" stroke-width="0.5" opacity="0.07"/>

      <!-- Track arc (background) -->
      <path d="M 18 72 A 36 36 0 1 1 82 72"
        stroke="white" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.07"/>

      <!-- Colored arc (progress ~75%) -->
      <path d="M 18 72 A 36 36 0 1 1 75 38"
        stroke="url(#arc)" stroke-width="7" stroke-linecap="round" fill="none" filter="url(#glow)"/>

      <!-- Needle dot at arc end -->
      <circle cx="75" cy="38" r="5.5" fill="#fbbf24"/>
      <circle cx="75" cy="38" r="9" fill="#fbbf24" opacity="0.25"/>

      <!-- Center: small trend line -->
      <polyline points="34,60 44,52 54,44 64,48 72,38"
        stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        fill="none" opacity="0.6"/>
    </svg>`
  },

  // ─── 5. SPLIT DIAMOND — Modern Fintech ────────────────────────────────────
  // Two interlocking shapes: violet triangle up + white triangle down = diamond
  {
    name: '5-split-diamond',
    html: `
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0a0614"/>
          <stop offset="100%" stop-color="#130a28"/>
        </linearGradient>
        <linearGradient id="top" x1="50" y1="15" x2="50" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#a78bfa"/>
          <stop offset="100%" stop-color="#6d28d9"/>
        </linearGradient>
        <linearGradient id="bot" x1="50" y1="50" x2="50" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#e0d7ff" stop-opacity="0.7"/>
        </linearGradient>
      </defs>
      <!-- Background -->
      <rect width="100" height="100" rx="22" fill="url(#bg)"/>

      <!-- Top triangle (violet — pointing up) -->
      <polygon points="50,14 82,54 18,54" fill="url(#top)"/>
      <!-- Bottom triangle (light — pointing down) -->
      <polygon points="50,86 82,46 18,46" fill="url(#bot)"/>

      <!-- Thin gold divider line -->
      <line x1="18" y1="50" x2="82" y2="50" stroke="#fbbf24" stroke-width="1.5" opacity="0.8"/>

      <!-- Center dot -->
      <circle cx="50" cy="50" r="4" fill="#fbbf24"/>
      <circle cx="50" cy="50" r="7" fill="#fbbf24" opacity="0.2"/>
    </svg>`
  },

  // ─── 6. WORDMARK — "KH" Clean Type ───────────────────────────────────────
  // Ultra-clean rounded square, precise two-letter monogram, violet accent
  {
    name: '6-wordmark-KH',
    html: `
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#4c1d95"/>
        </linearGradient>
        <linearGradient id="shine" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15"/>
          <stop offset="55%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- Background -->
      <rect width="100" height="100" rx="22" fill="url(#bg)"/>
      <rect width="100" height="100" rx="22" fill="url(#shine)"/>

      <!-- "K" — left letter -->
      <!-- K vertical bar -->
      <rect x="14" y="28" width="9" height="44" rx="2.5" fill="white"/>
      <!-- K upper arm -->
      <path d="M21 50 L42 28" stroke="white" stroke-width="9" stroke-linecap="round" fill="none"/>
      <!-- K lower arm -->
      <path d="M21 50 L42 72" stroke="white" stroke-width="9" stroke-linecap="round" fill="none"/>

      <!-- Divider dot -->
      <circle cx="50.5" cy="50" r="2.5" fill="white" opacity="0.4"/>

      <!-- "H" — right letter -->
      <!-- H left bar -->
      <rect x="55" y="28" width="9" height="44" rx="2.5" fill="white"/>
      <!-- H right bar -->
      <rect x="77" y="28" width="9" height="44" rx="2.5" fill="white"/>
      <!-- H crossbar -->
      <rect x="55" y="46" width="31" height="8" rx="2.5" fill="white"/>

      <!-- Gold accent underline -->
      <rect x="14" y="79" width="72" height="3" rx="1.5" fill="#fbbf24" opacity="0.9"/>
    </svg>`
  },

];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 2 });

  for (const logo of logos) {
    const html = `<!DOCTYPE html><html><head><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body { width:${SIZE}px; height:${SIZE}px; background:transparent; overflow:hidden; }
      body { display:flex; align-items:center; justify-content:center; }
    </style></head><body>${logo.html}</body></html>`;

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const outPath = path.join(outDir, `logo-${logo.name}.png`);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: SIZE, height: SIZE }, omitBackground: true });
    console.log(`✓  ${logo.name}`);
  }

  await browser.close();
  console.log(`\nAll saved → ${outDir}`);
})();
