import type { CampaignConfig } from './types';

const baseBoard = {
  showLiveTears: true,
  showWinnerTicker: true,
  showPrizesRemaining: true,
  showLeaders: true,
  maskIdentity: true,
  winDelaySec: 2,
};

const baseWeights = { common: 68, rare: 22, epic: 8, grail: 2 };

/** Scene 1 — Instant Win at a stadium: one scan, one pack, win or try again */
const stadium: CampaignConfig = {
  id: 'stadium',
  name: 'Stadium Gold — Halftime Instant Win',
  sponsor: 'Meridian FC',
  themeId: 'stadium',
  mode: 'instant',
  packSize: 1,
  cards: [
    { id: 'win-jersey', name: 'Signed Jersey', subtitle: 'You won!', rarity: 'grail', image: 'card-win-jersey.webp', isPrize: true, prizeName: 'Signed Team Jersey' },
    { id: 'miss', name: 'Try Again', subtitle: 'So close!', rarity: 'miss', image: 'card-miss.webp' },
  ],
  tags: [
    {
      id: 'gate-a',
      name: 'Gate A Poster',
      location: 'North Entrance',
      cardIds: [],
      packsPerScan: 1,
      maxOpensPerDevice: 1,
      color: '#f5c542',
    },
    {
      id: 'concourse',
      name: 'Concourse Cup QR',
      location: 'Section 114',
      cardIds: [],
      packsPerScan: 1,
      maxOpensPerDevice: 1,
      color: '#1c62f0',
    },
  ],
  instant: {
    winOdds: 0.25,
    prizeName: 'Signed Team Jersey',
    inventory: 8,
    winnerCardId: 'win-jersey',
    missCardId: 'miss',
  },
  collectN: { setCardIds: [], n: 0, prizeName: '', inventory: 0 },
  rarityWeights: baseWeights,
  board: { ...baseBoard, brandName: 'MERIDIAN FC', tagline: 'Scan. Tear. Win the jersey.' },
};

/** Scene 2 — Collector: 6-card set across 3 floor locations */
const arcade: CampaignConfig = {
  id: 'arcade',
  name: 'Neon Arcade — Collect the Set',
  sponsor: 'Pixel Palace Expo',
  themeId: 'arcade',
  mode: 'collectN',
  packSize: 2,
  cards: [
    { id: 'joystick', name: 'Joystick', subtitle: 'Set 1 of 6', rarity: 'common', image: 'card-joystick.webp' },
    { id: 'coin', name: 'Gold Token', subtitle: 'Set 2 of 6', rarity: 'common', image: 'card-coin.webp' },
    { id: 'cabinet', name: 'Arcade Cabinet', subtitle: 'Set 3 of 6', rarity: 'rare', image: 'card-cabinet.webp' },
    { id: 'highscore', name: 'High Score', subtitle: 'Set 4 of 6', rarity: 'rare', image: 'card-highscore.webp' },
    { id: 'ghost', name: 'Neon Ghost', subtitle: 'Set 5 of 6', rarity: 'epic', image: 'card-ghost.webp' },
    { id: 'crown', name: 'Pixel Crown', subtitle: 'Set 6 of 6', rarity: 'grail', image: 'card-crown.webp' },
  ],
  tags: [
    {
      id: 'hall-a',
      name: 'Hall A Kiosk',
      location: 'Main Floor',
      cardIds: ['joystick', 'coin', 'cabinet'],
      packsPerScan: 1,
      maxOpensPerDevice: 3,
      color: '#ff4fd8',
    },
    {
      id: 'hall-b',
      name: 'Hall B NFC Table',
      location: 'Indie Alley',
      cardIds: ['coin', 'cabinet', 'highscore', 'ghost'],
      packsPerScan: 1,
      maxOpensPerDevice: 3,
      color: '#37f0e0',
    },
    {
      id: 'stage',
      name: 'Main Stage Drop',
      location: 'Tournament Stage',
      cardIds: ['highscore', 'ghost', 'crown'],
      packsPerScan: 1,
      maxOpensPerDevice: 2,
      color: '#a04fff',
    },
  ],
  instant: { winOdds: 0, prizeName: '', inventory: 0, winnerCardId: '', missCardId: '' },
  collectN: {
    setCardIds: ['joystick', 'coin', 'cabinet', 'highscore', 'ghost', 'crown'],
    n: 6,
    prizeName: 'Golden Ticket — Free Play All Weekend',
    inventory: 5,
  },
  rarityWeights: { common: 55, rare: 30, epic: 11, grail: 4 },
  board: { ...baseBoard, brandName: 'PIXEL PALACE', tagline: 'Collect all 6. Unlock the Golden Ticket.' },
};

/** Scene 3 — Cards ARE the prizes, tiered rarity, every pull matters */
const festival: CampaignConfig = {
  id: 'festival',
  name: 'Festival Foil — Every Card Wins',
  sponsor: 'Solstice Music Festival',
  themeId: 'festival',
  mode: 'cardsArePrizes',
  packSize: 3,
  cards: [
    { id: 'sticker', name: 'Sticker Pack', subtitle: 'Merch tent pickup', rarity: 'common', image: 'card-sticker.webp', isPrize: true, prizeName: 'Sticker Pack', inventory: 200 },
    { id: 'water', name: 'Free Water', subtitle: 'Any vendor', rarity: 'common', image: 'card-water.webp', isPrize: true, prizeName: 'Free Water Bottle', inventory: 200 },
    { id: 'tote', name: 'Festival Tote', subtitle: 'Merch tent pickup', rarity: 'rare', image: 'card-tote.webp', isPrize: true, prizeName: 'Limited Tote Bag', inventory: 40 },
    { id: 'poster', name: 'Foil Poster', subtitle: 'Numbered print', rarity: 'rare', image: 'card-poster.webp', isPrize: true, prizeName: 'Numbered Foil Poster', inventory: 25 },
    { id: 'vip', name: 'VIP Upgrade', subtitle: 'Tonight only', rarity: 'epic', image: 'card-vip.webp', isPrize: true, prizeName: 'VIP Deck Upgrade', inventory: 6 },
    { id: 'backstage', name: 'Backstage Pass', subtitle: 'The grail.', rarity: 'grail', image: 'card-backstage.webp', isPrize: true, prizeName: 'Backstage Pass', inventory: 2 },
  ],
  tags: [
    {
      id: 'main-gate',
      name: 'Main Gate Arch',
      location: 'Festival Entrance',
      cardIds: [],
      packsPerScan: 1,
      maxOpensPerDevice: 1,
      color: '#ff8a3d',
    },
    {
      id: 'art-walk',
      name: 'Art Walk Totem',
      location: 'Installation Field',
      cardIds: [],
      packsPerScan: 1,
      maxOpensPerDevice: 1,
      color: '#a04fff',
    },
  ],
  instant: { winOdds: 0, prizeName: '', inventory: 0, winnerCardId: '', missCardId: '' },
  collectN: { setCardIds: [], n: 0, prizeName: '', inventory: 0 },
  rarityWeights: { common: 70, rare: 22, epic: 6, grail: 2 },
  board: { ...baseBoard, brandName: 'SOLSTICE', tagline: 'Every card is a prize. Some are grails.' },
};

/** Scene 4 — Retail sponsor drop: instant win with unique coupon codes */
const retail: CampaignConfig = {
  id: 'retail',
  name: 'Retail Drop — Coupon Instant Win',
  sponsor: 'North & Oak Co.',
  themeId: 'retail',
  mode: 'instant',
  packSize: 1,
  cards: [
    { id: 'win-coupon', name: '40% Off Everything', subtitle: 'Unique code inside', rarity: 'epic', image: 'card-win-coupon.webp', isPrize: true, prizeName: '40% Off Coupon' },
    { id: 'miss', name: 'Try Again', subtitle: 'Come back tomorrow', rarity: 'miss', image: 'card-miss.webp' },
  ],
  tags: [
    {
      id: 'register',
      name: 'Register Counter QR',
      location: 'Checkout',
      cardIds: [],
      packsPerScan: 1,
      maxOpensPerDevice: 1,
      color: '#3dd68c',
    },
    {
      id: 'window',
      name: 'Window Decal NFC',
      location: 'Storefront',
      cardIds: [],
      packsPerScan: 1,
      maxOpensPerDevice: 1,
      color: '#eaeef7',
    },
    {
      id: 'receipt',
      name: 'Receipt QR',
      location: 'Printed on receipts',
      cardIds: [],
      packsPerScan: 1,
      maxOpensPerDevice: 2,
      color: '#8fd6ff',
    },
  ],
  instant: {
    winOdds: 0.4,
    prizeName: '40% Off Coupon',
    inventory: 30,
    winnerCardId: 'win-coupon',
    missCardId: 'miss',
  },
  collectN: { setCardIds: [], n: 0, prizeName: '', inventory: 0 },
  rarityWeights: baseWeights,
  board: { ...baseBoard, brandName: 'NORTH & OAK', tagline: 'Tear a pack at checkout.' },
};

export const PRESETS: CampaignConfig[] = [stadium, arcade, festival, retail];

export function presetById(id: string): CampaignConfig | undefined {
  return PRESETS.find((p) => p.id === id);
}
