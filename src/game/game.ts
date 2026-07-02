import { Input } from './engine/input';
import { Screen } from './engine/screen';
import { GameContext, SceneStack } from './engine/scene';
import { GameState, newGameState } from './state';
import { TitleScene } from './scenes/title';

const STEP = 1000 / 60;

export class Game implements GameContext {
  readonly screen = new Screen();
  readonly input = new Input();
  readonly scenes = new SceneStack();
  state: GameState = newGameState();

  private raf = 0;
  private last = 0;
  private acc = 0;
  private detachInput?: () => void;

  start(container: HTMLElement): void {
    this.screen.canvas.className = 'gb-screen';
    container.appendChild(this.screen.canvas);
    // Exposed for automated tests and debugging.
    (window as unknown as { __CHIMERA: Game }).__CHIMERA = this;
    this.detachInput = this.input.attach(window);
    this.scenes.push(new TitleScene());
    this.last = performance.now();
    const frame = (now: number) => {
      this.raf = requestAnimationFrame(frame);
      this.acc += Math.min(now - this.last, 250);
      this.last = now;
      while (this.acc >= STEP) {
        this.acc -= STEP;
        this.input.beginFrame();
        this.scenes.update(this);
      }
      this.scenes.draw(this, this.screen);
    };
    this.raf = requestAnimationFrame(frame);
  }

  // Aggregate snapshot for automated tests.
  debug(): Record<string, unknown> {
    return { depth: this.scenes.depth, ...this.scenes.snapshot() };
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.detachInput?.();
    this.screen.canvas.remove();
  }
}
