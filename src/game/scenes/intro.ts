import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';
import { DialogScene } from './dialog';
import { OverworldScene } from './overworld';
import { INTRO_TEXT } from '../story';

// Professor's welcome speech, then straight into the overworld.
export class IntroScene implements Scene {
  readonly debugName = 'intro';

  private started = false;

  update(g: GameContext): void {
    if (!this.started) {
      this.started = true;
      g.scenes.push(
        new DialogScene(INTRO_TEXT, () => {
          g.scenes.replace(new OverworldScene(g.state));
        }),
      );
    }
  }

  draw(g: GameContext, s: Screen): void {
    s.clear(0);
    s.rect(0, 0, SCREEN_W, 8, 3);
    s.rect(0, SCREEN_H - 8, SCREEN_W, 8, 3);
    s.text('PROF. LAUREL', 40, 40);
  }
}
