# VIXI Prize Packs
## Potential Use Cases, Features, and Preconditions

Companion to [Prize Pack Requirements](https://docs.google.com/document/d/1UoE5qOkIpt3hiuxW8bjpykUAKh2GrrrRnW3dIlC17Bc/edit?usp=sharing) and the [Prize Packs deck](https://docs.google.com/presentation/d/1WNskBXoAtZ1Lns37aJsCp1CIYyayRG-s5fHVIpTCddw/edit?usp=sharing).

This note is not a build spec. It maps **when** the product is used, **what** has to exist for that use to work, and **how** the phone and the venue screen should stay separate.

**Platform: web only.** Instant, Collector, redemption, and the video board all run in a browser. There is no native iOS or Android app, no App Store / Play Store listing, and no “download the app to play.” A QR scan or NFC tap opens a URL in the phone’s default browser. The venue screen is the same product in a browser tab, usually fullscreen on a laptop, media player, or LED input.

---

## 1. Two play patterns

Everything in Prize Packs sits on one of two loops. They share packs, prizes, and branding. They do not share the same user journey.

| | Instant Win | Collector |
| --- | --- | --- |
| Intent | Get someone a result in one visit | Get someone to move, return, or complete a set |
| Entry | One QR / NFC tap → one browser tab | Many QR / NFC URLs, each opening (or returning to) the same site |
| Session | Seconds to a minute in that tab | Minutes now, or hours / days across tabs and visits |
| Identity | Optional. Browser cache is enough | Strongly recommended. Google login in-browser to keep the set |
| Outcome | Prize or “try again” | Cards saved; prize unlocks when the set is complete |
| Venue screen | Optional hype / “someone just won” | Optional progress, leaders, and live pack-open feed |

A campaign can run only Instant, only Collector, or both (for example Instant at the gate, Collector on the floor).

---

## 2. Instant Win Mode

**Loop:** Scan QR or tap NFC → mobile browser opens the URL → tear one or more packs → prize or “try again” → redeem or leave.

The job is in-the-moment. If the person has to install an app, create an account, hunt for a second URL, or come back later, Instant has failed.

### 2.1 Potential use cases

- **Gate / table-tent drop.** Poster or tent at a booth. One scan, one pack, walk away with a coupon or a miss.
- **Seat drop / program insert.** QR on a program, cup, or lanyard. Open once during a timeout or intermission.
- **Receipt or ticket stub.** Post-purchase “tear a pack” on the way out.
- **Sponsor moment on the show.** Host says “scan now.” The whole room opens the same page in the same 30 seconds.
- **Try-again friendly giveaway.** Odds are visible, inventory is finite, “try again” is an acceptable ending.

### 2.2 Features that belong here

- Single-purpose landing page: brand, pack, tear, result. Nothing else required.
- Tear up to *N* packs in that one session (config, not a second site).
- Clear win / miss states. Miss is “try again,” not a dead end with no copy.
- Immediate redemption path: coupon image, unique code, generic code, save/download image, or redirect — all in the browser.
- No login required. Optional “save this coupon” only after a win.
- One-time or rate-limited play per browser / code, so a shared poster cannot drain inventory.
- Fast first paint in mobile Safari / Chrome on phone data and venue Wi-Fi. Must feel done before the address bar is a problem.

### 2.3 Things that need to be true

- **One scan, one browser page.** The QR / NFC URL *is* the game. No app install, no “open in app,” no email gate before the tear.
- **Result in the first tab.** Prize or miss is decided before they leave or background the browser.
- **Identity is optional.** Browser storage or a play token is enough to stop obvious replays. Private/incognito and cleared site data will forget that — Instant must still complete in the visit.
- **Inventory can survive a spike.** A host-driven scan moment can hit the same campaign at once.
- **Odds and remaining prizes are real.** The client can set prize counts and distribution rules before go-live.
- **Redemption works without an app.** Screenshot-ready coupon, long-press/download image, copy code, or redirect. Native “save to camera roll” is not guaranteed on the web; design for share/download/screenshot first.
- **Miss copy is designed.** Instant dies if “try again” feels broken or empty.

### 2.4 Mobile web UX (Instant)

One vertical flow in the mobile browser. Thumb-reach primary action. No app chrome, no tab bar of our own.

1. **Land** — brand, one line of rules, pack art.
2. **Tear** — gesture or tap; short animation; no extra navigation.
3. **Result** — win art + code / image, or miss + optional second pack if allowed.
4. **Keep** — save image, copy code, or redirect. Then done.

Do not put collection grids, leaderboards, or account walls on this path.

---

## 3. Collector Mode

**Loop:** Scan or tap at a location → mobile browser opens that stop’s URL → tear pack(s) → cards save to a collection in the browser → progress shows what is still needed → complete a set → prize.

The job is movement and return. Each QR / NFC is a *place* (or a *moment*) that unlocks more packs. The person will open the site more than once, often from different URLs, always in a browser — never a stored native app.

### 3.1 Potential use cases

- **Floor crawl.** Booths, rooms, or concourse stops. Each NFC / QR unlocks that location’s pack.
- **Multi-activation day.** Morning keynote QR, afternoon expo NFC, evening after-party QR. Same collection, different URLs.
- **Campus or street trail.** Stops over hours or days. Login is what makes the set survive.
- **Sponsor circuit.** Each sponsor location drops a themed card. Completing the set unlocks the headline prize.
- **Session-to-session collect.** Same venue, return visits. Cache first; Google login to keep progress across devices.

### 3.2 Features that belong here

- Location- or URL-scoped pack unlocks. Scanning location B does not just replay location A.
- Cards persist in the browser first (local cache), then Google login in that same browser to claim / restore the set.
- Live progress: owned cards, missing cards, and what the completed set awards.
- Duplicate handling (keep, trade later, or convert — even a simple “already have this” state).
- Prize unlock when the rule is met (full set, N-of-set, or specific rare card).
- Ability to resume from any location URL in the browser and still land in *their* collection, not a blank game.
- Optional “Add to Home Screen” is a shortcut to the same URL, not a required install and not an app.

### 3.3 Things that need to be true

- **Multiple entry URLs / tags are first-class.** Each QR or NFC maps to a location, pack pool, or unlock rule.
- **Unlock ≠ open.** Tapping the reader grants the right to tear; the collection is the long-lived object.
- **Progress is visible immediately** after each tear. They should know what to hunt next without a FAQ.
- **Identity becomes real when they care.** Anonymous browser cache for the first pack; in-browser Google login before they leave if they want the set to survive a new phone, Safari Intelligent Tracking Prevention, or cleared site data.
- **Locations can be visited out of order.** No assumed path unless the client configures one.
- **Same person, many scans, one collection.** Different QR/NFC URLs must resolve into the same web session / account once they are signed in — not separate mini-sites they cannot stitch together.
- **Anti-farm rules.** Replay of the same tag, sharing one login across a line, and draining a location’s pack pool all need campaign rules.
- **A miss still advances the story.** A common card is progress, not Instant’s “try again.”

### 3.4 Mobile UX (Collector) — separate views

A phone browser cannot honestly show “tear a pack,” “my binder,” and “what I still need” on one screen. Collector should be a small set of full-bleed **web views** (routes or screens in the same site), not one long page and not native app tabs.

| View | Job | Primary action |
| --- | --- | --- |
| **Unlock / Land** | Confirm this location just granted a pack | Tear pack |
| **Tear** | Same ritual as Instant, one pack at a time | Swipe / tap to open |
| **Reveal** | Show the new card(s) large, then file them | Add to collection |
| **Collection** | Binder / grid of owned cards | Open a card, see set progress |
| **Progress / Hunt** | Missing cards, next locations if known | “What do I still need?” |
| **Prize** | Set complete → redeem | Save / copy / redirect |

**Design rules**

- One job per view. Tear never shares the screen with a 12-card grid.
- Collection is a grid of card backs/faces; tap a card for a full-screen detail sheet (art, set, duplicate).
- Progress is a separate strip or view: `4 / 6 collected`, missing card silhouettes, optional “found at Hall B” hints.
- Bottom nav (or a single persistent “Collection” affordance) only after the first card exists. Instant-style campaigns never show it.
- Login is a sheet on *save* or *leave*, not the first frame after a scan.
- Back from Tear/Reveal returns to Collection, not to a dead location splash.
- Thumb-friendly: tear control and “add to collection” in the lower third; legal / odds in a collapsed footer.
- Design for browser chrome: Safari/Chrome address bar, iOS safe area, and `100vh` jumps. Full-bleed art must not hide under the URL bar or home indicator.
- Never intercept the scan with “Get the app.” If they bookmark or add to Home Screen, it is still this website.

**What should not be on the phone**

Venue-scale leaderboards, “someone in section 12 just pulled a rare,” and cinematic pack-open replays belong on the video board, not in the collector’s binder.

---

## 4. Shared layer: inventory, prizes, redemption

Both modes need this. It is not a third game mode.

### 4.1 Features

- Prize inventory: total counts, remaining, per-prize caps.
- Distribution rules and odds the client can set before the show.
- Audit log for the client (who won what, when, from which code / location).
- Coupon image + unique codes (CSV upload, remaining count) + generic codes.
- Delivery (in the browser): download or long-press/save image, copy code, redirect to sponsor / client site, email. SMS only with the stated lead time. Native camera-roll APIs are not assumed.

### 4.2 Things that need to be true

- Odds and remaining stock stay consistent when Instant spikes and Collector drips at the same time (if both run).
- Unique codes cannot be shown twice; exhausted stock fails closed with a designed empty state.
- Redemption artifacts are screenshot- and download-ready in the browser. Wallet passes from the web are stretch, not assumed.
- Audit data is good enough for a sponsor recap, not only for debugging.

---

## 5. Video Board — a separate output

Optional. The game is valid with phones only. The board is a **venue-facing preview**, not a second copy of the mobile UI. It is still the web product: a dedicated URL opened in a browser on the house machine or media player, typically fullscreen (`F11` / kiosk), not a native signage app.

**Loop:** Phones play in mobile browsers. The board *watches* in a desktop/TV browser — live pack tears, recent wins, leaders, and brand.

### 5.1 Potential use cases

- **Concourse or stage LED.** Ambient “packs are opening right now.”
- **Booth backdrop.** People in line see tears and wins while they wait to scan.
- **Watch party / club / bar.** One screen, many phones; the room shares the ritual.
- **Sponsor hero.** Logo, prize art, and “just won” moments without forcing anyone onto the board URL.
- **Collector heat.** Show set leaders or “closest to complete” to pull people to remaining stops.

### 5.2 Features

- Dedicated board URL opened in a browser. Landscape, no phone chrome, no login, no redeem buttons. Must survive a refresh and a flaky venue network without a technician “relaunching an app.”
- Live pack-open animation driven by real phone tears (or a tasteful simulated idle when the room is quiet — idle must be labeled or clearly not a fake win).
- “Someone just won” moments: prize name, masked identity, optional location.
- Leaders of what has been prized: recent winners, prize counts remaining, optional collector progress leaders.
- Modular layout so a client can turn modules on or off (feed, leaders, prize pool, brand panel).
- Delay / privacy: hold a win for N seconds, hide names, show city / handle / “Player 1847” as configured.

### 5.3 Customization (must be first-class)

The board is only useful if it can look like the event, not like a generic widget.

| Layer | What the client should be able to change |
| --- | --- |
| Brand | Logo, colors, type, background, pack art, card backs |
| Motion | Pack-open style, win sting, idle loop, intensity |
| Modules | Live tears on/off, winners ticker, prize remaining, collector leaders |
| Copy | “Someone just won,” prize names, legal line |
| Identity | How much of a player is shown |
| Layout | Safe areas for LED walls, 16:9 vs ultrawide, no UI under a physical bezel |
| Campaign | Which Instant / Collector game(s) feed this board |

Stretch later: AI “Rebrand Studio” to generate a board + pack skin from a brand kit. Day one can be tokens + uploaded art.

### 5.4 Things that need to be true

- **Board never blocks play.** If the house browser or the screen dies, phones still tear and redeem.
- **Board is not a player surface.** No QR-in-QR loops, no “scan the board to play” as the only entry (entry stays on print / NFC / seat QR).
- **Board is a URL.** Ops can open it on a spare laptop in a minute. No installer, no store login, no device-management app.
- **Events are realtime enough.** A win should land on the wall while the person is still holding the phone (seconds, not minutes).
- **Idle is honest.** Do not imply inventory is moving if nobody is playing, unless the client wants a demo loop.
- **Privacy defaults are conservative.** Full names and unique codes never hit the wall.
- **One campaign can drive many boards** (floor + stage), and one board can listen to Instant, Collector, or both.

### 5.5 Board vs phone (do not merge)

| Phone (mobile browser) | Board (browser, fullscreen) |
| --- | --- |
| I tore *my* pack | The room is tearing packs |
| I redeem *my* code | Nobody can redeem from here |
| My collection / my missing cards | Leaders and “just won” |
| Portrait, one thumb, Safari/Chrome chrome | Landscape, glanceable at 20 feet |
| Must work in sunlight and noise | Must work as atmosphere and proof of life |

---

## 6. Entry: QR and NFC → browser

Both modes start the same way physically. The difference is how many tags exist and what each one grants. The payload is always a **https URL**. The OS camera or NFC stack opens it in the default browser.

- **QR** — print, screens, receipts. Instant: one campaign URL. Collector: unique URL per location or pack pool.
- **NFC** — same URL as the QR for that spot, so tap and scan are equivalent. Best for Collector stops and booth counters.
- **Things that need to be true:** tags are durable and obvious; the URL loads in mobile Safari and Chrome without an app interstitial; Collector tags are not interchangeable; Instant tags can be rate-limited; a single NFC tap does not double-fire two packs; deep links stay on the same origin so cookies/storage and Google login still apply.

---

## 6a. Web-only constraints (things that need to be true)

These are true for Instant, Collector, and the board.

- **No native app.** Do not design a flow that requires TestFlight, App Store, Play Store, or a wrapper. “Add to Home Screen” is optional and still a bookmark to the site.
- **Default browser is the client.** iOS Safari and Android Chrome are the primary runtimes. Desktop browsers matter for the board and for staff QA.
- **First URL must play.** After a scan/tap, the page that opens is enough. No redirect chain through an app store.
- **Persistence is browser persistence.** Local cache can vanish (private mode, ITP, user clears data). Collector therefore offers Google login *in the page*. Instant must not depend on surviving past that visit.
- **Gestures are web gestures.** Tear can be tap or swipe in the page. It cannot assume a native gesture recognizer or haptics as a requirement (nice-to-have via the Vibration API only).
- **Media and redeem are web-capable.** Download/share image, copy code, `mailto` / email form, redirect. SMS and Wallet from the browser stay stretch.
- **The board is kiosk-the-browser.** Fullscreen web page, auto-reconnect if the tab reloads. Staff instructions are “open this link,” not “install the player.”

---

## 7. Stretch (from requirements) — where it sits

| Stretch item | Natural home |
| --- | --- |
| Rebrand Studio (auto AI rebrand) | Shared skins for packs + board |
| Apple / Google Wallet pass | Instant and Collector prize keep |
| Record the user | Optional share clip after a tear; board could replay opt-in pulls |

None of these should be required for Instant, Collector, or a board to ship.

---

## 8. Suggested cut for a first version

**Must be true to sell the product as described**

1. Instant: one URL in the mobile browser, tear, win/miss, redeem (image / unique / generic).
2. Collector: multi-URL or NFC unlocks in the same site, browser-cached cards, optional in-page Google save, progress of the set.
3. Inventory + odds + audit.
4. Board as an optional, customizable, read-only **browser** output (live tear + winners). Phone UX stays mobile-web and split into the views above.

**Can wait**

Wallet, SMS, AI rebrand, user recording, trading, and anything that puts board chrome onto the phone.

---

## 9. One-line tests

Use these in a walkthrough with sales or a client.

- **Instant:** “If I scan once, land in Safari or Chrome, and never come back, did I still get a full experience — with no app?”
- **Collector:** “If I tap three different readers today and log in tomorrow in the browser, is it still my set?”
- **Phone:** “Can I tear and file cards with one thumb in a mobile browser, without seeing a leaderboard or an install prompt?”
- **Board:** “Can ops open a URL fullscreen and can the room understand the game — looking like *their* brand — without installing anything?”
