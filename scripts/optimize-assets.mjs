// Moves full-res generated PNGs to assets-src/ (kept out of git) and writes
// web-sized WebP versions into public/assets for the app to use.
import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync, renameSync } from 'node:fs';

const THEMES = ['stadium', 'arcade', 'festival', 'retail'];

for (const t of THEMES) {
  const pub = `public/assets/${t}`;
  const src = `assets-src/${t}`;
  mkdirSync(src, { recursive: true });

  // move any full-res pngs to the source folder
  for (const f of readdirSync(pub)) {
    if (f.endsWith('.png')) renameSync(`${pub}/${f}`, `${src}/${f}`);
  }

  for (const f of readdirSync(src)) {
    if (!f.endsWith('.png')) continue;
    const base = f.replace(/\.png$/, '');
    if (base === 'pack') continue; // source-only; the app uses pack-cut
    const out = `${pub}/${base}.webp`;
    if (existsSync(out)) continue;
    const img = sharp(`${src}/${f}`);
    if (base === 'board-bg') {
      await img.resize(1920, null, { fit: 'inside' }).webp({ quality: 76 }).toFile(out);
    } else if (base === 'pack-cut') {
      await img.webp({ quality: 88 }).toFile(out); // keeps alpha
    } else {
      await img.resize(750, null, { fit: 'inside' }).webp({ quality: 80 }).toFile(out);
    }
    console.log(`ok ${t}/${base}.webp`);
  }
}
