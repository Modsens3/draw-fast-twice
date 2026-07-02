import type { Screen } from './screen';
import type { Input } from './input';
import type { GameState } from '../state';

export interface GameContext {
  screen: Screen;
  input: Input;
  scenes: SceneStack;
  state: GameState;
}

export interface Scene {
  // Called at 60Hz while the scene is on top of the stack.
  update(g: GameContext): void;
  draw(g: GameContext, s: Screen): void;
  // Transparent scenes let the scene below them draw first (e.g. dialog over overworld).
  readonly transparent?: boolean;
  // Stable name + optional state snapshot, used by automated tests.
  readonly debugName?: string;
  debug?(): Record<string, unknown>;
}

export class SceneStack {
  private stack: Scene[] = [];

  push(scene: Scene): void {
    this.stack.push(scene);
  }

  pop(): Scene | undefined {
    return this.stack.pop();
  }

  replace(scene: Scene): void {
    this.stack.pop();
    this.stack.push(scene);
  }

  get top(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  get depth(): number {
    return this.stack.length;
  }

  snapshot(): { scenes: string[]; state?: Record<string, unknown> } {
    const scenes = this.stack.map((s) => s.debugName ?? 'scene');
    let state: Record<string, unknown> | undefined;
    for (const s of this.stack) {
      if (s.debug) state = { ...state, ...s.debug() };
    }
    return { scenes, state };
  }

  update(g: GameContext): void {
    this.top?.update(g);
  }

  draw(g: GameContext, s: Screen): void {
    // Find the deepest scene we need to start drawing from.
    let start = this.stack.length - 1;
    while (start > 0 && this.stack[start].transparent) start--;
    for (let i = start; i < this.stack.length; i++) {
      this.stack[i].draw(g, s);
    }
  }
}
