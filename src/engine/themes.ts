export interface ThemeDef {
  id: string;
  name: string;
  accent: string;
  accent2: string;
  /** css background for pages */
  bg: string;
  /** fallback gradient used when generated art is missing */
  packFallback: string;
  cardBackFallback: string;
}

export const THEMES: ThemeDef[] = [
  {
    id: 'stadium',
    name: 'Stadium Gold',
    accent: '#f5c542',
    accent2: '#1c3faa',
    bg: 'radial-gradient(1200px 700px at 20% -10%, #1c3faa33, transparent), linear-gradient(160deg, #0a0e1e, #101a3a)',
    packFallback: 'linear-gradient(160deg, #1c3faa, #0a0e1e 70%)',
    cardBackFallback: 'linear-gradient(135deg, #f5c542, #8a6a10)',
  },
  {
    id: 'arcade',
    name: 'Neon Arcade',
    accent: '#ff4fd8',
    accent2: '#37f0e0',
    bg: 'radial-gradient(1000px 600px at 80% -10%, #ff4fd822, transparent), linear-gradient(160deg, #0c0716, #1b0f33)',
    packFallback: 'linear-gradient(160deg, #ff4fd8, #1b0f33 70%)',
    cardBackFallback: 'linear-gradient(135deg, #37f0e0, #0e4a44)',
  },
  {
    id: 'festival',
    name: 'Festival Foil',
    accent: '#ff8a3d',
    accent2: '#a04fff',
    bg: 'radial-gradient(1100px 650px at 50% -20%, #a04fff26, transparent), linear-gradient(160deg, #140b06, #2a1030)',
    packFallback: 'linear-gradient(160deg, #ff8a3d, #2a1030 70%)',
    cardBackFallback: 'linear-gradient(135deg, #a04fff, #3d1a66)',
  },
  {
    id: 'retail',
    name: 'Retail Drop',
    accent: '#3dd68c',
    accent2: '#eaeef7',
    bg: 'radial-gradient(1000px 600px at 10% -10%, #3dd68c1f, transparent), linear-gradient(160deg, #08110c, #0e1f18)',
    packFallback: 'linear-gradient(160deg, #3dd68c, #08110c 70%)',
    cardBackFallback: 'linear-gradient(135deg, #eaeef7, #7d8798)',
  },
];

export function theme(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** absolute URL for a theme asset, honoring the Vite base path */
export function assetUrl(themeId: string, file: string): string {
  return `${import.meta.env.BASE_URL}assets/${themeId}/${file}`;
}

/** die-cut pack image (transparent background) */
export function packCutUrl(themeId: string): string {
  return assetUrl(themeId, 'pack-cut.webp');
}
