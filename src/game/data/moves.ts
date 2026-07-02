// Move definitions. Numeric data (power/accuracy/PP/effects) mirrors Gen 1
// move mechanics; names are original. Full ~160 move set lands with M3.

import type { MonsterType } from './species';

export type MoveEffect =
  | 'none'
  | 'lower_attack' // Growl-style
  | 'lower_defense' // Tail Whip-style
  | 'flinch10'
  | 'burn10'
  | 'trap' // Wrap-style partial trapping
  | 'sleep';

export interface MoveDef {
  id: string;
  name: string;
  type: MonsterType;
  power: number; // 0 for status moves
  accuracy: number; // out of 256, Gen 1 style (255 = "100%")
  pp: number;
  effect: MoveEffect;
}

const M = (def: MoveDef) => def;

export const MOVES: Record<string, MoveDef> = {
  ram: M({ id: 'ram', name: 'RAM', type: 'NORMAL', power: 35, accuracy: 242, pp: 35, effect: 'none' }),
  bleat: M({ id: 'bleat', name: 'BLEAT', type: 'NORMAL', power: 0, accuracy: 255, pp: 40, effect: 'lower_attack' }),
  glare: M({ id: 'glare', name: 'GLARE', type: 'NORMAL', power: 0, accuracy: 255, pp: 30, effect: 'lower_defense' }),
  gnaw: M({ id: 'gnaw', name: 'GNAW', type: 'NORMAL', power: 55, accuracy: 229, pp: 25, effect: 'flinch10' }),
  peck: M({ id: 'peck', name: 'PECK', type: 'FLYING', power: 35, accuracy: 255, pp: 35, effect: 'none' }),
  gustline: M({ id: 'gustline', name: 'GUSTLINE', type: 'FLYING', power: 40, accuracy: 255, pp: 35, effect: 'none' }),
  leafcut: M({ id: 'leafcut', name: 'LEAFCUT', type: 'GRASS', power: 45, accuracy: 255, pp: 25, effect: 'none' }),
  rootbind: M({ id: 'rootbind', name: 'ROOTBIND', type: 'GRASS', power: 15, accuracy: 191, pp: 20, effect: 'trap' }),
  cinder: M({ id: 'cinder', name: 'CINDER', type: 'FIRE', power: 40, accuracy: 255, pp: 25, effect: 'burn10' }),
  ashveil: M({ id: 'ashveil', name: 'ASHVEIL', type: 'FIRE', power: 0, accuracy: 255, pp: 20, effect: 'lower_defense' }),
  tidejet: M({ id: 'tidejet', name: 'TIDEJET', type: 'WATER', power: 40, accuracy: 255, pp: 25, effect: 'none' }),
  brinefog: M({ id: 'brinefog', name: 'BRINEFOG', type: 'WATER', power: 0, accuracy: 255, pp: 20, effect: 'lower_attack' }),
};

export function move(id: string): MoveDef {
  const m = MOVES[id];
  if (!m) throw new Error(`Unknown move: ${id}`);
  return m;
}
