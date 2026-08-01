import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'logos');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const logos = [
  {
    name: 'A-rising-bar-chart',
    svg: `<svg width="512" height="512" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b1278"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
        <linearGradient id="shine" x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#7c3aed" flood-opacity="0.5"/>
        </filter>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#bg)" filter="url(#shadow)"/>
      <rect width="120" height="120" rx="28" fill="url(#shine)"/>
      <rect x="20" y="72" width="14" height="24" rx="4" fill="white" opacity="0.35"/>
      <rect x="40" y="56" width="14" height="40" rx="4" fill="white" opacity="0.55"/>
      <rect x="60" y="40" width="14" height="56" rx="4" fill="white" opacity="0.75"/>
      <rect x="80" y="28" width="14" height="68" rx="4" fill="white"/>
      <polyline points="27,72 47,56 67,40 87,28" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.8"/>
      <circle cx="87" cy="28" r="4" fill="#fbbf24"/>
    </svg>`,
  },
  {
    name: 'B-kf-monogram',
    svg: `<svg width="512" height="512" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="60%" stop-color="#4c1d95"/>
          <stop offset="100%" stop-color="#6d28d9"/>
        </linearGradient>
        <linearGradient id="txt" x1="20" y1="30" x2="100" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#e0d7ff"/>
          <stop offset="100%" stop-color="#c4b5fd"/>
        </linearGradient>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#7c3aed" flood-opacity="0.8"/>
        </filter>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#bg)"/>
      <circle cx="60" cy="60" r="58" fill="none" stroke="#a78bfa" stroke-width="1.5" opacity="0.4"/>
      <circle cx="60" cy="60" r="46" fill="none" stroke="#7c3aed" stroke-width="1" opacity="0.3"/>
      <text x="18" y="80" font-family="Arial Black, Arial, sans-serif" font-size="54" font-weight="800" fill="url(#txt)" letter-spacing="-3" filter="url(#glow)">KF</text>
      <rect x="26" y="88" width="68" height="2.5" rx="1.5" fill="#7c3aed" opacity="0.6"/>
      <circle cx="96" cy="30" r="5" fill="#fbbf24" opacity="0.9"/>
      <circle cx="96" cy="30" r="8" fill="#fbbf24" opacity="0.2"/>
    </svg>`,
  },
  {
    name: 'C-coin-arrow',
    svg: `<svg width="512" height="512" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#064e3b"/>
          <stop offset="50%" stop-color="#065f46"/>
          <stop offset="100%" stop-color="#047857"/>
        </linearGradient>
        <linearGradient id="coin" x1="30" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fde68a"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#10b981" flood-opacity="0.5"/>
        </filter>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#bg)" filter="url(#shadow)"/>
      <circle cx="55" cy="58" r="33" fill="url(#coin)"/>
      <circle cx="55" cy="58" r="27" fill="none" stroke="#fbbf24" stroke-width="2.5" opacity="0.6"/>
      <text x="45" y="69" font-family="Arial Black, Arial, sans-serif" font-size="30" font-weight="900" fill="#78350f">$</text>
      <circle cx="90" cy="30" r="14" fill="#10b981" opacity="0.9"/>
      <polyline points="84,36 90,24 96,36" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="90" y1="24" x2="90" y2="38" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    name: 'D-candlestick-dark',
    svg: `<svg width="512" height="512" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0c0a1e"/>
          <stop offset="100%" stop-color="#1e1044"/>
        </linearGradient>
        <linearGradient id="wave" x1="10" y1="60" x2="110" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#818cf8"/>
          <stop offset="50%" stop-color="#a78bfa"/>
          <stop offset="100%" stop-color="#c084fc"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#818cf8" flood-opacity="0.7"/>
        </filter>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#bg)"/>
      <line x1="0" y1="40" x2="120" y2="40" stroke="#ffffff" stroke-width="0.5" opacity="0.05"/>
      <line x1="0" y1="60" x2="120" y2="60" stroke="#ffffff" stroke-width="0.5" opacity="0.05"/>
      <line x1="0" y1="80" x2="120" y2="80" stroke="#ffffff" stroke-width="0.5" opacity="0.05"/>
      <rect x="18" y="62" width="10" height="26" rx="3" fill="#7c3aed" opacity="0.7"/>
      <line x1="23" y1="56" x2="23" y2="62" stroke="#7c3aed" stroke-width="2" opacity="0.7"/>
      <rect x="34" y="52" width="10" height="20" rx="3" fill="#a78bfa" opacity="0.8"/>
      <line x1="39" y1="45" x2="39" y2="52" stroke="#a78bfa" stroke-width="2" opacity="0.8"/>
      <rect x="50" y="44" width="10" height="28" rx="3" fill="#a78bfa" opacity="0.9"/>
      <line x1="55" y1="36" x2="55" y2="44" stroke="#a78bfa" stroke-width="2" opacity="0.9"/>
      <rect x="66" y="34" width="10" height="22" rx="3" fill="#c4b5fd"/>
      <line x1="71" y1="26" x2="71" y2="34" stroke="#c4b5fd" stroke-width="2"/>
      <rect x="82" y="22" width="10" height="18" rx="3" fill="#e9d5ff"/>
      <line x1="87" y1="16" x2="87" y2="22" stroke="#e9d5ff" stroke-width="2"/>
      <polyline points="23,58 39,48 55,38 71,28 87,18" stroke="url(#wave)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#glow)"/>
      <text x="14" y="105" font-family="Arial, sans-serif" font-size="17" font-weight="800" fill="white" opacity="0.9" letter-spacing="1">KH FINANCE</text>
    </svg>`,
  },
  {
    name: 'E-gold-crown',
    svg: `<svg width="512" height="512" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#451a03"/>
          <stop offset="50%" stop-color="#78350f"/>
          <stop offset="100%" stop-color="#92400e"/>
        </linearGradient>
        <linearGradient id="crown" x1="20" y1="20" x2="100" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#f59e0b" flood-opacity="0.6"/>
        </filter>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#bg)"/>
      <rect width="120" height="120" rx="28" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.3"/>
      <path d="M22 80 L22 52 L38 66 L60 28 L82 66 L98 52 L98 80 Z" fill="url(#crown)" filter="url(#glow)"/>
      <rect x="22" y="80" width="76" height="10" rx="5" fill="url(#crown)" filter="url(#glow)"/>
      <circle cx="38" cy="66" r="4" fill="#ef4444"/>
      <circle cx="60" cy="28" r="5" fill="#10b981"/>
      <circle cx="82" cy="66" r="4" fill="#3b82f6"/>
      <text x="60" y="108" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="800" fill="#fbbf24" letter-spacing="3" opacity="0.9">GM</text>
    </svg>`,
  },
  {
    name: 'F-arc-gauge',
    svg: `<svg width="512" height="512" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
        <linearGradient id="arc" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#818cf8"/>
          <stop offset="50%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#c084fc"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#7c3aed" flood-opacity="0.9"/>
        </filter>
      </defs>
      <rect width="120" height="120" rx="28" fill="url(#bg)"/>
      <path d="M 22 72 A 38 38 0 1 1 98 72" stroke="url(#arc)" stroke-width="9" stroke-linecap="round" fill="none" filter="url(#glow)"/>
      <line x1="38" y1="68" x2="60" y2="48" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
      <line x1="60" y1="48" x2="82" y2="55" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
      <circle cx="38" cy="68" r="4.5" fill="#818cf8"/>
      <circle cx="60" cy="48" r="5.5" fill="white"/>
      <circle cx="82" cy="55" r="4.5" fill="#c084fc"/>
      <text x="60" y="106" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="#94a3b8" letter-spacing="3">KH · FINANCE</text>
    </svg>`,
  },
];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  for (const logo of logos) {
    const html = `<!DOCTYPE html><html><head><style>
      * { margin:0; padding:0; }
      body { background: transparent; width: 512px; height: 512px; display:flex; align-items:center; justify-content:center; }
    </style></head><body>${logo.svg}</body></html>`;

    await page.setContent(html);
    await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });

    const outPath = path.join(outDir, `logo-${logo.name}.png`);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 512, height: 512 }, omitBackground: true });
    console.log(`✓ ${outPath}`);
  }

  await browser.close();
  console.log('\nAll logos saved to ./logos/');
})();
