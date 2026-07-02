// Move definitions. Numeric behavior (power/accuracy/PP, effect chances,
// stage mechanics) follows Gen 1 battle mechanics; all names are original.
// The roster grows alongside the dex; effects cover the Gen 1 effect families.

import type { MonsterType } from './species';

export type MoveEffect =
  | 'none'
  | 'high_crit' // Slash-family crit rate
  | 'multi_hit' // hits 2-5 times (Gen 1 distribution)
  | 'double_hit'
  | 'drain_half' // heal attacker by half damage dealt
  | 'recoil_quarter'
  | 'priority' // +1 priority bracket
  | 'flinch10'
  | 'flinch30'
  | 'burn10'
  | 'freeze10'
  | 'paralyze10'
  | 'paralyze30'
  | 'poison20'
  | 'poison40'
  | 'confuse10'
  | 'status_sleep'
  | 'status_poison'
  | 'status_paralyze'
  | 'status_confuse'
  | 'lower_attack' // enemy -1
  | 'lower_defense'
  | 'lower_speed'
  | 'lower_accuracy'
  | 'raise_attack' // self +1
  | 'raise_defense'
  | 'raise_defense2'
  | 'raise_speed2'
  | 'raise_special'
  | 'raise_evasion'
  | 'heal_half'; // self heal 1/2 max HP

export type MoveCategory = 'physical' | 'special' | 'status';

// Gen 1: category is determined by type, not per-move.
const SPECIAL_TYPES: MonsterType[] = ['FIRE', 'WATER', 'GRASS', 'ELECTRIC', 'PSYCHIC', 'ICE', 'DRAGON'];

export interface MoveDef {
  id: string;
  name: string;
  type: MonsterType;
  power: number; // 0 for status moves
  accuracy: number; // out of 256, Gen 1 style (255 = "100%")
  pp: number;
  effect: MoveEffect;
}

const M = (
  id: string,
  name: string,
  type: MonsterType,
  power: number,
  accuracy: number,
  pp: number,
  effect: MoveEffect = 'none',
): MoveDef => ({ id, name, type, power, accuracy, pp, effect });

export const MOVES: Record<string, MoveDef> = Object.fromEntries(
  [
    // Normal
    M('ram', 'RAM', 'NORMAL', 35, 242, 35),
    M('bodycheck', 'BODYCHECK', 'NORMAL', 85, 255, 15),
    M('gnaw', 'GNAW', 'NORMAL', 55, 229, 25, 'flinch10'),
    M('furyclaws', 'FURY CLAWS', 'NORMAL', 18, 204, 20, 'multi_hit'),
    M('doublekick', 'DOUBLE KICK', 'NORMAL', 30, 255, 30, 'double_hit'),
    M('slashfang', 'SLASHFANG', 'NORMAL', 70, 255, 20, 'high_crit'),
    M('quickdart', 'QUICKDART', 'NORMAL', 40, 255, 30, 'priority'),
    M('crushblow', 'CRUSHBLOW', 'NORMAL', 80, 191, 20),
    M('bleat', 'BLEAT', 'NORMAL', 0, 255, 40, 'lower_attack'),
    M('glare', 'GLARE', 'NORMAL', 0, 255, 30, 'lower_defense'),
    M('warble', 'WARBLE', 'NORMAL', 0, 140, 15, 'status_sleep'),
    M('mirrordance', 'MIRRORDANCE', 'NORMAL', 0, 255, 15, 'raise_evasion'),
    M('ironhide', 'IRONHIDE', 'NORMAL', 0, 255, 30, 'raise_defense'),
    M('warcry', 'WARCRY', 'NORMAL', 0, 255, 30, 'raise_attack'),
    M('mend', 'MEND', 'NORMAL', 0, 255, 10, 'heal_half'),
    M('dizzyspin', 'DIZZYSPIN', 'NORMAL', 0, 255, 10, 'status_confuse'),
    // Flying
    M('peck', 'PECK', 'FLYING', 35, 255, 35),
    M('gustline', 'GUSTLINE', 'FLYING', 40, 255, 35),
    M('galewing', 'GALEWING', 'FLYING', 70, 242, 25),
    M('skydive', 'SKYDIVE', 'FLYING', 85, 242, 15),
    // Grass
    M('leafcut', 'LEAFCUT', 'GRASS', 55, 242, 25, 'high_crit'),
    M('vinelash', 'VINELASH', 'GRASS', 35, 255, 25),
    M('sporeburst', 'SPOREBURST', 'GRASS', 0, 191, 15, 'status_sleep'),
    M('sapdrain', 'SAPDRAIN', 'GRASS', 40, 255, 20, 'drain_half'),
    M('petalgale', 'PETALGALE', 'GRASS', 90, 204, 10),
    M('rootbind', 'ROOTBIND', 'GRASS', 15, 191, 20),
    // Fire
    M('cinder', 'CINDER', 'FIRE', 40, 255, 25, 'burn10'),
    M('flarelash', 'FLARELASH', 'FIRE', 95, 255, 15, 'burn10'),
    M('ashveil', 'ASHVEIL', 'FIRE', 0, 255, 20, 'lower_accuracy'),
    M('pyreburst', 'PYREBURST', 'FIRE', 120, 216, 5, 'burn10'),
    // Water
    M('tidejet', 'TIDEJET', 'WATER', 40, 255, 25),
    M('brinefog', 'BRINEFOG', 'WATER', 0, 255, 20, 'lower_attack'),
    M('surgewave', 'SURGEWAVE', 'WATER', 95, 255, 15),
    M('shellclamp', 'SHELLCLAMP', 'WATER', 35, 191, 15),
    M('mistveil', 'MISTVEIL', 'WATER', 0, 255, 30, 'raise_evasion'),
    // Electric
    M('sparknip', 'SPARKNIP', 'ELECTRIC', 40, 255, 30, 'paralyze10'),
    M('voltlance', 'VOLTLANCE', 'ELECTRIC', 95, 255, 15, 'paralyze10'),
    M('staticweb', 'STATICWEB', 'ELECTRIC', 0, 255, 20, 'status_paralyze'),
    // Poison
    M('venomsting', 'VENOMSTING', 'POISON', 15, 255, 35, 'poison20'),
    M('sludgeball', 'SLUDGEBALL', 'POISON', 65, 255, 20, 'poison40'),
    M('toxicmist', 'TOXICMIST', 'POISON', 0, 216, 15, 'status_poison'),
    // Bug
    M('needlejab', 'NEEDLEJAB', 'BUG', 25, 255, 35, 'poison20'),
    M('cocoonguard', 'COCOONGUARD', 'BUG', 0, 255, 30, 'raise_defense'),
    M('swarmrush', 'SWARMRUSH', 'BUG', 20, 255, 20, 'multi_hit'),
    // Rock / Ground
    M('stonecast', 'STONECAST', 'ROCK', 50, 229, 15),
    M('quakestomp', 'QUAKESTOMP', 'GROUND', 100, 255, 10),
    M('duneveil', 'DUNEVEIL', 'GROUND', 0, 255, 15, 'lower_accuracy'),
    // Psychic
    M('mindjab', 'MINDJAB', 'PSYCHIC', 50, 255, 25, 'confuse10'),
    M('dreamhex', 'DREAMHEX', 'PSYCHIC', 0, 140, 15, 'status_sleep'),
    M('psiblast', 'PSIBLAST', 'PSYCHIC', 90, 255, 10, 'confuse10'),
    M('focusveil', 'FOCUSVEIL', 'PSYCHIC', 0, 255, 20, 'raise_special'),
    // Ice
    M('frostbite', 'FROSTBITE', 'ICE', 40, 255, 25, 'freeze10'),
    M('glacierram', 'GLACIERRAM', 'ICE', 95, 255, 15, 'freeze10'),
    // Ghost
    M('shadegrip', 'SHADEGRIP', 'GHOST', 40, 255, 30),
    // Fighting
    M('palmstrike', 'PALMSTRIKE', 'FIGHTING', 50, 255, 25),
    M('breakerfist', 'BREAKERFIST', 'FIGHTING', 80, 216, 15),
    // Dragon
    M('wyrmgale', 'WYRMGALE', 'DRAGON', 40, 255, 20, 'paralyze10'),
  ].map((m) => [m.id, m]),
);

export function move(id: string): MoveDef {
  const m = MOVES[id];
  if (!m) throw new Error(`Unknown move: ${id}`);
  return m;
}

export function moveCategory(m: MoveDef): MoveCategory {
  if (m.power === 0) return 'status';
  return SPECIAL_TYPES.includes(m.type) ? 'special' : 'physical';
}
