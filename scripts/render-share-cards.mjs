// Renders the 1200x630 link-preview cards in public/og/ from the site's own
// fonts and photography. Re-run after changing a headline or photo:
//   node scripts/render-share-cards.mjs
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const asset = (p) => pathToFileURL(resolve(root, p)).href;
const font = (pkg, file) => asset(`node_modules/@fontsource/${pkg}/files/${file}`);

const cards = [
  {
    file: "home",
    photo: "public/images/riviera.webp",
    kicker: "Wedding invitations, RSVPs and guest details",
    line1: "Your entire wedding.",
    line2: "Beautifully shared.",
  },
  {
    file: "planners",
    photo: "public/images/wedding-details.webp",
    kicker: "For wedding planners",
    line1: "Keep the system<br>you run on.",
    size: 58,
    line2: "Add the part guests hold.",
  },
  {
    file: "experience",
    photo: "public/images/hero-maison.webp",
    kicker: "The film · forty seconds",
    line1: "Your story,",
    line2: "in motion.",
  },
  {
    file: "contact",
    photo: "public/images/garden.webp",
    kicker: "A little conversation",
    line1: "Tell us what",
    line2: "you’re imagining.",
  },
  {
    file: "start",
    photo: "public/images/wedding-evening.webp",
    kicker: "Your story starts here",
    line1: "Make room",
    line2: "for your people.",
  },
];

const html = (c) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Bodoni;src:url(${font("bodoni-moda", "bodoni-moda-latin-400-normal.woff2")})}
@font-face{font-family:Bodoni;font-style:italic;src:url(${font("bodoni-moda", "bodoni-moda-latin-400-italic.woff2")})}
@font-face{font-family:Manrope;font-weight:400;src:url(${font("manrope", "manrope-latin-400-normal.woff2")})}
@font-face{font-family:Manrope;font-weight:600;src:url(${font("manrope", "manrope-latin-600-normal.woff2")})}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#232619;font-family:Manrope}
.card{position:relative;width:1200px;height:630px}
.copy{position:absolute;inset:0 auto 0 0;width:820px;z-index:1;padding:64px 0 60px 72px;display:flex;flex-direction:column;color:#f8f7f3;
  background:linear-gradient(90deg,#2b2f20 0%,#2b2f20 62%,rgba(43,47,32,.86) 74%,rgba(43,47,32,0) 100%)}
.brand{font-size:26px;font-weight:600;letter-spacing:-1.3px;line-height:1}
.brand span{font-weight:400;margin-left:6px}.brand i{font-style:normal;font-size:10px;vertical-align:top;margin-left:4px;letter-spacing:0}
.kicker{margin-top:auto;font-size:15px;letter-spacing:3.2px;text-transform:uppercase;color:#d9c79e}
h1{margin-top:22px;max-width:700px;font-family:Bodoni;font-weight:400;font-size:var(--size,64px);line-height:1.04;letter-spacing:-1px}
h1 em{display:block;font-style:italic;color:#efe6cf}
.url{margin-top:38px;font-size:17px;color:rgba(248,247,243,.66);letter-spacing:.3px}
.photo{position:absolute;inset:0 0 0 560px;background:url(${asset(c.photo)}) center/cover;filter:saturate(.92)}
</style></head><body><div class="card">
<div class="copy"><div class="brand">VOW<span>MOTION</span><i>®</i></div>
<div class="kicker">${c.kicker}</div><h1 style="--size:${c.size || 64}px">${c.line1}<em>${c.line2}</em></h1>
<div class="url">vowmotionweddings.com</div></div>
<div class="photo"></div></div></body></html>`;

const outDir = resolve(root, "public/og");
mkdirSync(outDir, { recursive: true });
const tmp = resolve(root, ".next/share-card.html");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const c of cards) {
  writeFileSync(tmp, html(c));
  await page.goto(pathToFileURL(tmp).href);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: "png" });
  await sharp(png)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(resolve(outDir, `${c.file}.jpg`));
  console.log(`public/og/${c.file}.jpg`);
}
await browser.close();
