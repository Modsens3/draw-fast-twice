import type { GameContext, Scene } from '../engine/scene';
import { Screen } from '../engine/screen';
import { CHAR_W } from '../engine/font';

// Small GB-style selection window (YES/NO and friends).
// Calls onChoose with the selected index, or -1 when cancelled with B.
export class ChoiceScene implements Scene {
  readonly transparent = true;
  readonly debugName = 'choice';

  private options: string[];
  private index = 0;
  private onChoose: (index: number) => void;
  private x: number;
  private y: number;

  constructor(options: string[], onChoose: (index: number) => void, x = 96, y = 40) {
    this.options = options;
    this.onChoose = onChoose;
    this.x = x;
    this.y = y;
  }

  update(g: GameContext): void {
    if (g.input.wasPressed('UP')) {
      this.index = (this.index + this.options.length - 1) % this.options.length;
      g.audio.sfx('cursor');
    } else if (g.input.wasPressed('DOWN')) {
      this.index = (this.index + 1) % this.options.length;
      g.audio.sfx('cursor');
    } else if (g.input.wasPressed('A')) {
      g.audio.sfx('confirm');
      g.scenes.pop();
      this.onChoose(this.index);
    } else if (g.input.wasPressed('B')) {
      g.audio.sfx('cancel');
      g.scenes.pop();
      this.onChoose(-1);
    }
  }

  draw(g: GameContext, s: Screen): void {
    const w = Math.max(...this.options.map((o) => o.length)) * CHAR_W + 22;
    const h = this.options.length * 12 + 12;
    s.frame(this.x, this.y, w, h);
    this.options.forEach((opt, i) => {
      s.text(opt, this.x + 14, this.y + 7 + i * 12);
      if (i === this.index) s.text('▶', this.x + 5, this.y + 7 + i * 12);
    });
  }
}
