import type {
  AppState,
  AuditEvent,
  CampaignConfig,
  CardDef,
  DeviceState,
  EventType,
  PullResult,
  Rarity,
  Tag,
  Win,
} from './types';
import { couponCode, uid } from './ids';
import { freshRuntime, getState, setState } from './store';

const MAX_EVENTS = 400;

function ev(
  partial: Omit<AuditEvent, 'id' | 't'>,
): AuditEvent {
  return { ...partial, id: uid('e'), t: Date.now() };
}

function pushEvents(state: AppState, events: AuditEvent[]): void {
  state.runtime.events = [...state.runtime.events, ...events].slice(-MAX_EVENTS);
}

function ensureDevice(state: AppState, deviceId: string, label: string): DeviceState {
  const existing = state.runtime.devices[deviceId];
  if (existing) return existing;
  const dev: DeviceState = { id: deviceId, label, collection: [], opensByTag: {}, wins: [] };
  state.runtime.devices = { ...state.runtime.devices, [deviceId]: dev };
  return dev;
}

function poolForTag(config: CampaignConfig, tag: Tag): CardDef[] {
  const nonMiss = config.cards.filter((c) => c.rarity !== 'miss');
  if (!tag.cardIds.length) return nonMiss;
  return nonMiss.filter((c) => tag.cardIds.includes(c.id));
}

function weightedDraw(config: CampaignConfig, pool: CardDef[], remaining: Record<string, number>): CardDef | null {
  const available = pool.filter((c) => {
    if (c.isPrize && c.inventory !== undefined) return (remaining[c.id] ?? 0) > 0;
    return true;
  });
  const usable = available.length ? available : pool.filter((c) => !c.isPrize || c.inventory === undefined);
  if (!usable.length) return null;
  const weights = usable.map((c) => (c.rarity === 'miss' ? 0 : config.rarityWeights[c.rarity] ?? 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < usable.length; i++) {
    r -= weights[i];
    if (r <= 0) return usable[i];
  }
  return usable[usable.length - 1];
}

function setProgressFor(config: CampaignConfig, dev: DeviceState): { have: number; need: number } {
  const owned = new Set(dev.collection);
  const have = config.collectN.setCardIds.filter((id) => owned.has(id)).length;
  return { have, need: config.collectN.n };
}

export function canOpen(deviceId: string, tagId: string): { ok: boolean; reason?: string } {
  const { config, runtime } = getState();
  const tag = config.tags.find((t) => t.id === tagId);
  if (!tag) return { ok: false, reason: 'Unknown tag' };
  const dev = runtime.devices[deviceId];
  const opens = dev?.opensByTag[tagId] ?? 0;
  if (tag.maxOpensPerDevice > 0 && opens >= tag.maxOpensPerDevice) {
    return { ok: false, reason: 'No packs left at this location for this device' };
  }
  return { ok: true };
}

export function recordScan(deviceId: string, deviceLabel: string, tagId: string): void {
  setState((prev) => {
    const state: AppState = { ...prev, runtime: { ...prev.runtime, events: prev.runtime.events } };
    const tag = state.config.tags.find((t) => t.id === tagId);
    ensureDevice(state, deviceId, deviceLabel);
    pushEvents(state, [
      ev({ deviceId, deviceLabel, tagId, tagName: tag?.name ?? tagId, type: 'scan' }),
    ]);
    return state;
  });
}

/**
 * Opens one pack for a device at a tag. Mutation is atomic through setState,
 * so ten simulated phones drawing at once stay consistent.
 */
export function openPack(deviceId: string, deviceLabel: string, tagId: string): PullResult | { error: string } {
  let result: PullResult | { error: string } = { error: 'unknown' };

  setState((prev) => {
    const state: AppState = {
      ...prev,
      runtime: {
        ...prev.runtime,
        prizeRemaining: { ...prev.runtime.prizeRemaining },
        devices: { ...prev.runtime.devices },
      },
    };
    const config = state.config;
    const tag = config.tags.find((t) => t.id === tagId);
    if (!tag) {
      result = { error: 'Unknown tag' };
      return prev;
    }
    const dev = { ...ensureDevice(state, deviceId, deviceLabel) };
    state.runtime.devices[deviceId] = dev;
    dev.opensByTag = { ...dev.opensByTag };
    dev.collection = [...dev.collection];
    dev.wins = [...dev.wins];

    const opens = dev.opensByTag[tagId] ?? 0;
    if (tag.maxOpensPerDevice > 0 && opens >= tag.maxOpensPerDevice) {
      result = { error: 'No packs left at this location for this device' };
      return prev;
    }
    dev.opensByTag[tagId] = opens + 1;

    const events: AuditEvent[] = [
      ev({ deviceId, deviceLabel, tagId, tagName: tag.name, type: 'open' }),
    ];
    const cards: CardDef[] = [];
    const wins: Win[] = [];
    let setCompleted = false;

    if (config.mode === 'instant') {
      const winner = config.cards.find((c) => c.id === config.instant.winnerCardId);
      const missCard = config.cards.find((c) => c.id === config.instant.missCardId);
      const stock = state.runtime.prizeRemaining.instant ?? 0;
      const isWin = winner && stock > 0 && Math.random() < config.instant.winOdds;
      if (isWin && winner) {
        state.runtime.prizeRemaining.instant = stock - 1;
        cards.push(winner);
        const win: Win = {
          id: uid('w'),
          prizeName: config.instant.prizeName,
          code: couponCode(),
          t: Date.now(),
          redeemed: false,
          sourceCardId: winner.id,
        };
        dev.wins.push(win);
        wins.push(win);
        events.push(
          ev({
            deviceId, deviceLabel, tagId, tagName: tag.name, type: 'pull',
            cardId: winner.id, cardName: winner.name, rarity: winner.rarity,
          }),
          ev({
            deviceId, deviceLabel, tagId, tagName: tag.name, type: 'win',
            cardId: winner.id, cardName: winner.name, rarity: winner.rarity,
            prizeName: win.prizeName, code: win.code,
          }),
        );
      } else if (missCard) {
        cards.push(missCard);
        events.push(
          ev({
            deviceId, deviceLabel, tagId, tagName: tag.name, type: 'miss',
            cardId: missCard.id, cardName: missCard.name, rarity: 'miss',
          }),
        );
      }
    } else {
      const pool = poolForTag(config, tag);
      for (let i = 0; i < Math.max(1, config.packSize); i++) {
        const card = weightedDraw(config, pool, state.runtime.prizeRemaining);
        if (!card) break;
        cards.push(card);
        dev.collection.push(card.id);
        events.push(
          ev({
            deviceId, deviceLabel, tagId, tagName: tag.name, type: 'pull',
            cardId: card.id, cardName: card.name, rarity: card.rarity,
          }),
        );
        if (card.isPrize && config.mode === 'cardsArePrizes') {
          if (card.inventory !== undefined) {
            state.runtime.prizeRemaining[card.id] = (state.runtime.prizeRemaining[card.id] ?? 0) - 1;
          }
          const win: Win = {
            id: uid('w'),
            prizeName: card.prizeName ?? card.name,
            code: couponCode(),
            t: Date.now(),
            redeemed: false,
            sourceCardId: card.id,
          };
          dev.wins.push(win);
          wins.push(win);
          events.push(
            ev({
              deviceId, deviceLabel, tagId, tagName: tag.name, type: 'win',
              cardId: card.id, cardName: card.name, rarity: card.rarity,
              prizeName: win.prizeName, code: win.code,
            }),
          );
        }
      }

      if (config.mode === 'collectN') {
        const progress = setProgressFor(config, dev);
        const alreadyWonSet = dev.wins.some((w) => w.sourceCardId === 'SET');
        const setStock = state.runtime.prizeRemaining.set ?? 0;
        if (!alreadyWonSet && progress.have >= progress.need && setStock > 0) {
          state.runtime.prizeRemaining.set = setStock - 1;
          setCompleted = true;
          const win: Win = {
            id: uid('w'),
            prizeName: config.collectN.prizeName,
            code: couponCode(),
            t: Date.now(),
            redeemed: false,
            sourceCardId: 'SET',
          };
          dev.wins.push(win);
          wins.push(win);
          events.push(
            ev({
              deviceId, deviceLabel, tagId, tagName: tag.name, type: 'setComplete',
              prizeName: win.prizeName, code: win.code,
            }),
            ev({
              deviceId, deviceLabel, tagId, tagName: tag.name, type: 'win',
              prizeName: win.prizeName, code: win.code,
            }),
          );
        }
      }
    }

    pushEvents(state, events);
    const progress = config.mode === 'collectN' ? setProgressFor(config, dev) : { have: 0, need: 0 };
    result = { cards, wins, setCompleted, setProgress: progress };
    return state;
  });

  return result;
}

export function redeemWin(deviceId: string, winId: string): void {
  setState((prev) => {
    const dev = prev.runtime.devices[deviceId];
    if (!dev) return prev;
    const wins = dev.wins.map((w) => (w.id === winId ? { ...w, redeemed: true } : w));
    const win = wins.find((w) => w.id === winId);
    const state: AppState = {
      ...prev,
      runtime: {
        ...prev.runtime,
        devices: { ...prev.runtime.devices, [deviceId]: { ...dev, wins } },
      },
    };
    if (win) {
      pushEvents(state, [
        ev({
          deviceId, deviceLabel: dev.label, tagId: '', tagName: '',
          type: 'redeem', prizeName: win.prizeName, code: win.code,
        }),
      ]);
    }
    return state;
  });
}

/** Wipe all plays and restore configured inventory. Config stays. */
export function resetRuntime(): void {
  setState((prev) => ({ ...prev, runtime: freshRuntime(prev.config) }));
}

/** Replace the campaign config and reset the runtime to match. */
export function applyConfig(config: CampaignConfig): void {
  setState((prev) => ({ ...prev, config, runtime: freshRuntime(config) }));
}

/** Update config without resetting plays (light edits like board toggles). */
export function patchConfig(patch: Partial<CampaignConfig>): void {
  setState((prev) => ({ ...prev, config: { ...prev.config, ...patch } }));
}

export interface Stats {
  scans: number;
  packsOpened: number;
  cardsPulled: number;
  byRarity: Record<Rarity, number>;
  prizesWon: number;
  redeemed: number;
  byTag: Record<string, { name: string; opens: number; wins: number }>;
}

export function computeStats(state: AppState): Stats {
  const byRarity: Record<Rarity, number> = { miss: 0, common: 0, rare: 0, epic: 0, grail: 0 };
  const byTag: Stats['byTag'] = {};
  let scans = 0;
  let packsOpened = 0;
  let cardsPulled = 0;
  let prizesWon = 0;
  let redeemed = 0;
  for (const e of state.runtime.events) {
    const type = e.type as EventType;
    if (type === 'scan') scans++;
    if (type === 'open') {
      packsOpened++;
      if (e.tagId) {
        byTag[e.tagId] = byTag[e.tagId] ?? { name: e.tagName, opens: 0, wins: 0 };
        byTag[e.tagId].opens++;
      }
    }
    if (type === 'pull' || type === 'miss') {
      cardsPulled++;
      if (e.rarity) byRarity[e.rarity]++;
    }
    if (type === 'win') {
      prizesWon++;
      if (e.tagId) {
        byTag[e.tagId] = byTag[e.tagId] ?? { name: e.tagName, opens: 0, wins: 0 };
        byTag[e.tagId].wins++;
      }
    }
    if (type === 'redeem') redeemed++;
  }
  return { scans, packsOpened, cardsPulled, byRarity, prizesWon, redeemed, byTag };
}
