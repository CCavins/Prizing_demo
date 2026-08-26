export type GameMode = 'instant' | 'collectN' | 'cardsArePrizes';
export type Rarity = 'common' | 'rare' | 'epic' | 'grail' | 'miss';

export const RARITY_ORDER: Rarity[] = ['miss', 'common', 'rare', 'epic', 'grail'];

export const RARITY_LABEL: Record<Rarity, string> = {
  miss: 'Try Again',
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  grail: 'Grail',
};

export interface CardDef {
  id: string;
  name: string;
  subtitle?: string;
  rarity: Rarity;
  /** file name under /assets/<themeId>/ e.g. "card-joystick.png" */
  image?: string;
  /** when set, pulling this card awards a prize */
  isPrize?: boolean;
  prizeName?: string;
  /** max number of times this prize card can drop; undefined = unlimited */
  inventory?: number;
}

export interface Tag {
  id: string;
  name: string;
  location: string;
  /** card ids this tag can drop. Empty = all campaign cards */
  cardIds: string[];
  packsPerScan: number;
  /** max pack opens per device at this tag; 0 = unlimited */
  maxOpensPerDevice: number;
  color: string;
}

export interface BoardConfig {
  showLiveTears: boolean;
  showWinnerTicker: boolean;
  showPrizesRemaining: boolean;
  showLeaders: boolean;
  maskIdentity: boolean;
  brandName: string;
  tagline: string;
  winDelaySec: number;
}

export interface CampaignConfig {
  id: string;
  name: string;
  sponsor: string;
  themeId: string;
  mode: GameMode;
  /** cards per pack (instant mode is forced to 1) */
  packSize: number;
  cards: CardDef[];
  tags: Tag[];
  /** instant mode settings */
  instant: {
    winOdds: number; // 0..1
    prizeName: string;
    inventory: number;
    winnerCardId: string;
    missCardId: string;
  };
  /** collect-N settings */
  collectN: {
    setCardIds: string[];
    n: number;
    prizeName: string;
    inventory: number;
  };
  /** relative drop weights by rarity for pool draws */
  rarityWeights: Record<Exclude<Rarity, 'miss'>, number>;
  board: BoardConfig;
}

export type EventType =
  | 'scan'
  | 'open'
  | 'pull'
  | 'win'
  | 'setComplete'
  | 'redeem'
  | 'miss';

export interface AuditEvent {
  id: string;
  t: number;
  deviceId: string;
  deviceLabel: string;
  tagId: string;
  tagName: string;
  type: EventType;
  cardId?: string;
  cardName?: string;
  rarity?: Rarity;
  prizeName?: string;
  code?: string;
}

export interface Win {
  id: string;
  prizeName: string;
  code: string;
  t: number;
  redeemed: boolean;
  sourceCardId?: string;
}

export interface DeviceState {
  id: string;
  label: string;
  collection: string[]; // cardIds in pull order, dupes allowed
  opensByTag: Record<string, number>;
  wins: Win[];
}

export interface RuntimeState {
  /** remaining inventory. keys: 'instant', 'set', or card ids */
  prizeRemaining: Record<string, number>;
  devices: Record<string, DeviceState>;
  events: AuditEvent[];
  startedAt: number;
}

export interface AppState {
  config: CampaignConfig;
  runtime: RuntimeState;
  rev: number;
}

export interface PullResult {
  cards: CardDef[];
  wins: Win[];
  setCompleted: boolean;
  setProgress: { have: number; need: number };
}
