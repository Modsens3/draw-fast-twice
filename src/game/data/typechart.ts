// Gen 1 type effectiveness, mirroring pokered data/types/type_matchups.asm
// (including the era's quirks, e.g. Ghost having no effect on Psychic).
// Multipliers are x10: 20 = super effective, 5 = not very, 0 = no effect.

import type { MonsterType } from './species';

const CHART: [MonsterType, MonsterType, number][] = [
  ['WATER', 'FIRE', 20],
  ['FIRE', 'GRASS', 20],
  ['FIRE', 'ICE', 20],
  ['GRASS', 'WATER', 20],
  ['ELECTRIC', 'WATER', 20],
  ['WATER', 'ROCK', 20],
  ['GROUND', 'FLYING', 0],
  ['WATER', 'WATER', 5],
  ['FIRE', 'FIRE', 5],
  ['ELECTRIC', 'ELECTRIC', 5],
  ['ICE', 'ICE', 5],
  ['GRASS', 'GRASS', 5],
  ['PSYCHIC', 'PSYCHIC', 5],
  ['FIRE', 'WATER', 5],
  ['GRASS', 'FIRE', 5],
  ['WATER', 'GRASS', 5],
  ['ELECTRIC', 'GRASS', 5],
  ['NORMAL', 'ROCK', 5],
  ['NORMAL', 'GHOST', 0],
  ['GHOST', 'GHOST', 20],
  ['FIRE', 'BUG', 20],
  ['FIRE', 'ROCK', 5],
  ['WATER', 'GROUND', 20],
  ['ELECTRIC', 'GROUND', 0],
  ['ELECTRIC', 'FLYING', 20],
  ['GRASS', 'GROUND', 20],
  ['GRASS', 'BUG', 5],
  ['GRASS', 'POISON', 5],
  ['GRASS', 'ROCK', 20],
  ['GRASS', 'FLYING', 5],
  ['ICE', 'WATER', 5],
  ['ICE', 'GRASS', 20],
  ['ICE', 'GROUND', 20],
  ['ICE', 'FLYING', 20],
  ['FIGHTING', 'NORMAL', 20],
  ['FIGHTING', 'POISON', 5],
  ['FIGHTING', 'FLYING', 5],
  ['FIGHTING', 'PSYCHIC', 5],
  ['FIGHTING', 'BUG', 5],
  ['FIGHTING', 'ROCK', 20],
  ['FIGHTING', 'ICE', 20],
  ['FIGHTING', 'GHOST', 0],
  ['POISON', 'GRASS', 20],
  ['POISON', 'POISON', 5],
  ['POISON', 'GROUND', 5],
  ['POISON', 'BUG', 20],
  ['POISON', 'ROCK', 5],
  ['POISON', 'GHOST', 5],
  ['GROUND', 'FIRE', 20],
  ['GROUND', 'ELECTRIC', 20],
  ['GROUND', 'GRASS', 5],
  ['GROUND', 'BUG', 5],
  ['GROUND', 'ROCK', 20],
  ['GROUND', 'POISON', 20],
  ['FLYING', 'ELECTRIC', 5],
  ['FLYING', 'FIGHTING', 20],
  ['FLYING', 'BUG', 20],
  ['FLYING', 'GRASS', 20],
  ['FLYING', 'ROCK', 5],
  ['PSYCHIC', 'FIGHTING', 20],
  ['PSYCHIC', 'POISON', 20],
  ['BUG', 'FIRE', 5],
  ['BUG', 'GRASS', 20],
  ['BUG', 'FIGHTING', 5],
  ['BUG', 'FLYING', 5],
  ['BUG', 'PSYCHIC', 20],
  ['BUG', 'GHOST', 5],
  ['BUG', 'POISON', 20],
  ['ROCK', 'FIRE', 20],
  ['ROCK', 'FIGHTING', 5],
  ['ROCK', 'GROUND', 5],
  ['ROCK', 'FLYING', 20],
  ['ROCK', 'BUG', 20],
  ['ROCK', 'ICE', 20],
  ['GHOST', 'NORMAL', 0],
  ['GHOST', 'PSYCHIC', 0],
  ['FIRE', 'DRAGON', 5],
  ['WATER', 'DRAGON', 5],
  ['ELECTRIC', 'DRAGON', 5],
  ['GRASS', 'DRAGON', 5],
  ['ICE', 'DRAGON', 20],
  ['DRAGON', 'DRAGON', 20],
];

// x10 multiplier of attacking type vs one defending type.
export function typeMultiplier(attacker: MonsterType, defender: MonsterType): number {
  for (const [a, d, m] of CHART) {
    if (a === attacker && d === defender) return m;
  }
  return 10;
}

export function effectivenessAgainst(
  attacker: MonsterType,
  defenderTypes: readonly MonsterType[],
): number {
  let mult = 10;
  for (const d of defenderTypes) {
    mult = (mult * typeMultiplier(attacker, d)) / 10;
  }
  return mult;
}
