// Cuts each theme's pack.png out of its dark studio background:
// flood-fills the connected dark region from the borders to transparency,
// trims to the pack, and centers it on a fixed transparent canvas.
import sharp from 'sharp';
import { existsSync } from 'node:fs';

const THEMES = ['stadium', 'arcade', 'festival', 'retail'];
const LUMA_MAX = 82; // background pixels are darker than this
const OUT_W = 720;
const OUT_H = 1040;

for (const t of THEMES) {
  const src = `assets-src/${t}/pack.png`;
  if (!existsSync(src)) {
    console.log(`missing ${src}`);
    continue;
  }
  const { data, info } = await sharp(src)
    .resize(900, null, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  const luma = (i) => 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
  const visited = new Uint8Array(w * h);
  const queue = [];
  for (let x = 0; x < w; x++) {
    queue.push(x, (h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    queue.push(y * w, y * w + (w - 1));
  }
  while (queue.length) {
    const i = queue.pop();
    if (visited[i]) continue;
    if (luma(i) >= LUMA_MAX) continue;
    visited[i] = 1;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) queue.push(i - 1);
    if (x < w - 1) queue.push(i + 1);
    if (y > 0) queue.push(i - w);
    if (y < h - 1) queue.push(i + w);
  }

  // drop thin horizontal glow streaks: foreground pixels in short vertical runs
  const MIN_RUN = 10;
  for (let x = 0; x < w; x++) {
    let runStart = -1;
    for (let y = 0; y <= h; y++) {
      const fg = y < h && !visited[y * w + x];
      if (fg && runStart === -1) runStart = y;
      if (!fg && runStart !== -1) {
        if (y - runStart < MIN_RUN) {
          for (let yy = runStart; yy < y; yy++) visited[yy * w + x] = 1;
        }
        runStart = -1;
      }
    }
  }

  // soften the cut edge: pixels adjacent to background get partial alpha
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (visited[i]) {
        data[i * 4 + 3] = 0;
      } else {
        const nearBg =
          (x > 0 && visited[i - 1]) || (x < w - 1 && visited[i + 1]) ||
          (y > 0 && visited[i - w]) || (y < h - 1 && visited[i + w]);
        if (nearBg) data[i * 4 + 3] = 140;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX <= minX || maxY <= minY) {
    console.log(`no subject found in ${src}`);
    continue;
  }

  const cut = await sharp(Buffer.from(data), { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .resize(OUT_W - 30, OUT_H - 30, { fit: 'inside' })
    .png()
    .toBuffer();
  const meta = await sharp(cut).metadata();
  await sharp({
    create: { width: OUT_W, height: OUT_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: cut, left: Math.round((OUT_W - meta.width) / 2), top: Math.round((OUT_H - meta.height) / 2) }])
    .png()
    .toFile(`assets-src/${t}/pack-cut.png`);
  console.log(`cut ${t}: subject ${maxX - minX + 1}x${maxY - minY + 1} of ${w}x${h}`);
}
