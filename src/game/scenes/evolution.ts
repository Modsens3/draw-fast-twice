import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';
import { species } from '../data/species';
import { Monster, refreshStats } from '../state';
import { frontSprite } from '../world/monsterSprites';
import { textWidth } from '../engine/font';

// Post-battle evolution: flicker between forms, then commit the change.
export class EvolutionScene implements Scene {
  readonly debugName = 'evolution';

  private mon: Monster;
  private fromId: string;
  private toId: string;
  private tick = 0;
  private committed = false;
  private doneWait = 0;

  constructor(mon: Monster, toId: string) {
    this.mon = mon;
    this.fromId = mon.speciesId;
    this.toId = toId;
  }

  update(g: GameContext): void {
    this.tick++;
    if (!this.committed && this.tick > 150) {
      this.committed = true;
      this.mon.speciesId = this.toId;
      refreshStats(this.mon);
      g.state.seenDex[this.toId] = true;
      g.state.caughtDex[this.toId] = true;
      this.doneWait = 120;
    }
    if (this.committed) {
      this.doneWait--;
      if (this.doneWait <= 0 || g.input.wasPressed('A')) {
        g.scenes.pop();
      }
    }
  }

  private centered(s: Screen, text: string, y: number): void {
    s.text(text, Math.floor((SCREEN_W - textWidth(text)) / 2), y);
  }

  draw(g: GameContext, s: Screen): void {
    s.clear(0);
    const from = species(this.fromId);
    const to = species(this.toId);
    // Flicker between silhouettes during the transformation.
    const showTo = this.committed || (this.tick > 60 && Math.floor(this.tick / 8) % 2 === 0);
    s.blit(frontSprite(showTo ? this.toId : this.fromId), (SCREEN_W - 48) / 2, 24);
    s.frame(0, SCREEN_H - 48, SCREEN_W, 48);
    if (!this.committed) {
      this.centered(s, `What? ${from.name}`, SCREEN_H - 38);
      this.centered(s, 'is changing!', SCREEN_H - 22);
    } else {
      this.centered(s, `${from.name} evolved`, SCREEN_H - 38);
      this.centered(s, `into ${to.name}!`, SCREEN_H - 22);
    }
  }
}
