// === CYBERPUNK COLOR PALETTE ===
export const COLORS = {
  // Neon Accents
  green: '#00ff41',       // 200 OK — Neon Green
  red: '#ff0a3c',         // 500 Errors — Cyber Red
  purple: '#bf5af2',      // AI Thoughts — Electric Purple
  cyan: '#00d4ff',        // Info / Links
  yellow: '#ffd60a',      // Warnings
  orange: '#ff6b2b',      // Stress / Load
  pink: '#ff2d7b',        // Critical

  // Surfaces
  dark: '#0a0a0a',
  card: '#0e0e14',
  border: 'rgba(0, 255, 65, 0.12)',
  
  // Text
  text: '#e8e8ec',
  textDim: '#4a4a5a',
  textSecondary: '#8b8b9a',
};

export const WS_URL = `ws://${window.location.hostname}:${window.location.port}/ws`;

export const PING_MATRIX = {
  COLS: 25,
  ROWS: 20,
  DOT_SIZE: 8,
  DOT_GAP: 4,
  TOTAL: 500,
};
