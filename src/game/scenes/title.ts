import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';
import { textWidth } from '../engine/font';
import { IntroScene } from './intro';
import { OverworldScene } from './overworld';
import { hasSave, loadGame } from '../save';
import { newGameState } from '../state';

export class TitleScene implements Scene {
  readonly debugName = 'title';

  private tick = 0;
  private menu = false;
  private index = 0;

  update(g: GameContext): void {
    this.tick++;
    if (!this.menu) {
      if (g.input.wasPressed('START') || g.input.wasPressed('A')) {
        if (hasSave()) {
          this.menu = true;
        } else {
          g.state = newGameState();
          g.scenes.replace(new IntroScene());
        }
      }
      return;
    }
    if (g.input.wasPressed('UP') || g.input.wasPressed('DOWN')) this.index ^= 1;
    if (g.input.wasPressed('A') || g.input.wasPressed('START')) {
      if (this.index === 0) {
        const loaded = loadGame();
        if (loaded) {
          g.state = loaded;
          g.scenes.replace(new OverworldScene(g.state));
          return;
        }
      }
      g.state = newGameState();
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
    if (!this.menu) {
      if (this.tick % 60 < 40) this.centered(s, 'PRESS START', 100);
    } else {
      const opts = ['CONTINUE', 'NEW GAME'];
      opts.forEach((o, i) => {
        this.centered(s, o, 92 + i * 14, i === this.index ? 3 : 2);
        if (i === this.index) s.text('▶', 34, 92 + i * 14);
      });
    }
    this.centered(s, 'A GEN 1 STYLE ADVENTURE', 120, 2);
  }
}
