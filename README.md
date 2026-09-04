# VIXI Prize Packs

Web-only trading-card drop: rip a foil pack on a phone, flip the stack, and run a venue board from the same files. No React remake.

**Live demo:** https://ccavins.github.io/Prizing_demo/

Repo: [CCavins/Prizing_demo](https://github.com/CCavins/Prizing_demo)

## Pages

| File | What it is |
| --- | --- |
| `card-player.html` | Phone player — sealed pack, left-to-right seal swipe, pack lowers, card comes out of the mouth, face-down stack, 3D inspect, save vs try another |
| `pack-looks.js` / `pack-looks.css` | Five open recipes: **Trace** (Pocket-style light stage), Crimp, Case, Vault, Salon |
| `card-output2.html` | Venue board (current) — live tears, prizes, QR, countdown |
| `card-output.html` | Venue board (original layout) |
| `card-admin.html` | Admin mock — inventory, drop length, pack cap, redemption |
| `cards-deck.js` | Player / insert / prize cards and foil rarities |
| `cards-sync.js` | Firebase RTDB, or same-device BroadcastChannel + localStorage |

Deep-link a look with `?look=trace` (or `crimp`, `case`, `vault`, `salon`). The chip on the player also opens a recipe sheet.

## Develop

```bash
npm install
npm run dev
```

Open the hub, then **Rip a pack**. Add `?local=1` on the player and a board if you want them to sync on one machine without Firebase.

```bash
# phone player, local sync, Trace look
http://127.0.0.1:5173/card-player.html?local=1&look=trace
```

## Deploy

Pushes to `main` build with Vite (`base` `/Prizing_demo/`) and publish to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

```bash
npm run build
npm run preview
```
