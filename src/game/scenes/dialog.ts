import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';

const MAX_CHARS = 23;
const BOX_H = 48;

function wrap(paragraph: string): string[] {
  const words = paragraph.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if (line.length === 0) {
      line = word;
    } else if (line.length + 1 + word.length <= MAX_CHARS) {
      line += ' ' + word;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// GB-style text box along the bottom of the screen. Reveals text one
// character at a time; A/B advances between two-line pages.
export class DialogScene implements Scene {
  readonly transparent = true;
  readonly debugName = 'dialog';

  private pages: string[][];
  private page = 0;
  private revealed = 0;
  private tick = 0;
  private onClose?: () => void;

  constructor(paragraphs: string[], onClose?: () => void) {
    const lines = paragraphs.flatMap(wrap);
    this.pages = [];
    for (let i = 0; i < lines.length; i += 2) {
      this.pages.push(lines.slice(i, i + 2));
    }
    if (this.pages.length === 0) this.pages.push(['']);
    this.onClose = onClose;
  }

  private pageLength(): number {
    return this.pages[this.page].join('').length;
  }

  update(g: GameContext): void {
    this.tick++;
    const total = this.pageLength();
    if (this.revealed < total) {
      // Hold A/B to fast-forward the typewriter.
      this.revealed += g.input.isHeld('A') || g.input.isHeld('B') ? 2 : 1;
      if (this.revealed > total) this.revealed = total;
      return;
    }
    if (g.input.wasPressed('A') || g.input.wasPressed('B')) {
      if (this.page < this.pages.length - 1) {
        this.page++;
        this.revealed = 0;
      } else {
        g.scenes.pop();
        this.onClose?.();
      }
    }
  }

  draw(g: GameContext, s: Screen): void {
    const top = SCREEN_H - BOX_H;
    s.frame(0, top, SCREEN_W, BOX_H);
    let remaining = this.revealed;
    const lines = this.pages[this.page];
    for (let i = 0; i < lines.length; i++) {
      const show = lines[i].slice(0, Math.max(0, remaining));
      remaining -= lines[i].length;
      s.text(show, 8, top + 12 + i * 16);
    }
    const done = this.revealed >= this.pageLength();
    if (done && this.page < this.pages.length - 1 && this.tick % 32 < 16) {
      s.text('▼', SCREEN_W - 14, top + BOX_H - 12);
    }
  }
}
