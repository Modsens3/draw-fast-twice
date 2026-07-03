// Persistent game state: player, party, story flags.
// Stat mechanics follow Gen 1: DVs (0-15 per stat, HP DV derived from the
// others' low bits), stat experience, and the classic stat formulas.

import { species, SpeciesDef, GrowthRate } from './data/species';
import { move } from './data/moves';

export type StatusCondition = 'OK' | 'PSN' | 'BRN' | 'PAR' | 'SLP' | 'FRZ';

export interface DVs {
  atk: number;
  def: number;
  spd: number;
  spc: number;
  hp: number;
}

export interface StatBlock {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  spc: number;
}

export interface MoveSlot {
  id: string;
  pp: number;
  maxPp: number;
}

export interface Monster {
  speciesId: string;
  nickname?: string;
  level: number;
  exp: number;
  hp: number; // current HP
  status: StatusCondition;
  dvs: DVs;
  statExp: StatBlock;
  stats: StatBlock; // computed, cached
  moves: MoveSlot[];
}

export function rollDVs(): DVs {
  const atk = Math.floor(Math.random() * 16);
  const def = Math.floor(Math.random() * 16);
  const spd = Math.floor(Math.random() * 16);
  const spc = Math.floor(Math.random() * 16);
  // Gen 1: HP DV is built from the low bit of each other DV.
  const hp = ((atk & 1) << 3) | ((def & 1) << 2) | ((spd & 1) << 1) | (spc & 1);
  return { atk, def, spd, spc, hp };
}

// Gen 1 stat formulas.
function calcHP(base: number, dv: number, statExp: number, level: number): number {
  const sePart = Math.floor(Math.ceil(Math.sqrt(statExp)) / 4);
  return Math.floor(((base + dv) * 2 + sePart) * level / 100) + level + 10;
}

function calcStat(base: number, dv: number, statExp: number, level: number): number {
  const sePart = Math.floor(Math.ceil(Math.sqrt(statExp)) / 4);
  return Math.floor(((base + dv) * 2 + sePart) * level / 100) + 5;
}

export function computeStats(def: SpeciesDef, level: number, dvs: DVs, statExp: StatBlock): StatBlock {
  return {
    hp: calcHP(def.base.hp, dvs.hp, statExp.hp, level),
    atk: calcStat(def.base.atk, dvs.atk, statExp.atk, level),
    def: calcStat(def.base.def, dvs.def, statExp.def, level),
    spd: calcStat(def.base.spd, dvs.spd, statExp.spd, level),
    spc: calcStat(def.base.spc, dvs.spc, statExp.spc, level),
  };
}

// Gen 1 experience growth curves.
export function expForLevel(growth: GrowthRate, level: number): number {
  const n = level;
  switch (growth) {
    case 'fast':
      return Math.floor((4 * n * n * n) / 5);
    case 'medium_fast':
      return n * n * n;
    case 'medium_slow':
      return Math.floor((6 / 5) * n * n * n - 15 * n * n + 100 * n - 140);
    case 'slow':
      return Math.floor((5 * n * n * n) / 4);
  }
}

export function makeMonster(speciesId: string, level: number): Monster {
  const def = species(speciesId);
  const dvs = rollDVs();
  const statExp: StatBlock = { hp: 0, atk: 0, def: 0, spd: 0, spc: 0 };
  const stats = computeStats(def, level, dvs, statExp);
  // Last (up to) 4 moves known at this level.
  const known = def.learnset.filter((l) => l.level <= level).map((l) => l.move);
  const moves = known.slice(-4).map((id) => {
    const m = move(id);
    return { id, pp: m.pp, maxPp: m.pp };
  });
  return {
    speciesId,
    level,
    exp: expForLevel(def.growth, level),
    hp: stats.hp,
    status: 'OK',
    dvs,
    statExp,
    stats,
    moves,
  };
}

export interface GameState {
  playerName: string;
  rivalName: string;
  money: number;
  party: Monster[];
  pc: Monster[];
  bag: Record<string, number>;
  seenDex: Record<string, boolean>;
  caughtDex: Record<string, boolean>;
  flags: Record<string, boolean>;
  steps: number;
  daycare: { mon: Monster; steps: number } | null;
  // Overworld position, kept here so scenes can be rebuilt freely.
  mapId: string;
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
}

export function addItem(state: GameState, itemId: string, count: number): void {
  state.bag[itemId] = (state.bag[itemId] ?? 0) + count;
  if (state.bag[itemId] <= 0) delete state.bag[itemId];
}

// Recompute cached stats (level-ups, stat exp changes), preserving HP damage.
export function refreshStats(mon: Monster): void {
  const def = species(mon.speciesId);
  const damage = mon.stats.hp - mon.hp;
  mon.stats = computeStats(def, mon.level, mon.dvs, mon.statExp);
  mon.hp = Math.max(0, mon.stats.hp - damage);
}

export function newGameState(): GameState {
  return {
    playerName: 'MILO',
    rivalName: 'THERON',
    money: 3000,
    party: [],
    pc: [],
    bag: {},
    seenDex: {},
    caughtDex: {},
    flags: {},
    steps: 0,
    daycare: null,
    mapId: 'player_house',
    x: 4,
    y: 4,
    dir: 'down',
  };
}
