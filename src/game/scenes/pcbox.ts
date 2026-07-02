// Storage PC: withdraw/deposit between party and the box.

import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';
import { species } from '../data/species';

type Mode = 'root' | 'withdraw' | 'deposit';

export class PcScene implements Scene {
  readonly debugName = 'pc';

  private mode: Mode = 'root';
  private rootIndex = 0;
  private index = 0;
  private message = '';

  update(g: GameContext): void {
    if (this.message) {
      if (g.input.wasPressed('A') || g.input.wasPressed('B')) this.message = '';
      return;
    }
    if (this.mode === 'root') {
      const count = 3;
      if (g.input.wasPressed('UP')) this.rootIndex = (this.rootIndex + count - 1) % count;
      if (g.input.wasPressed('DOWN')) this.rootIndex = (this.rootIndex + 1) % count;
      if (g.input.wasPressed('B')) {
        g.scenes.pop();
        return;
      }
      if (g.input.wasPressed('A')) {
        if (this.rootIndex === 0) this.mode = 'withdraw';
        else if (this.rootIndex === 1) this.mode = 'deposit';
        else g.scenes.pop();
        this.index = 0;
      }
      return;
    }

    const list = this.mode === 'withdraw' ? g.state.pc : g.state.party;
    if (g.input.wasPressed('B')) {
      this.mode = 'root';
      return;
    }
    if (list.length === 0) return;
    this.index = Math.min(this.index, list.length - 1);
    if (g.input.wasPressed('UP')) this.index = (this.index + list.length - 1) % list.length;
    if (g.input.wasPressed('DOWN')) this.index = (this.index + 1) % list.length;
    if (!g.input.wasPressed('A')) return;

    if (this.mode === 'withdraw') {
      if (g.state.party.length >= 6) {
        this.message = 'Your team is full!';
        return;
      }
      const mon = g.state.pc.splice(this.index, 1)[0];
      g.state.party.push(mon);
      this.message = `${species(mon.speciesId).name} joined the team!`;
    } else {
      if (g.state.party.length <= 1) {
        this.message = 'Keep at least one!';
        return;
      }
      const mon = g.state.party.splice(this.index, 1)[0];
      g.state.pc.push(mon);
      this.message = `${species(mon.speciesId).name} was stored.`;
    }
  }

  draw(g: GameContext, s: Screen): void {
    s.clear(0);
    s.frame(0, 0, SCREEN_W, SCREEN_H);
    s.text('STORAGE PC', 8, 6);
    if (this.mode === 'root') {
      ['WITHDRAW', 'DEPOSIT', 'LOG OFF'].forEach((o, i) => {
        s.text(o, 20, 26 + i * 14);
        if (i === this.rootIndex) s.text('▶', 8, 26 + i * 14);
      });
      s.text(`BOX: ${g.state.pc.length}  TEAM: ${g.state.party.length}`, 8, 120, 2);
    } else {
      const list = this.mode === 'withdraw' ? g.state.pc : g.state.party;
      s.text(this.mode === 'withdraw' ? 'WITHDRAW:' : 'DEPOSIT:', 8, 18, 2);
      if (list.length === 0) s.text('Empty.', 20, 40);
      list.slice(0, 8).forEach((mon, i) => {
        const y = 30 + i * 13;
        s.text(`${species(mon.speciesId).name} Lv${mon.level}`, 18, y);
        if (i === this.index) s.text('▶', 6, y);
      });
    }
    if (this.message) {
      s.frame(0, SCREEN_H - 32, SCREEN_W, 32);
      s.text(this.message, 8, SCREEN_H - 22);
    }
  }
}
