import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';
import { TILE, tileCanvas } from '../world/tiles';
import { charSprites, Dir, DIR_DELTA, SpriteId } from '../world/sprites';
import { GameMap, NpcDef, TrainerDef } from '../world/map';
import { makeMonster } from '../state';
import { getMap } from '../data/maps';
import { rollEncounter } from '../data/encounters';
import { blocksMove, handleEvent, rivalStarterId } from '../story';
import type { GameState } from '../state';
import { DialogScene } from './dialog';
import { BattleScene } from './battle';
import { EvolutionScene } from './evolution';
import { StartMenuScene } from './menus';
import { FadeTransition } from './transition';
import { species } from '../data/species';

const WALK_TICKS = 15; // ~0.25s per tile, matching GB walking speed
const HOP_TICKS = 30;

interface Mover {
  x: number;
  y: number;
  dir: Dir;
  sprite: SpriteId;
  moving: boolean;
  fromX: number;
  fromY: number;
  progress: number; // 0..1 across the step
  parity: boolean; // alternates each step for stride A/B
  hopping: boolean;
}

interface Npc extends Mover {
  def: NpcDef;
  homeX: number;
  homeY: number;
  timer: number;
}

function makeMover(x: number, y: number, dir: Dir, sprite: SpriteId): Mover {
  return {
    x,
    y,
    dir,
    sprite,
    moving: false,
    fromX: x,
    fromY: y,
    progress: 1,
    parity: false,
    hopping: false,
  };
}

function pixelPos(m: Mover): { px: number; py: number } {
  const t = m.moving ? m.progress : 1;
  const px = (m.fromX + (m.x - m.fromX) * t) * TILE;
  let py = (m.fromY + (m.y - m.fromY) * t) * TILE;
  if (m.hopping && m.moving) {
    // Simple ledge-hop arc.
    py -= Math.sin(t * Math.PI) * 6;
  }
  return { px, py };
}

function opposite(d: Dir): Dir {
  return d === 'up' ? 'down' : d === 'down' ? 'up' : d === 'left' ? 'right' : 'left';
}

export class OverworldScene implements Scene {
  readonly debugName = 'overworld';

  private map: GameMap;
  private player: Mover;
  private npcs: Npc[] = [];
  private warping = false;
  private state: GameState;
  // Shrubs cut this visit; resets when the map is left, like the original.
  private cleared = new Set<string>();

  constructor(state: GameState) {
    this.state = state;
    this.map = getMap(state.mapId);
    this.player = makeMover(state.x, state.y, state.dir, 'player');
    this.loadNpcs();
  }

  // Keep the persistent state in sync with the player's position.
  private syncState(): void {
    this.state.mapId = this.map.def.id;
    this.state.x = this.player.x;
    this.state.y = this.player.y;
    this.state.dir = this.player.dir;
  }

  private effTile(x: number, y: number) {
    return this.cleared.has(`${x},${y}`) ? 'ground' : this.map.tileAt(x, y);
  }

  private effBehavior(x: number, y: number) {
    return this.cleared.has(`${x},${y}`) ? 'walk' : this.map.behaviorAt(x, y);
  }

  private loadNpcs(): void {
    this.cleared.clear();
    this.npcs = this.map.def.npcs.map((def) => ({
      ...makeMover(def.x, def.y, def.dir, def.sprite),
      def,
      homeX: def.x,
      homeY: def.y,
      timer: 60 + Math.floor(Math.random() * 120),
    }));
  }

  private occupied(x: number, y: number, ignore?: Mover): boolean {
    const movers: Mover[] = [this.player, ...this.npcs];
    return movers.some(
      (m) =>
        m !== ignore &&
        ((m.x === x && m.y === y) || (m.moving && m.fromX === x && m.fromY === y)),
    );
  }

  private passable(x: number, y: number, forNpc: boolean): boolean {
    const b = this.effBehavior(x, y);
    if (b === 'solid' || b === 'water' || b === 'ledge') return false;
    if (forNpc && (b === 'door' || b === 'mat' || b === 'grass')) return false;
    return true;
  }

  private tryStartMove(m: Mover, dir: Dir, forNpc: boolean): boolean {
    m.dir = dir;
    const [dx, dy] = DIR_DELTA[dir];
    const tx = m.x + dx;
    const ty = m.y + dy;

    if (!forNpc && !this.map.inBounds(tx, ty)) {
      return this.tryCrossEdge(tx, ty, dir);
    }

    const behavior = this.effBehavior(tx, ty);
    // Ledges can only be hopped from above, landing one tile further.
    if (!forNpc && behavior === 'ledge' && dir === 'down') {
      const lx = tx;
      const ly = ty + 1;
      if (this.passable(lx, ly, false) && !this.occupied(lx, ly, m)) {
        m.fromX = m.x;
        m.fromY = m.y;
        m.x = lx;
        m.y = ly;
        m.moving = true;
        m.progress = 0;
        m.parity = !m.parity;
        m.hopping = true;
        return true;
      }
      return false;
    }

    if (!this.passable(tx, ty, forNpc) || this.occupied(tx, ty, m)) return false;
    m.fromX = m.x;
    m.fromY = m.y;
    m.x = tx;
    m.y = ty;
    m.moving = true;
    m.progress = 0;
    m.parity = !m.parity;
    m.hopping = false;
    return true;
  }

  // Walking off the map edge follows the map connection, GB-style.
  private tryCrossEdge(tx: number, ty: number, dir: Dir): boolean {
    const conns = this.map.def.connections;
    if (!conns) return false;
    const side = ty < 0 ? 'north' : ty >= this.map.height ? 'south' : tx < 0 ? 'west' : 'east';
    const conn = conns[side];
    if (!conn) return false;
    const dest = getMap(conn.toMap);
    let nx: number;
    let ny: number;
    if (side === 'north' || side === 'south') {
      nx = this.player.x + conn.offset;
      ny = side === 'north' ? dest.height - 1 : 0;
    } else {
      ny = this.player.y + conn.offset;
      nx = side === 'west' ? dest.width - 1 : 0;
    }
    if (!dest.inBounds(nx, ny)) return false;
    const b = dest.behaviorAt(nx, ny);
    if (b === 'solid' || b === 'water' || b === 'ledge') return false;

    this.map = dest;
    this.loadNpcs();
    // Start just off-map on the destination side and step in.
    const [dx, dy] = DIR_DELTA[dir];
    this.player.fromX = nx - dx;
    this.player.fromY = ny - dy;
    this.player.x = nx;
    this.player.y = ny;
    this.player.moving = true;
    this.player.progress = 0;
    this.player.parity = !this.player.parity;
    this.player.hopping = false;
    this.syncState();
    return true;
  }

  // Gen 1-style trainer line of sight: along the facing direction, unobstructed.
  private checkTrainerSight(g: GameContext): boolean {
    for (const npc of this.npcs) {
      const t = npc.def.trainer;
      if (!t || g.state.flags[`beat_${npc.def.id}`] || npc.moving) continue;
      const [dx, dy] = DIR_DELTA[npc.dir];
      for (let dist = 1; dist <= t.sightRange; dist++) {
        const sx = npc.x + dx * dist;
        const sy = npc.y + dy * dist;
        if (this.player.x === sx && this.player.y === sy) {
          this.startTrainerBattle(g, npc.def.id, t);
          return true;
        }
        const b = this.effBehavior(sx, sy);
        if (b === 'solid' || b === 'water' || this.npcs.some((o) => o !== npc && o.x === sx && o.y === sy)) break;
      }
    }
    return false;
  }

  private startTrainerBattle(g: GameContext, npcId: string, t: TrainerDef): void {
    g.scenes.push(
      new DialogScene(t.beforeText, () => {
        g.scenes.push(
          BattleScene.forTrainer({
            name: t.name,
            party: t.party.map(([id, level]) => makeMonster(id, level)),
            prize: t.prize,
            smart: t.smart,
            winText: t.winText,
            onWin: () => {
              g.state.flags[`beat_${npcId}`] = true;
              if (t.badge) g.state.flags[t.badge] = true;
            },
          }),
        );
      }),
    );
  }

  private finishPlayerStep(g: GameContext): void {
    this.syncState();
    g.state.steps++;
    if (this.checkTrainerSight(g)) return;
    const b = this.effBehavior(this.player.x, this.player.y);
    if (b === 'door' || b === 'mat') {
      const warp = this.map.warpAt(this.player.x, this.player.y);
      if (warp) {
        this.warping = true;
        g.scenes.push(
          new FadeTransition(() => {
            this.map = getMap(warp.toMap);
            this.player = makeMover(warp.toX, warp.toY, warp.toDir, 'player');
            this.loadNpcs();
            this.warping = false;
            this.syncState();
          }),
        );
      }
      return;
    }
    if (b === 'grass' && g.state.party.length > 0) {
      const slot = rollEncounter(this.map.def.id);
      if (slot) {
        g.scenes.push(new BattleScene(slot.speciesId, slot.level));
      }
    }
  }

  // After battles: relocate on blackout, then run any pending evolutions.
  private handlePostBattle(g: GameContext): void {
    if (g.state.flags.rival_pending && g.state.party.length > 0) {
      delete g.state.flags.rival_pending;
      const rivalMon = rivalStarterId(g);
      this.startTrainerBattle(g, 'rival1', {
        name: g.state.rivalName,
        party: [[rivalMon, 5]],
        prize: 175,
        sightRange: 0,
        beforeText: [
          `${g.state.rivalName}: Hold it right there!`,
          "Let's see what your new partner can do. Come on!",
        ],
        winText: ['What?! I picked the stronger one...', 'Whatever. Smell you later!'],
        afterText: [],
      });
      return;
    }
    if (g.state.flags.blackout) {
      g.state.flags.blackout = false;
      this.map = getMap(g.state.mapId);
      this.player = makeMover(g.state.x, g.state.y, g.state.dir, 'player');
      this.loadNpcs();
      g.scenes.push(
        new DialogScene([
          `MOM: ${g.state.playerName}! You look exhausted!`,
          'I patched your team right up. Rest a moment before heading out again.',
        ]),
      );
      return;
    }
    for (const mon of g.state.party) {
      const flag = `evolve_${mon.speciesId}`;
      if (g.state.flags[flag]) {
        delete g.state.flags[flag];
        const evo = species(mon.speciesId).evolution;
        if (evo && mon.level >= evo.level) {
          g.scenes.push(new EvolutionScene(mon, evo.into));
          return;
        }
      }
    }
  }

  private interact(g: GameContext): void {
    const [dx, dy] = DIR_DELTA[this.player.dir];
    const fx = this.player.x + dx;
    const fy = this.player.y + dy;
    const npc = this.npcs.find((n) => !n.moving && n.x === fx && n.y === fy);
    if (npc) {
      npc.dir = opposite(this.player.dir);
      if (npc.def.trainer) {
        if (g.state.flags[`beat_${npc.def.id}`]) {
          g.scenes.push(new DialogScene(npc.def.trainer.afterText));
        } else {
          this.startTrainerBattle(g, npc.def.id, npc.def.trainer);
        }
        return;
      }
      if (npc.def.event) handleEvent(g, npc.def.event);
      else g.scenes.push(new DialogScene(npc.def.dialog));
      return;
    }
    const sign = this.map.signAt(fx, fy);
    if (sign) {
      g.scenes.push(new DialogScene(sign.text));
      return;
    }
    const event = this.map.eventAt(fx, fy);
    if (event) {
      handleEvent(g, event.id);
      return;
    }
    if (this.effTile(fx, fy) === 'shrub') {
      const cutter = g.state.party.find((m) => m.moves.some((s) => s.id === 'leafcut'));
      if (!g.state.flags.badge_cliff) {
        g.scenes.push(new DialogScene(['A stubby shrub blocks the way.', 'A GYM BADGE might prove you can handle field moves.']));
      } else if (!cutter) {
        g.scenes.push(new DialogScene(['A stubby shrub blocks the way.', 'A CHIMERA that knows LEAFCUT could trim it.']));
      } else {
        g.scenes.push(
          new DialogScene([`${species(cutter.speciesId).name} used LEAFCUT!`, 'The shrub was trimmed away!'], () => {
            this.cleared.add(`${fx},${fy}`);
          }),
        );
      }
    }
  }

  update(g: GameContext): void {
    if (this.warping) return;
    // Overworld theme resumes whenever this scene is on top (after battles/menus).
    g.audio.playTrack('overworld');
    if (g.input.wasPressed('SELECT')) g.audio.toggleMute();
    this.handlePostBattle(g);
    if (g.scenes.top !== this) return;

    // Advance movement.
    for (const m of [this.player as Mover, ...this.npcs]) {
      if (m.moving) {
        m.progress += 1 / (m.hopping ? HOP_TICKS : WALK_TICKS);
        if (m.progress >= 1) {
          m.progress = 1;
          m.moving = false;
          m.hopping = false;
          if (m === this.player) this.finishPlayerStep(g);
        }
      }
    }
    if (this.warping) return;

    // Player input.
    if (!this.player.moving) {
      if (g.input.wasPressed('A')) {
        this.interact(g);
        if (g.scenes.top !== this) return;
      }
      if (g.input.wasPressed('START')) {
        g.scenes.push(new StartMenuScene());
        return;
      }
      const dirBtn = g.input.heldDirection();
      if (dirBtn) {
        const dir = dirBtn.toLowerCase() as Dir;
        const [dx, dy] = DIR_DELTA[dir];
        const blocked = blocksMove(g, this.map.def.id, this.player.x + dx, this.player.y + dy);
        if (blocked) {
          this.player.dir = dir;
          g.scenes.push(new DialogScene(blocked));
          return;
        }
        // tryStartMove sets facing even when the step is blocked; sync either way
        // so field actions (fishing, cut) read the true facing direction.
        this.tryStartMove(this.player, dir, false);
        this.syncState();
      }
    }

    // NPC wandering.
    for (const npc of this.npcs) {
      if (npc.moving || npc.def.movement !== 'wander') continue;
      npc.timer--;
      if (npc.timer <= 0) {
        npc.timer = 60 + Math.floor(Math.random() * 150);
        const dirs: Dir[] = ['up', 'down', 'left', 'right'];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const [dx, dy] = DIR_DELTA[dir];
        const tx = npc.x + dx;
        const ty = npc.y + dy;
        if (Math.abs(tx - npc.homeX) <= 2 && Math.abs(ty - npc.homeY) <= 2) {
          this.tryStartMove(npc, dir, true);
        } else {
          npc.dir = dir;
        }
      }
    }
  }

  // Snapshot for automated tests and debugging.
  debug(): Record<string, unknown> {
    return {
      mapId: this.map.def.id,
      x: this.player.x,
      y: this.player.y,
      dir: this.player.dir,
      moving: this.player.moving,
      party: this.state.party.map((m) => `${m.speciesId}:${m.level}:${m.hp}/${m.stats.hp}`),
      bag: Object.entries(this.state.bag).map(([id, n]) => `${id}:${n}`),
      money: this.state.money,
      pcCount: this.state.pc.length,
      seen: Object.keys(this.state.seenDex).length,
      caught: Object.keys(this.state.caughtDex).length,
      flags: Object.keys(this.state.flags).filter((k) => this.state.flags[k]),
    };
  }

  private camera(): { camX: number; camY: number } {
    const { px, py } = pixelPos(this.player);
    const clampAxis = (want: number, mapPixels: number, screenPixels: number) => {
      if (mapPixels <= screenPixels) return -Math.floor((screenPixels - mapPixels) / 2);
      return Math.max(0, Math.min(mapPixels - screenPixels, want));
    };
    return {
      camX: clampAxis(Math.round(px) - (SCREEN_W / 2 - TILE / 2), this.map.pixelWidth, SCREEN_W),
      camY: clampAxis(Math.round(py) - (SCREEN_H / 2 - TILE / 2), this.map.pixelHeight, SCREEN_H),
    };
  }

  draw(g: GameContext, s: Screen): void {
    const { camX, camY } = this.camera();
    const x0 = Math.floor(camX / TILE) - 1;
    const y0 = Math.floor(camY / TILE) - 1;
    const x1 = Math.ceil((camX + SCREEN_W) / TILE) + 1;
    const y1 = Math.ceil((camY + SCREEN_H) / TILE) + 1;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        s.blit(tileCanvas(this.effTile(tx, ty)), tx * TILE - camX, ty * TILE - camY);
      }
    }

    const movers: Mover[] = [...this.npcs, this.player];
    movers.sort((a, b) => pixelPos(a).py - pixelPos(b).py);
    for (const m of movers) {
      const { px, py } = pixelPos(m);
      const frames = charSprites(m.sprite)[m.dir];
      let frame = 0;
      if (m.moving && m.progress < 0.5) frame = m.parity ? 1 : 2;
      // Characters sit slightly above their tile so they overlap the tile behind.
      s.blit(frames[frame], px - camX, py - camY - 4);
    }
  }
}
