import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';
import { species } from '../data/species';
import { makeMonster, Monster } from '../state';

// Placeholder wild-encounter screen. The real battle system (M3) replaces this;
// the encounter roll, species and level generation are already final.
export class EncounterScene implements Scene {
  readonly debugName = 'encounter';

  private wild: Monster;
  private tick = 0;

  constructor(speciesId: string, level: number) {
    this.wild = makeMonster(speciesId, level);
  }

  debug(): Record<string, unknown> {
    return { wildSpecies: this.wild.speciesId, wildLevel: this.wild.level };
  }

  update(g: GameContext): void {
    this.tick++;
    if (this.tick > 30 && (g.input.wasPressed('A') || g.input.wasPressed('B'))) {
      g.scenes.pop();
    }
  }

  draw(g: GameContext, s: Screen): void {
    const def = species(this.wild.speciesId);
    s.clear(0);
    s.frame(4, 4, SCREEN_W - 8, 40);
    s.text(`Wild ${def.name}`, 12, 12);
    s.text(`Lv${this.wild.level}  HP ${this.wild.hp}/${this.wild.stats.hp}`, 12, 26);
    s.frame(0, SCREEN_H - 48, SCREEN_W, 48);
    s.text('The battle system', 8, SCREEN_H - 36);
    s.text('is on its way!  (A)', 8, SCREEN_H - 20);
    if (this.tick % 32 < 16) s.text('▼', SCREEN_W - 14, SCREEN_H - 12);
  }
}
