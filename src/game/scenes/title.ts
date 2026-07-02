import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';
import { textWidth } from '../engine/font';
import { IntroScene } from './intro';

export class TitleScene implements Scene {
  readonly debugName = 'title';

  private tick = 0;

  update(g: GameContext): void {
    this.tick++;
    if (g.input.wasPressed('START') || g.input.wasPressed('A')) {
      g.scenes.replace(new IntroScene());
    }
  }

  private centered(s: Screen, text: string, y: number, color = 3): void {
    s.text(text, Math.floor((SCREEN_W - textWidth(text)) / 2), y, color);
  }

  draw(g: GameContext, s: Screen): void {
    s.clear(0);
    s.rect(0, 0, SCREEN_W, 8, 3);
    s.rect(0, SCREEN_H - 8, SCREEN_W, 8, 3);
    this.centered(s, 'CHIMERA', 40);
    this.centered(s, 'RED', 52);
    this.centered(s, 'VERSION', 66, 2);
    if (this.tick % 60 < 40) this.centered(s, 'PRESS START', 100);
    this.centered(s, 'A GEN 1 STYLE ADVENTURE', 120, 2);
  }
}
