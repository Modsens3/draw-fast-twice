import type { Button } from '../input-types';

export type { Button };

const KEY_MAP: Record<string, Button> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  s: 'DOWN',
  a: 'LEFT',
  d: 'RIGHT',
  W: 'UP',
  S: 'DOWN',
  A: 'LEFT',
  D: 'RIGHT',
  z: 'A',
  Z: 'A',
  ' ': 'A',
  x: 'B',
  X: 'B',
  Escape: 'B',
  Enter: 'START',
  Shift: 'SELECT',
};

export class Input {
  private held = new Set<Button>();
  private pressedThisFrame = new Set<Button>();
  private queue: Button[] = [];

  attach(target: HTMLElement | Window): () => void {
    const down = (e: Event) => {
      const btn = KEY_MAP[(e as KeyboardEvent).key];
      if (!btn) return;
      e.preventDefault();
      if (!this.held.has(btn)) {
        this.held.add(btn);
        this.queue.push(btn);
      }
    };
    const up = (e: Event) => {
      const btn = KEY_MAP[(e as KeyboardEvent).key];
      if (!btn) return;
      this.held.delete(btn);
    };
    target.addEventListener('keydown', down);
    target.addEventListener('keyup', up);
    return () => {
      target.removeEventListener('keydown', down);
      target.removeEventListener('keyup', up);
    };
  }

  // Virtual buttons (touch controls) share the same state.
  virtualDown(btn: Button): void {
    if (!this.held.has(btn)) {
      this.held.add(btn);
      this.queue.push(btn);
    }
  }

  virtualUp(btn: Button): void {
    this.held.delete(btn);
  }

  // Called once per fixed-timestep tick.
  beginFrame(): void {
    this.pressedThisFrame = new Set(this.queue);
    this.queue = [];
  }

  isHeld(btn: Button): boolean {
    return this.held.has(btn);
  }

  // True only on the tick the button went down.
  wasPressed(btn: Button): boolean {
    return this.pressedThisFrame.has(btn);
  }

  heldDirection(): Button | null {
    for (const d of ['UP', 'DOWN', 'LEFT', 'RIGHT'] as const) {
      if (this.held.has(d)) return d;
    }
    return null;
  }
}
