// Procedural battle sprites: each species gets a unique, deterministic,
// symmetric pixel creature generated from its id. Original art by construction.

import { PALETTE } from '../engine/pixelart';

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 16;
const H = 16;
const HALF = W / 2;

// Generates a 16x16 design grid: 0 empty, 1 light fill, 2 shade, 3 outline.
function generateDesign(id: string): number[][] {
  const rng = mulberry32(hashString('chimera:' + id));

  // 1) Random blob on the half grid, biased toward the mirror axis and torso rows.
  let cells: boolean[][] = Array.from({ length: H }, () => Array<boolean>(HALF).fill(false));
  for (let y = 1; y < H - 1; y++) {
    const rowBias = 1 - Math.abs(y - H * 0.55) / (H * 0.6); // torso density peak
    for (let x = 0; x < HALF - 1; x++) {
      const axisBias = 1 - x / HALF; // denser near the center line
      const p = 0.15 + 0.55 * rowBias * axisBias;
      cells[y][x] = rng() < p;
    }
  }

  // 2) Cellular smoothing to clump the blob into a creature-like mass.
  for (let iter = 0; iter < 3; iter++) {
    const next = cells.map((row) => row.slice());
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < HALF; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const yy = y + dy;
            // Mirror across the axis so shapes stay coherent at the seam.
            let xx = x + dx;
            if (xx < 0) xx = 0;
            if (yy < 0 || yy >= H) continue;
            if (xx >= HALF) xx = HALF - 1;
            if (cells[yy][xx]) n++;
          }
        }
        next[y][x] = cells[y][x] ? n >= 3 : n >= 5;
      }
    }
    cells = next;
  }

  // 3) Guarantee a head + body core so nothing degenerates to specks.
  const headY = 3 + Math.floor(rng() * 2);
  const headR = 2 + Math.floor(rng() * 2);
  for (let y = headY - headR; y <= headY + headR; y++) {
    for (let x = 0; x < headR + 1; x++) {
      if (y >= 0 && y < H && Math.abs(y - headY) + x <= headR + 1) cells[y][x] = true;
    }
  }
  const bodyY = 9 + Math.floor(rng() * 2);
  const bodyR = 3 + Math.floor(rng() * 2);
  for (let y = bodyY - bodyR; y <= bodyY + bodyR; y++) {
    for (let x = 0; x < bodyR + 1; x++) {
      if (y >= 0 && y < H && Math.abs(y - bodyY) + x <= bodyR + 1) cells[y][x] = true;
    }
  }
  // Feet so it stands on the ground line.
  for (let x = 1; x < 4; x++) cells[H - 2][x] = true;
  // Clear stray pixels on the outer column for a cleaner silhouette.
  for (let y = 0; y < H; y++) cells[y][HALF - 1] = false;

  // 4) Mirror to the full grid.
  const full: boolean[][] = Array.from({ length: H }, () => Array<boolean>(W).fill(false));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < HALF; x++) {
      if (cells[y][x]) {
        full[y][HALF - 1 - x] = true;
        full[y][HALF + x] = true;
      }
    }
  }

  // 5) Paint: outline where a filled cell borders empty, shade lower-left interior.
  const grid: number[][] = Array.from({ length: H }, () => Array<number>(W).fill(0));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!full[y][x]) continue;
      let edge = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H || !full[yy][xx]) edge = true;
      }
      if (edge) grid[y][x] = 3;
      else grid[y][x] = y > H * 0.6 || rng() < 0.2 ? 2 : 1;
    }
  }

  // 6) Eyes on the head row, symmetric.
  const eyeY = headY;
  const eyeX = HALF - 2 - Math.floor(rng() * 2);
  if (grid[eyeY][eyeX] !== 0) {
    grid[eyeY][eyeX] = 3;
    grid[eyeY][W - 1 - eyeX] = 3;
    if (grid[eyeY][eyeX - 1] !== 0) grid[eyeY][eyeX - 1] = 1;
    if (grid[eyeY][W - eyeX] !== 0) grid[eyeY][W - eyeX] = 1;
  }
  return grid;
}

function renderGrid(grid: number[][], scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = grid[y][x];
      if (v === 0) continue;
      ctx.fillStyle = PALETTE[v === 1 ? 1 : v === 2 ? 2 : 3];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return canvas;
}

const frontCache: Record<string, HTMLCanvasElement> = {};
const backCache: Record<string, HTMLCanvasElement> = {};

// 48x48 front sprite (enemy side).
export function frontSprite(speciesId: string): HTMLCanvasElement {
  if (!frontCache[speciesId]) {
    frontCache[speciesId] = renderGrid(generateDesign(speciesId), 3);
  }
  return frontCache[speciesId];
}

// Chunky 48x48 back view (player side): upper body at double chunk size.
export function backSprite(speciesId: string): HTMLCanvasElement {
  if (!backCache[speciesId]) {
    const grid = generateDesign(speciesId);
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d')!;
    const scale = 6; // 8x8 crop of the upper body, extra chunky
    for (let y = 2; y < 10; y++) {
      for (let x = 4; x < 12; x++) {
        const v = grid[y][x];
        if (v === 0) continue;
        ctx.fillStyle = PALETTE[v === 1 ? 1 : v === 2 ? 2 : 3];
        ctx.fillRect((x - 4) * scale, (y - 2) * scale, scale, scale);
      }
    }
    backCache[speciesId] = canvas;
  }
  return backCache[speciesId];
}

// Player trainer back sprite for the battle intro (original art).
const TRAINER_BACK = [
  '......333333....',
  '.....32222223...',
  '....3222222223..',
  '....3222222223..',
  '....3333333333..',
  '...322222222223.',
  '..32222222222223',
  '..32222222222223',
  '.322222222222223',
  '.322211221122223',
  '3222211221122223',
  '3222222222222223',
  '3222222222222223',
  '3322222222222233',
  '.33222222222233.',
  '..333333333333..',
];

let trainerBackCanvas: HTMLCanvasElement | null = null;

export function trainerBack(): HTMLCanvasElement {
  if (!trainerBackCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d')!;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const c = TRAINER_BACK[y][x];
        if (c === '.') continue;
        ctx.fillStyle = PALETTE[Number(c)];
        ctx.fillRect(x * 3, y * 3, 3, 3);
      }
    }
    trainerBackCanvas = canvas;
  }
  return trainerBackCanvas;
}
