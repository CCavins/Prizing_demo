# VIXI Prize Packs — Client Setup Requirements

What a client needs to provide, and what they can configure, to run a campaign.

Web only. Players scan a QR or tap NFC and open a page in the phone browser. No app.

---

## 1. Visual assets to upload

All art is uploaded in the configurator. Recommended: PNG or WebP, portrait cards about 3:4, backgrounds 16:9.

**Campaign look**
- Background image (phone page)
- Optional video-board background (widescreen)
- Logo
- Brand name and tagline
- Accent color
- Pack artwork (the foil pack they tear)
- Card back (shown before a card flips)

**Each card**
- Card name
- Optional subtitle (e.g. “Set 2 of 6”)
- Card face art
- Rarity (common / rare / epic / grail, or “try again”)
- Whether this card is a prize, a collectible, or a miss

---

## 2. Per-card inventory

For any card that is a prize (or a capped collectible):

- How many of this card can be issued
- Or leave it unlimited

When inventory hits zero, that card stops dropping. Other cards in the pack still can.

---

## 3. Game logic (pick one per campaign)

**Instant — the card is the prize (or a miss)**
- Tear a pack. One card comes out.
- That card is either a win or “try again.”
- Use when someone should get a result in one scan.

**Instant — first N win**
- The first N winners get the prize. After that, everyone gets “try again.”
- Example: first 50 people who tear a pack win.

**Instant — 1 out of X / percentage**
- Each open has a set chance to win (e.g. 1 in 10, or 25%).
- Still respects remaining inventory. If stock is gone, it’s a miss even if the roll would have won.

**Collect — the card is the prize**
- Every pulled card can be a prize (different cards = different prizes).
- Inventory and rarity sit on each card.
- Use when the collection itself is the giveaway.

**Collect all**
- Define the set. Player must own every card in the set to unlock the prize.

**Collect at least N**
- Define the set. Player must own any N unique cards from it (not necessarily all).
- Example: 8 cards in the set, prize unlocks at 5.

**Collect tiers**
- Different prizes at different counts.
- Example: 3 cards → sticker, 5 cards → tote, all 6 → VIP.
- Each tier has its own inventory.

A campaign uses one of these. Locations (QR / NFC) can still drop different cards from the same set.

---

## 4. How prizes are fulfilled

Each prize (a specific card, or a collect-set unlock) needs a fulfillment type:

**Generic code or URL**
- Same value for every winner (e.g. `COUPON20`, or `https://client.com/redeem`).
- Shown as text, a button, or both.

**Unique codes or URLs**
- One-time values. Upload a list (CSV).
- Each row is a code *or* a URL.
- System issues the next unused value when someone wins, then marks it used.
- When the list is empty, that prize stops issuing.

**Coupon image**
- Optional image shown with the code / URL (screenshot-friendly).

A prize can mix these: unique code + coupon image, or generic URL only.

---

## 5. What can be attached to what

- A unique-code list can sit on **one card** (that card is the prize).
- Or on **the collect prize** (issued when they hit all / N / a tier).
- Instant win uses one prize definition for the campaign (one list, or one generic value).

---

## 6. Locations (QR / NFC)

- Each location is its own URL + QR (or NFC with the same URL).
- In the backend, assign which cards can drop at that location.
- Example: Promenade QR → cards 1 and 2. Gift shop QR → card 5 (or the prize card). Same campaign, same player collection.
- Leave the pool empty to allow any card in the campaign.
- Inventory and unique codes sit on the card / prize, not on the QR. Two locations can share a card if both lists include it.
- Optional: max opens per device at that location.

---

## 7. Pause and stop

From the backend, at any time:

- **Pause** — existing collections stay; new opens show a “paused” state; no new prizes issue.
- **Resume** — continues from remaining inventory and unused codes.
- **Stop / end** — campaign is over. No more opens. Log stays available.

Pausing does not reset inventory or issued codes.

---

## 8. Logging (claimed, not redeemed)

We can log that a prize was **issued** to a player. We generally cannot know if they later used it at a store or on a sponsor site.

Log each issue with:
- Time
- Prize name
- Card (if any)
- Location / tag
- Device or player id
- Value shown (masked unique code, or the generic code / URL)
- Status: issued

Exportable for the client (CSV). This is the audit of what was claimed from the game — not a redemption proof.

---

## 9. Client checklist (minimum to go live)

- Background, pack art, card back
- Art + name for every card
- One game logic from section 3
- Inventory and/or odds for that logic
- Fulfillment: generic code/URL, or a unique-code/URL list
- At least one location URL
- Who can pause / stop the campaign
