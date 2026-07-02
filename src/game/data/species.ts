// Original creature roster for CHIMERA RED. Names, designs and dex text are
// original; stat structure and mechanics follow Gen 1 exactly.
// The full 151-species dataset lands with the battle system (M3);
// this file starts with the starters and early-route wilds.

export type MonsterType =
  | 'NORMAL'
  | 'FIGHTING'
  | 'FLYING'
  | 'POISON'
  | 'GROUND'
  | 'ROCK'
  | 'BUG'
  | 'GHOST'
  | 'FIRE'
  | 'WATER'
  | 'GRASS'
  | 'ELECTRIC'
  | 'PSYCHIC'
  | 'ICE'
  | 'DRAGON';

export type GrowthRate = 'fast' | 'medium_fast' | 'medium_slow' | 'slow';

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  spc: number;
}

export interface SpeciesDef {
  id: string;
  dexNo: number;
  name: string;
  types: [MonsterType] | [MonsterType, MonsterType];
  base: BaseStats;
  catchRate: number; // 0-255, Gen 1 style
  baseExp: number;
  growth: GrowthRate;
  // Moves known at given levels; level 1 entries are the default moveset.
  learnset: { level: number; move: string }[];
  dexEntry: string;
}

const S = (def: SpeciesDef) => def;

export const SPECIES: Record<string, SpeciesDef> = {
  olivet: S({
    id: 'olivet',
    dexNo: 1,
    name: 'OLIVET',
    types: ['GRASS'],
    base: { hp: 45, atk: 49, def: 49, spd: 45, spc: 65 },
    catchRate: 45,
    baseExp: 64,
    growth: 'medium_slow',
    learnset: [
      { level: 1, move: 'ram' },
      { level: 1, move: 'bleat' },
      { level: 7, move: 'leafcut' },
      { level: 13, move: 'rootbind' },
    ],
    dexEntry: 'A sapling sprite. The olive shoot on its head grows all its life.',
  }),
  pyrling: S({
    id: 'pyrling',
    dexNo: 4,
    name: 'PYRLING',
    types: ['FIRE'],
    base: { hp: 39, atk: 52, def: 43, spd: 65, spc: 50 },
    catchRate: 45,
    baseExp: 62,
    growth: 'medium_slow',
    learnset: [
      { level: 1, move: 'ram' },
      { level: 1, move: 'bleat' },
      { level: 9, move: 'cinder' },
      { level: 15, move: 'ashveil' },
    ],
    dexEntry: 'A hearth spirit. Its tail wick burns brighter when it is excited.',
  }),
  nerida: S({
    id: 'nerida',
    dexNo: 7,
    name: 'NERIDA',
    types: ['WATER'],
    base: { hp: 44, atk: 48, def: 65, spd: 43, spc: 50 },
    catchRate: 45,
    baseExp: 63,
    growth: 'medium_slow',
    learnset: [
      { level: 1, move: 'ram' },
      { level: 1, move: 'bleat' },
      { level: 8, move: 'tidejet' },
      { level: 15, move: 'brinefog' },
    ],
    dexEntry: 'A tidepool nymph. It naps inside its spiral shell on hot days.',
  }),
  mysling: S({
    id: 'mysling',
    dexNo: 19,
    name: 'MYSLING',
    types: ['NORMAL'],
    base: { hp: 30, atk: 56, def: 35, spd: 72, spc: 25 },
    catchRate: 255,
    baseExp: 57,
    growth: 'medium_fast',
    learnset: [
      { level: 1, move: 'ram' },
      { level: 1, move: 'glare' },
      { level: 7, move: 'gnaw' },
    ],
    dexEntry: 'A field mouse chimera. It hoards shiny pebbles in its cheek pouches.',
  }),
  sparvos: S({
    id: 'sparvos',
    dexNo: 16,
    name: 'SPARVOS',
    types: ['NORMAL', 'FLYING'],
    base: { hp: 40, atk: 45, def: 40, spd: 56, spc: 35 },
    catchRate: 255,
    baseExp: 55,
    growth: 'medium_slow',
    learnset: [
      { level: 1, move: 'peck' },
      { level: 5, move: 'glare' },
      { level: 12, move: 'gustline' },
    ],
    dexEntry: 'A tiny harbor bird. It rides the sea breeze without flapping once.',
  }),
};

export function species(id: string): SpeciesDef {
  const s = SPECIES[id];
  if (!s) throw new Error(`Unknown species: ${id}`);
  return s;
}
