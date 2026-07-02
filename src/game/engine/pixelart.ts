// Classic DMG green palette, index 0 = lightest, 3 = darkest.
export const PALETTE = ['#e0f8d0', '#88c070', '#346856', '#081820'] as const;

const PALETTE_RGB: [number, number, number][] = [
  [0xe0, 0xf8, 0xd0],
  [0x88, 0xc0, 0x70],
  [0x34, 0x68, 0x56],
  [0x08, 0x18, 0x20],
];

// Parses string-art rows into an offscreen canvas.
// Chars '0'..'3' map to palette indices, '.' is transparent.
export function artToCanvas(rows: string[]): HTMLCanvasElement {
  const h = rows.length;
  const w = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const c = row[x];
      if (c === '.') continue;
      const [r, g, b] = PALETTE_RGB[c.charCodeAt(0) - 48];
      const i = (y * w + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function flipCanvasH(src: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return canvas;
}
