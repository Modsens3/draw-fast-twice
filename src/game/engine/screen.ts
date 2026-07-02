import { PALETTE } from './pixelart';
import { drawText } from './font';

export const SCREEN_W = 160;
export const SCREEN_H = 144;

// Wraps the 160x144 logical canvas the game draws into.
export class Screen {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = SCREEN_W;
    this.canvas.height = SCREEN_H;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(colorIndex = 0): void {
    this.ctx.fillStyle = PALETTE[colorIndex];
    this.ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }

  blit(img: CanvasImageSource, x: number, y: number): void {
    this.ctx.drawImage(img, Math.round(x), Math.round(y));
  }

  blitRegion(
    img: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
  ): void {
    this.ctx.drawImage(img, sx, sy, sw, sh, Math.round(dx), Math.round(dy), sw, sh);
  }

  rect(x: number, y: number, w: number, h: number, colorIndex: number): void {
    this.ctx.fillStyle = PALETTE[colorIndex];
    this.ctx.fillRect(x, y, w, h);
  }

  frame(x: number, y: number, w: number, h: number): void {
    // GB-style window: white fill, double dark border with rounded corners.
    this.rect(x, y, w, h, 0);
    this.ctx.fillStyle = PALETTE[3];
    this.ctx.fillRect(x + 2, y, w - 4, 1);
    this.ctx.fillRect(x + 2, y + h - 1, w - 4, 1);
    this.ctx.fillRect(x, y + 2, 1, h - 4);
    this.ctx.fillRect(x + w - 1, y + 2, 1, h - 4);
    this.ctx.fillRect(x + 1, y + 1, 1, 1);
    this.ctx.fillRect(x + w - 2, y + 1, 1, 1);
    this.ctx.fillRect(x + 1, y + h - 2, 1, 1);
    this.ctx.fillRect(x + w - 2, y + h - 2, 1, 1);
    this.ctx.fillRect(x + 2, y + 2, w - 4, 1);
    this.ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
    this.ctx.fillRect(x + 2, y + 2, 1, h - 4);
    this.ctx.fillRect(x + w - 3, y + 2, 1, h - 4);
  }

  text(str: string, x: number, y: number, colorIndex = 3): void {
    drawText(this.ctx, str, x, y, colorIndex);
  }

  // level 0..1: 0 = no fade, 1 = fully dark. Quantized to GB-like steps.
  fade(level: number): void {
    if (level <= 0) return;
    const step = Math.min(3, Math.ceil(level * 3));
    this.ctx.globalAlpha = step / 3;
    this.ctx.fillStyle = PALETTE[3];
    this.ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    this.ctx.globalAlpha = 1;
  }
}
