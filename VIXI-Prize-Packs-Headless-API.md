# VIXI Prize Packs — Headless / API Layer

A design-less version of Prize Packs. The backend owns the campaign, inventory, logic, login, and issuance. The front end is entirely the client’s — it only decides how things look.

The API never dictates layout, animation, or branding. It returns *what happened* (you got item 1, item 5, a miss, a set prize) plus any code or URL attached to that issue.

---

## 1. Split of responsibility

**Backend (VIXI)**
- Inventories
- Game logic
- Locations / entry tags
- Login (optional)
- Issuing codes and URLs
- Pause / stop
- Claim log

**Front end (client)**
- All visuals: backgrounds, pack tear, card art, motion, copy, layout
- How item 1 vs item 5 is shown
- How a code or URL is presented (copy button, QR, redirect, wallet, etc.)

The front end maps API item ids to its own designs. VIXI does not need those designs uploaded.

---

## 2. What is configured in the backend

Same campaign controls as the setup doc, minus look-and-feel:

- Campaign on / paused / stopped
- Game logic (instant first-N, 1-in-X / %, card-is-the-prize, collect all, collect at least N, collect tiers)
- Items in the pool (id, name, rarity, is-prize, inventory or unlimited)
- Drop weights / odds
- Locations — each QR / NFC is a location with its own item pool (see §2a)
- Fulfillment per prize: generic code or URL, or a unique-code / unique-URL list
- Login: off, optional, or required (e.g. Google) so a collection can follow the person across devices

No pack art, card art, or board layout lives here. Those stay on the client front end.

---

## 2a. Assigning cards to a QR (promenade vs gift shop)

A QR code is just a location id (`tagId`). In the backend you create two locations, print two QRs, and attach a different item pool to each.

Example, same campaign, same player:

- **Promenade** (`tag-promenade`) — pool: `item-1`, `item-2`
- **Gift shop** (`tag-gift-shop`) — pool: `item-5`, and the grail prize card

Each printed QR (or NFC) encodes that location’s URL. The player’s front end reads the tag from the URL and sends it on `POST /open` (`tagId` + session). The API only draws from that location’s pool.

What that means:

- Same campaign and same collection — scanning the gift shop does not replay the promenade pack
- A card’s inventory and unique codes still live on the **card / prize**, not on the QR. Two locations can share a card if you put it in both pools
- Leave a location’s pool empty to mean “any card in the campaign”
- Instant win can still use two QRs that point at different winner cards (promenade = 20% off, gift shop = free tote)

The front end does not decide which card a QR issues. It only passes `tagId`.

---

## 3. Login

- **Off** — anonymous session (cookie / device token). Fine for one-scan instant.
- **Optional** — play first; prompt to save if they want the set to survive a new phone.
- **Required** — must sign in before an open counts. Use when collect progress has to be real.

The API returns the same player record either way. Front end chooses when to show the sign-in UI.

---

## 4. What the front end gets back

Every open (and the player state fetch) returns structured data only. Typical fields:

- `itemId` — stable id the front end already designed for (e.g. `item-1`, `item-5`)
- `name` — optional label from the backend
- `rarity` / `kind` — prize, collectible, miss
- `isNew` — first time this player got it
- `collection` — which item ids they own, counts
- `progress` — have / need, or current tier
- `prizeIssued` — if this open (or this set unlock) awarded something:
  - `prizeId`
  - `fulfillmentType` — `none` | `generic_code` | `generic_url` | `unique_code` | `unique_url`
  - `value` — the code or URL to show / open
  - `issuedAt`
- `canOpenAgain` — whether this location still allows another tear
- `campaignStatus` — live / paused / stopped

The front end uses `itemId` to pick the right art and animation. It uses `value` only when a code or URL was issued.

---

## 5. API surface (for a client front end)

All of this is callable from the client’s own site or app.

- `GET /campaign` — public config: item ids, logic type, login mode, campaign status. No remaining-stock secrets unless the client wants them shown.
- `POST /session` — start or resume a player (anonymous token, or after login).
- `POST /login` — attach an identity to the session when login is enabled.
- `POST /open` — open a pack at a location (`tagId` + session). Runs the logic, decrements inventory, issues a unique code/URL if owed. Returns the payload in section 4.
- `GET /player` — current collection, progress, prizes already issued to this player.
- `GET /board/events` (optional) — recent issues for a venue screen the client designs themselves.

Admin-only (not for the player front end):

- inventories, odds, logic, unique-code upload
- pause / resume / stop
- claim log export

---

## 6. Issuance rules the API always enforces

- Inventory and unique lists are decremented on the server, not the front end.
- A unique code or URL is assigned once, then marked used.
- Empty list or zero inventory → that prize does not issue (front end gets a miss or “sold out” flag).
- Pause / stop is checked before every open.
- Login-required campaigns reject opens without an identity.

The front end should not invent wins. It only displays what `/open` returned.

---

## 7. What the client front end must implement

- Screens for land, tear, reveal, collection, prize, paused, sold out — in whatever design they want
- A map of `itemId` → how that item looks
- Display of `value` when present (code to copy, or URL to open / QR)
- Call `/open` once per tear (don’t retry on success)
- Optional: their own video board, fed by `/board/events`

They do not implement odds, inventory math, or code uniqueness.

---

## 8. Minimum to wire a custom front end

- Campaign created in the backend with item ids the front end already knows
- Logic + inventory + fulfillment lists loaded
- Login mode set
- Location / tag ids for each QR or NFC
- Front end mapped to those item ids and to the `/open` + `/player` responses

---

## 9. Same API, different skin: prize wheel

A prize wheel is not a second game engine. It is a front-end animation on top of Instant Win. The API still picks the result; the wheel only *lands* on what was already issued.

**Backend setup (example: 3 prizes + try again)**
- Logic: Instant — 1-in-X / %, or first N, plus inventory on each prize
- Four items:
  - `prize-a`, `prize-b`, `prize-c` — each with inventory and optional unique codes / URLs
  - `miss` — try again, unlimited
- Odds or weights on those four items
- One location (or several QRs that share the same pool)
- Login off or optional — people usually check in once, spin, done

**Check-in → issue → spin**
1. Player scans the QR / taps NFC (or staff checks them in). Front end starts a session.
2. Front end calls `POST /open` *before* or as the wheel starts. That is the check-in that counts.
3. API returns `itemId` (`prize-b` or `miss`) and, if it’s a win, `prizeIssued.value` (code or URL).
4. Front end plays the wheel animation and **forces it to land on that `itemId`**. The wheel does not roll its own winner.
5. After it stops, show the prize (or try again) and the code / URL if one was issued.

**Why it has to be in that order**
- If the wheel picked first, inventory, unique codes, pause, and “first N” would be wrong.
- Two devices cannot be given the same unique code because issuance already happened on the server.
- A venue screen can listen to `/board/events` and spin a *big* wheel to the same `itemId` the phone just got.

**What the client designs**
- Wheel art, slice labels, tick sound, land animation
- Map `prize-a` / `prize-b` / `prize-c` / `miss` → slices
- Check-in UI (QR, staff button, or kiosk)

They do not implement odds or remaining stock. Those stay in the backend, same as packs.
