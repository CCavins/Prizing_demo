# VIXI Prize Packs — Demo Studio

A fully browser-based mockup of the VIXI Prize Packs product: configure a prize campaign,
simulate up to ten phones tearing packs in one window, and watch a venue video board react live.
No app, no server — everything runs client-side (localStorage + BroadcastChannel keep all
windows in sync on the same machine).

**Live demo:** https://ccavins.github.io/Prizing_cards_demo/

## Views

| Route | What it is |
| --- | --- |
| `#/` | Landing page with the four ready-made scenes |
| `#/admin` | Campaign configurator — locations w/ QR codes, prize logic, inventory, board layout |
| `#/sim` | Phone wall — up to 10 simulated phones, auto/manual play, live stats, reset |
| `#/play` | The phone experience (what a QR scan opens) |
| `#/board` | Venue video board — live tears, winner moments, leaders |

## Game modes

- **Instant Win** — one scan, one pack, one card: prize or "try again" (odds + inventory).
- **Collector** — locations drop different cards; collect N of the set to unlock the prize.
- **Cards are prizes** — every card is a tiered prize with per-card inventory.

## Develop

```bash
npm install
npm run dev
```

## Assets

Theme art (packs, card faces, card backs, board backgrounds) was generated with
Higgsfield Nano Banana. `scripts/gen-assets.sh` regenerates missing assets;
`scripts/cut-packs.mjs` die-cuts the pack images for the tear animation.
