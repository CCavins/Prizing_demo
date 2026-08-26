import { useSyncExternalStore } from 'react';
import type { AppState, CampaignConfig, RuntimeState } from './types';
import { PRESETS } from './presets';

const KEY = 'vixi-prizing-v1';
const CHANNEL = 'vixi-prizing';

export function freshRuntime(config: CampaignConfig): RuntimeState {
  const prizeRemaining: Record<string, number> = {};
  if (config.mode === 'instant') prizeRemaining.instant = config.instant.inventory;
  if (config.mode === 'collectN') prizeRemaining.set = config.collectN.inventory;
  for (const c of config.cards) {
    if (c.isPrize && c.inventory !== undefined) prizeRemaining[c.id] = c.inventory;
  }
  return { prizeRemaining, devices: {}, events: [], startedAt: Date.now() };
}

function defaultState(): AppState {
  const config = PRESETS[0];
  return { config, runtime: freshRuntime(config), rev: 0 };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed?.config?.cards && parsed?.runtime) {
        // migrate configs saved before the webp asset switch
        for (const c of parsed.config.cards) {
          if (c.image?.endsWith('.png')) c.image = c.image.replace(/\.png$/, '.webp');
        }
        return parsed;
      }
    }
  } catch {
    // corrupted state falls through to default
  }
  return defaultState();
}

let state: AppState = load();
const listeners = new Set<() => void>();

const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;

bc?.addEventListener('message', (e) => {
  if (e.data?.type === 'state' && typeof e.data.rev === 'number' && e.data.rev !== state.rev) {
    state = e.data.state as AppState;
    listeners.forEach((l) => l());
  }
});

// cross-window fallback when BroadcastChannel is unavailable
window.addEventListener('storage', (e) => {
  if (e.key === KEY && e.newValue) {
    try {
      const next = JSON.parse(e.newValue) as AppState;
      if (next.rev !== state.rev) {
        state = next;
        listeners.forEach((l) => l());
      }
    } catch {
      // ignore
    }
  }
});

export function getState(): AppState {
  return state;
}

export function setState(updater: (prev: AppState) => AppState): AppState {
  state = updater(state);
  state = { ...state, rev: state.rev + 1 };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full — keep going in-memory
  }
  bc?.postMessage({ type: 'state', rev: state.rev, state });
  listeners.forEach((l) => l());
  return state;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}
