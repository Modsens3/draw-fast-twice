import type { GameContext, Scene } from '../engine/scene';
import type { Screen } from '../engine/screen';

const FADE_TICKS = 18;

// Fade to black, run the callback (e.g. teleport the player), fade back in.
export class FadeTransition implements Scene {
  readonly transparent = true;
  readonly debugName = 'fade';

  private tick = 0;
  private fired = false;
  private midpoint: () => void;

  constructor(midpoint: () => void) {
    this.midpoint = midpoint;
  }

  update(g: GameContext): void {
    this.tick++;
    if (this.tick >= FADE_TICKS && !this.fired) {
      this.fired = true;
      this.midpoint();
    }
    if (this.tick >= FADE_TICKS * 2) {
      g.scenes.pop();
    }
  }

  draw(g: GameContext, s: Screen): void {
    const level =
      this.tick < FADE_TICKS
        ? this.tick / FADE_TICKS
        : 1 - (this.tick - FADE_TICKS) / FADE_TICKS;
    s.fade(level);
  }
}
