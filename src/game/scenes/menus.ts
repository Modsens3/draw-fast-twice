// Overworld menus: START menu, TEAM list, monster SUMMARY, BAG, DEX.
// All GB-style boxed lists driven by the shared Scene stack.

import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';
import { DEX_ORDER, species } from '../data/species';
import { item } from '../data/items';
import { move } from '../data/moves';
import { expForLevel, Monster } from '../state';
import { frontSprite } from '../world/monsterSprites';
import { saveGame } from '../save';
import { getMap } from '../data/maps';
import { DialogScene } from './dialog';
import { BattleScene } from './battle';

function listNav(g: GameContext, index: number, count: number): number {
  if (count === 0) return 0;
  if (g.input.wasPressed('UP')) return (index + count - 1) % count;
  if (g.input.wasPressed('DOWN')) return (index + 1) % count;
  return index;
}

export class StartMenuScene implements Scene {
  readonly transparent = true;
  readonly debugName = 'startmenu';

  private index = 0;
  private options = ['DEX', 'TEAM', 'BAG', 'SAVE', 'EXIT'];

  update(g: GameContext): void {
    this.index = listNav(g, this.index, this.options.length);
    if (g.input.wasPressed('B') || g.input.wasPressed('START')) {
      g.scenes.pop();
      return;
    }
    if (!g.input.wasPressed('A')) return;
    switch (this.options[this.index]) {
      case 'DEX':
        g.scenes.push(new DexScene());
        break;
      case 'TEAM':
        g.scenes.push(new TeamScene());
        break;
      case 'BAG':
        g.scenes.push(new BagScene());
        break;
      case 'SAVE': {
        const ok = saveGame(g.state);
        g.scenes.push(new DialogScene([ok ? `${g.state.playerName} saved the game!` : 'Save failed!']));
        break;
      }
      case 'EXIT':
        g.scenes.pop();
        break;
    }
  }

  draw(g: GameContext, s: Screen): void {
    const w = 64;
    const h = this.options.length * 14 + 10;
    const x = SCREEN_W - w - 2;
    s.frame(x, 2, w, h);
    this.options.forEach((o, i) => {
      s.text(o, x + 16, 9 + i * 14);
      if (i === this.index) s.text('▶', x + 6, 9 + i * 14);
    });
  }
}

export class TeamScene implements Scene {
  readonly debugName = 'team';

  private index = 0;
  // When set, selecting a member applies the item instead of opening the summary.
  private onPick?: (index: number) => void;

  constructor(onPick?: (index: number) => void) {
    this.onPick = onPick;
  }

  update(g: GameContext): void {
    const count = g.state.party.length;
    this.index = listNav(g, this.index, count);
    if (g.input.wasPressed('B')) {
      g.scenes.pop();
      return;
    }
    if (g.input.wasPressed('A') && count > 0) {
      if (this.onPick) {
        const pick = this.index;
        g.scenes.pop();
        this.onPick(pick);
      } else {
        g.scenes.push(new SummaryScene(g.state.party[this.index]));
      }
    }
  }

  draw(g: GameContext, s: Screen): void {
    s.clear(0);
    s.frame(0, 0, SCREEN_W, SCREEN_H);
    s.text(this.onPick ? 'Use on which one?' : 'TEAM', 8, 6);
    g.state.party.forEach((mon, i) => {
      const def = species(mon.speciesId);
      const y = 20 + i * 20;
      s.text(`${def.name}`, 18, y);
      s.text(`Lv${mon.level}`, 108, y, 2);
      const ratio = mon.hp / mon.stats.hp;
      s.rect(17, y + 9, 58, 5, 3);
      s.rect(18, y + 10, 56, 3, 0);
      const fill = Math.max(0, Math.round(56 * ratio));
      if (fill > 0) s.rect(18, y + 10, fill, 3, ratio > 0.5 ? 1 : 2);
      s.text(`${mon.hp}/${mon.stats.hp}`, 80, y + 8, 2);
      if (mon.status !== 'OK') s.text(mon.status, 132, y + 8, 2);
      if (i === this.index) s.text('▶', 6, y);
    });
    if (g.state.party.length === 0) s.text('No CHIMERA yet!', 24, 60);
  }
}

export class SummaryScene implements Scene {
  readonly debugName = 'summary';

  private mon: Monster;

  constructor(mon: Monster) {
    this.mon = mon;
  }

  update(g: GameContext): void {
    if (g.input.wasPressed('A') || g.input.wasPressed('B')) g.scenes.pop();
  }

  draw(g: GameContext, s: Screen): void {
    const mon = this.mon;
    const def = species(mon.speciesId);
    s.clear(0);
    s.frame(0, 0, SCREEN_W, SCREEN_H);
    s.blit(frontSprite(mon.speciesId), 8, 8);
    s.text(def.name, 64, 10);
    s.text(`Lv${mon.level}  ${def.types.join('/')}`, 64, 20, 2);
    s.text(`HP ${mon.hp}/${mon.stats.hp}  ${mon.status !== 'OK' ? mon.status : ''}`, 64, 30);
    s.text(`ATK ${mon.stats.atk}  DEF ${mon.stats.def}`, 64, 40, 2);
    s.text(`SPD ${mon.stats.spd}  SPC ${mon.stats.spc}`, 64, 50, 2);
    const next = mon.level < 100 ? expForLevel(def.growth, mon.level + 1) - mon.exp : 0;
    s.text(`EXP ${mon.exp}`, 8, 62, 2);
    s.text(`Next lv in ${Math.max(0, next)}`, 80, 62, 2);
    s.text('MOVES', 8, 76);
    mon.moves.forEach((slot, i) => {
      const m = move(slot.id);
      const y = 88 + i * 12;
      s.text(m.name, 12, y);
      s.text(`${m.type.slice(0, 3)} ${slot.pp}/${slot.maxPp}`, 100, y, 2);
    });
  }
}

export class BagScene implements Scene {
  readonly debugName = 'bag';

  private index = 0;

  update(g: GameContext): void {
    const entries = Object.entries(g.state.bag);
    this.index = Math.min(this.index, Math.max(0, entries.length - 1));
    this.index = listNav(g, this.index, entries.length);
    if (g.input.wasPressed('B')) {
      g.scenes.pop();
      return;
    }
    if (!g.input.wasPressed('A') || entries.length === 0) return;
    const [id] = entries[this.index];
    const def = item(id);
    if (def.effect.kind === 'ball') {
      g.scenes.push(new DialogScene(["Save those for wild CHIMERA! Nothing to catch here."]));
      return;
    }
    if (def.effect.kind === 'rod') {
      const effect = def.effect;
      const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[g.state.dir];
      const facing = getMap(g.state.mapId).behaviorAt(g.state.x + dx, g.state.y + dy);
      if (facing !== 'water') {
        g.scenes.push(new DialogScene(['No good fishing spot here.']));
        return;
      }
      const pool = effect.speciesPool;
      const speciesId = pool[Math.floor(Math.random() * pool.length)];
      const level = effect.minLevel + Math.floor(Math.random() * (effect.maxLevel - effect.minLevel + 1));
      g.scenes.pop(); // close the bag
      g.scenes.pop(); // close the start menu
      g.scenes.push(
        new DialogScene([`${g.state.playerName} cast the ${def.name}...`, 'Oh! A bite!'], () => {
          g.scenes.push(new BattleScene(speciesId, level));
        }),
      );
      return;
    }
    if (def.effect.kind === 'heal' || def.effect.kind === 'cure') {
      const effect = def.effect;
      g.scenes.push(
        new TeamScene((pick) => {
          const mon = g.state.party[pick];
          if (!mon) return;
          if (effect.kind === 'heal') {
            const healed = Math.min(effect.amount, mon.stats.hp - mon.hp);
            if (healed <= 0) {
              g.scenes.push(new DialogScene(['It would have no effect.']));
              return;
            }
            mon.hp += healed;
            g.state.bag[id] > 1 ? (g.state.bag[id] -= 1) : delete g.state.bag[id];
            g.scenes.push(new DialogScene([`${species(mon.speciesId).name} recovered ${healed} HP!`]));
          } else {
            if (mon.status === 'OK') {
              g.scenes.push(new DialogScene(['It would have no effect.']));
              return;
            }
            mon.status = 'OK';
            g.state.bag[id] > 1 ? (g.state.bag[id] -= 1) : delete g.state.bag[id];
            g.scenes.push(new DialogScene([`${species(mon.speciesId).name} feels fine now!`]));
          }
        }),
      );
    }
  }

  draw(g: GameContext, s: Screen): void {
    s.clear(0);
    s.frame(0, 0, SCREEN_W, SCREEN_H);
    s.text('BAG', 8, 6);
    s.text(`$${g.state.money}`, 110, 6, 2);
    const entries = Object.entries(g.state.bag);
    if (entries.length === 0) s.text('It is empty.', 24, 40);
    entries.slice(0, 8).forEach(([id, count], i) => {
      const y = 22 + i * 13;
      s.text(item(id).name, 18, y);
      s.text(`x${count}`, 120, y, 2);
      if (i === this.index) s.text('▶', 6, y);
    });
  }
}

export class DexScene implements Scene {
  readonly debugName = 'dex';

  private index = 0;
  private detail = false;

  update(g: GameContext): void {
    if (this.detail) {
      if (g.input.wasPressed('A') || g.input.wasPressed('B')) this.detail = false;
      return;
    }
    this.index = listNav(g, this.index, DEX_ORDER.length);
    if (g.input.wasPressed('B')) {
      g.scenes.pop();
      return;
    }
    if (g.input.wasPressed('A')) {
      const id = DEX_ORDER[this.index];
      if (g.state.seenDex[id]) this.detail = true;
    }
  }

  draw(g: GameContext, s: Screen): void {
    s.clear(0);
    s.frame(0, 0, SCREEN_W, SCREEN_H);
    const seen = Object.keys(g.state.seenDex).length;
    const caught = Object.keys(g.state.caughtDex).length;
    if (this.detail) {
      const id = DEX_ORDER[this.index];
      const def = species(id);
      s.blit(frontSprite(id), 8, 8);
      s.text(def.name, 64, 12);
      s.text(`the ${def.category}`, 64, 24, 2);
      s.text(`No.${String(def.dexNo).padStart(3, '0')}`, 64, 36, 2);
      s.text(g.state.caughtDex[id] ? 'CAUGHT' : 'SEEN', 64, 48, 2);
      // Wrapped dex entry text.
      const words = def.dexEntry.split(' ');
      let line = '';
      let y = 66;
      for (const w of words) {
        if (line && (line + ' ' + w).length > 24) {
          s.text(line, 8, y);
          y += 11;
          line = w;
        } else line = line ? line + ' ' + w : w;
      }
      if (line) s.text(line, 8, y);
      return;
    }
    s.text('DEX', 8, 6);
    s.text(`SEEN ${seen}  OWN ${caught}`, 64, 6, 2);
    const start = Math.max(0, Math.min(this.index - 4, DEX_ORDER.length - 9));
    DEX_ORDER.slice(start, start + 9).forEach((id, i) => {
      const y = 20 + i * 13;
      const def = species(id);
      const label = g.state.seenDex[id] ? def.name : '-----';
      s.text(`${String(def.dexNo).padStart(3, '0')} ${label}`, 18, y);
      if (g.state.caughtDex[id]) s.text('*', 118, y, 2);
      if (start + i === this.index) s.text('▶', 6, y);
    });
  }
}
