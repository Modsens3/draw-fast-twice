// Mart shop: BUY / SELL with Gen 1-style pricing (sell at half price).

import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';
import { item } from '../data/items';
import { addItem } from '../state';

type Mode = 'root' | 'buy' | 'sell';

export class ShopScene implements Scene {
  readonly debugName = 'shop';

  private stock: string[];
  private mode: Mode = 'root';
  private rootIndex = 0;
  private index = 0;
  private message = '';

  constructor(stock: string[]) {
    this.stock = stock;
  }

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
        if (this.rootIndex === 0) {
          this.mode = 'buy';
          this.index = 0;
        } else if (this.rootIndex === 1) {
          this.mode = 'sell';
          this.index = 0;
        } else {
          g.scenes.pop();
        }
      }
      return;
    }

    const entries = this.mode === 'buy' ? this.stock : Object.keys(g.state.bag);
    if (g.input.wasPressed('B')) {
      this.mode = 'root';
      return;
    }
    if (entries.length === 0) return;
    this.index = Math.min(this.index, entries.length - 1);
    if (g.input.wasPressed('UP')) this.index = (this.index + entries.length - 1) % entries.length;
    if (g.input.wasPressed('DOWN')) this.index = (this.index + 1) % entries.length;
    if (!g.input.wasPressed('A')) return;

    const id = entries[this.index];
    const def = item(id);
    if (this.mode === 'buy') {
      if (g.state.money < def.price) {
        this.message = 'Not enough money!';
        return;
      }
      g.state.money -= def.price;
      addItem(g.state, id, 1);
      this.message = `Bought ${def.name}!`;
    } else {
      const price = Math.floor(def.price / 2);
      addItem(g.state, id, -1);
      g.state.money += price;
      this.message = `Sold ${def.name} for $${price}!`;
    }
  }

  draw(g: GameContext, s: Screen): void {
    s.clear(0);
    s.frame(0, 0, SCREEN_W, SCREEN_H);
    s.text('SHOP', 8, 6);
    s.text(`$${g.state.money}`, 104, 6, 2);

    if (this.mode === 'root') {
      ['BUY', 'SELL', 'LEAVE'].forEach((o, i) => {
        s.text(o, 20, 26 + i * 14);
        if (i === this.rootIndex) s.text('▶', 8, 26 + i * 14);
      });
    } else {
      const entries = this.mode === 'buy' ? this.stock : Object.keys(g.state.bag);
      if (entries.length === 0) s.text('Nothing here.', 20, 40);
      entries.slice(0, 7).forEach((id, i) => {
        const def = item(id);
        const y = 22 + i * 13;
        const price = this.mode === 'buy' ? def.price : Math.floor(def.price / 2);
        const count = this.mode === 'sell' ? ` x${g.state.bag[id]}` : '';
        s.text(`${def.name}${count}`, 18, y);
        s.text(`$${price}`, 116, y, 2);
        if (i === this.index) s.text('▶', 6, y);
      });
    }
    if (this.message) {
      s.frame(0, SCREEN_H - 32, SCREEN_W, 32);
      s.text(this.message, 8, SCREEN_H - 22);
    }
  }
}
