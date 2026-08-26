#!/bin/bash
# Generates all theme art via Higgsfield (Nano Banana) into assets-src/<theme>/
set -u
cd "$(dirname "$0")/.."
mkdir -p assets-src/stadium assets-src/arcade assets-src/festival assets-src/retail

gen() { # theme file aspect prompt
  local theme="$1" file="$2" aspect="$3" prompt="$4"
  local out="assets-src/$theme/$file"
  if [ -s "$out" ]; then echo "SKIP $theme/$file"; return 0; fi
  local url
  url=$(higgsfield generate create nano_banana_2 --prompt "$prompt" --aspect_ratio "$aspect" --wait --wait-timeout 15m --json 2>"/tmp/hf-$theme-$file.err" | jq -r '.[0].result_url // empty')
  if [ -n "$url" ]; then
    curl -s -o "$out" "$url" && echo "OK   $theme/$file"
  else
    echo "FAIL $theme/$file"
  fi
}

CARD_STYLE="full-bleed collectible trading card artwork, premium foil trading card, ornate thin inner frame, dramatic lighting, no words no letters no text no numbers, centered subject"
PACK_STYLE="sealed foil booster pack, straight-on front product view, centered, studio lighting, crisp foil wrapper with vertical crimped seal at top, dark background"

run_theme_stadium() {
  gen stadium pack.png 3:4 "$PACK_STYLE, royal blue and gold soccer club theme, gold laurel crest and stadium floodlights artwork, bold text on pack reads 'PRIZE PACK', premium sports collectible"
  gen stadium back.png 3:4 "trading card back design, royal blue with gold laurel wreath crest centered, symmetrical ornamental corners, subtle stadium light rays, premium matte finish, no text"
  gen stadium board-bg.png 16:9 "wide stadium at night from field level, golden floodlights, dark blue sky, dramatic haze, empty pitch, cinematic, dark moody background suitable for UI overlay"
  gen stadium card-win-jersey.png 3:4 "$CARD_STYLE, glowing golden soccer jersey on invisible mannequin floating over confetti burst, royal blue and gold palette, radiant winner energy"
  gen stadium card-miss.png 3:4 "$CARD_STYLE, deflated gray soccer ball with tiny sad face chalk drawing on stadium concrete, moody blue dusk, gentle humorous tone"
}

run_theme_arcade() {
  gen arcade pack.png 3:4 "$PACK_STYLE, neon retro arcade theme, hot pink and cyan chrome, pixel starburst artwork, bold text on pack reads 'PRIZE PACK', synthwave grid"
  gen arcade back.png 3:4 "trading card back design, dark purple with neon pink and cyan geometric pixel pattern, glowing arcade circuit motif, symmetrical, no text"
  gen arcade board-bg.png 16:9 "wide neon arcade interior at night, rows of glowing cabinets, pink and cyan light, reflective floor, cinematic haze, dark background suitable for UI overlay"
  gen arcade card-joystick.png 3:4 "$CARD_STYLE, chrome arcade joystick with glowing pink ball top, neon cyan grid background, synthwave"
  gen arcade card-coin.png 3:4 "$CARD_STYLE, spinning golden arcade token with star emboss, neon purple background, glowing rim light"
  gen arcade card-cabinet.png 3:4 "$CARD_STYLE, glowing retro arcade cabinet with vibrant marquee, neon pink and cyan, reflective floor"
  gen arcade card-highscore.png 3:4 "$CARD_STYLE, retro CRT screen glowing with abstract pixel fireworks celebration, neon glow, no readable text"
  gen arcade card-ghost.png 3:4 "$CARD_STYLE, cute translucent neon ghost character smiling, electric cyan glow, dark purple haze"
  gen arcade card-crown.png 3:4 "$CARD_STYLE, floating pixelated golden crown radiating light beams, holographic sparkle, legendary aura, dark background"
}

run_theme_festival() {
  gen festival pack.png 3:4 "$PACK_STYLE, music festival sunset theme, iridescent orange and violet holographic foil, sun and palm silhouette artwork, bold text on pack reads 'PRIZE PACK'"
  gen festival back.png 3:4 "trading card back design, deep violet with iridescent orange sunburst mandala centered, festival boho ornament, symmetrical, holographic sheen, no text"
  gen festival board-bg.png 16:9 "wide music festival main stage at dusk, violet and orange stage lights, silhouette crowd with hands up, lens flare, cinematic, dark background suitable for UI overlay"
  gen festival card-sticker.png 3:4 "$CARD_STYLE, colorful holographic sticker sheet fanned out, groovy shapes, violet and orange palette"
  gen festival card-water.png 3:4 "$CARD_STYLE, sparkling water bottle with condensation catching sunset light, festival field background, refreshing glow"
  gen festival card-tote.png 3:4 "$CARD_STYLE, canvas tote bag with abstract sun print floating with soft shadows, violet dusk backdrop"
  gen festival card-poster.png 3:4 "$CARD_STYLE, rolled foil art poster with rainbow holographic edge glinting, dramatic spotlight, collectible print"
  gen festival card-vip.png 3:4 "$CARD_STYLE, glowing velvet rope and golden wristband floating, VIP deck at sunset behind, luxurious warm light"
  gen festival card-backstage.png 3:4 "$CARD_STYLE, radiant laminated backstage pass on lanyard glowing like a relic, god rays, epic legendary aura, violet and gold"
}

run_theme_retail() {
  gen retail pack.png 3:4 "$PACK_STYLE, modern minimal retail brand theme, emerald green and cream, elegant serif monogram artwork, bold text on pack reads 'PRIZE PACK', tactile paper texture"
  gen retail back.png 3:4 "trading card back design, cream paper texture with emerald green art-deco line pattern, centered diamond monogram ornament, symmetrical, letterpress feel, no text"
  gen retail board-bg.png 16:9 "wide upscale minimal retail store interior at night, warm spotlights on shelves, emerald and cream palette, shallow depth, cinematic, dark background suitable for UI overlay"
  gen retail card-win-coupon.png 3:4 "$CARD_STYLE, golden ticket bursting with emerald confetti and ribbon, celebratory, elegant retail luxury feel"
  gen retail card-miss.png 3:4 "$CARD_STYLE, neatly wrapped empty gift box with single wilted ribbon, cream background, gentle humorous tone, soft shadow"
}

# run four themes in parallel; cards within a theme run sequentially
run_theme_stadium &
run_theme_arcade &
run_theme_festival &
run_theme_retail &
wait
echo "ALL DONE"
ls -la assets-src/*/
