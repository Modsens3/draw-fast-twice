import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';
import { textWidth } from '../engine/font';
import { species } from '../data/species';
import { frontSprite } from '../world/monsterSprites';
import { saveGame } from '../save';

// End-of-game roll: shows the champion's party, records the win, then
// returns to the overworld (post-game continues from the save).
export class HallOfFameScene implements Scene {
  readonly debugName = 'halloffame';

  private tick = 0;
  private saved = false;

  update(g: GameContext): void {
    this.tick++;
    if (!this.saved && this.tick > 4) {
      this.saved = true;
      saveGame(g.state);
    }
    if (this.tick > 60 && (g.input.wasPressed('A') || g.input.wasPressed('START'))) {
      g.scenes.pop();
    }
  }

  private centered(s: Screen, text: string, y: number, color = 3): void {
    s.text(text, Math.floor((SCREEN_W - textWidth(text)) / 2), y, color);
  }

  draw(g: GameContext, s: Screen): void {
    s.clear(0);
    s.rect(0, 0, SCREEN_W, 10, 3);
    s.rect(0, SCREEN_H - 10, SCREEN_W, 10, 3);
    this.centered(s, 'HALL OF FAME', 16);
    this.centered(s, g.state.playerName, 28, 2);

    // Show up to the first three party members as champions.
    const team = g.state.party.slice(0, 3);
    team.forEach((mon, i) => {
      const x = 20 + i * 44;
      s.blit(frontSprite(mon.speciesId), x, 44);
      const def = species(mon.speciesId);
      s.text(`Lv${mon.level}`, x + 8, 94, 2);
      s.text(def.name.slice(0, 6), x, 104, 2);
    });

    if (this.tick % 60 < 40) this.centered(s, 'CONGRATULATIONS!', 120);
  }
}
