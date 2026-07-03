// Gen 1 battle math: damage, criticals, accuracy, stat stages, catching,
// escaping, experience. Formula behavior mirrors the original engine
// (pret/pokered engine/battle/core.asm and engine/items/item_effects.asm).

import { MoveDef, moveCategory } from '../data/moves';
import { effectivenessAgainst } from '../data/typechart';
import { species } from '../data/species';
import type { Monster } from '../state';

export interface StatStages {
  atk: number;
  def: number;
  spd: number;
  spc: number;
  acc: number;
  eva: number;
}

export const freshStages = (): StatStages => ({ atk: 0, def: 0, spd: 0, spc: 0, acc: 0, eva: 0 });

// Gen 1 stage multipliers, x100 for -6..+6.
const STAGE_MULT = [25, 28, 33, 40, 50, 66, 100, 150, 200, 250, 300, 350, 400];

export function applyStage(base: number, stage: number): number {
  const m = STAGE_MULT[stage + 6];
  return Math.max(1, Math.min(999, Math.floor((base * m) / 100)));
}

const rand256 = () => Math.floor(Math.random() * 256);

// Critical hit roll: probability is baseSpeed/512 (x4 for high-crit moves),
// capped at 255/256, matching the Gen 1 speed-based crit system.
export function rollCritical(attacker: Monster, highCrit: boolean): boolean {
  const baseSpd = species(attacker.speciesId).base.spd;
  let threshold = Math.floor(baseSpd / 2);
  if (highCrit) threshold *= 4;
  threshold = Math.min(255, threshold);
  return rand256() < threshold;
}

// Gen 1 accuracy check, including the famous 1/256 guaranteed-miss quirk.
export function rollHit(m: MoveDef, attackerStages: StatStages, defenderStages: StatStages): boolean {
  let acc = m.accuracy;
  acc = Math.floor((acc * STAGE_MULT[attackerStages.acc + 6]) / 100);
  acc = Math.floor((acc * 100) / STAGE_MULT[defenderStages.eva + 6]);
  acc = Math.max(1, Math.min(255, acc));
  return rand256() < acc;
}

export interface DamageResult {
  damage: number;
  critical: boolean;
  effectiveness: number; // x10
}

// Gen 1 badge boosts: owning the right badge multiplies a stat by 9/8.
export interface BadgeBoosts {
  atk?: boolean;
  def?: boolean;
  spd?: boolean;
  spc?: boolean;
}

const badgeBoost = (stat: number, boosted: boolean | undefined) =>
  boosted ? Math.floor((stat * 9) / 8) : stat;

export function computeDamage(
  attacker: Monster,
  defender: Monster,
  m: MoveDef,
  attackerStages: StatStages,
  defenderStages: StatStages,
  critical: boolean,
  attackerBadges?: BadgeBoosts,
  defenderBadges?: BadgeBoosts,
): DamageResult {
  const atkSpecies = species(attacker.speciesId);
  const defSpecies = species(defender.speciesId);
  const category = moveCategory(m);

  let attackStat: number;
  let defenseStat: number;
  if (category === 'physical') {
    attackStat = critical ? attacker.stats.atk : applyStage(attacker.stats.atk, attackerStages.atk);
    defenseStat = critical ? defender.stats.def : applyStage(defender.stats.def, defenderStages.def);
    // Burn halves physical attack (unless crit, which ignores modifiers).
    if (attacker.status === 'BRN' && !critical) attackStat = Math.max(1, Math.floor(attackStat / 2));
    if (!critical) {
      attackStat = badgeBoost(attackStat, attackerBadges?.atk);
      defenseStat = badgeBoost(defenseStat, defenderBadges?.def);
    }
  } else {
    attackStat = critical ? attacker.stats.spc : applyStage(attacker.stats.spc, attackerStages.spc);
    defenseStat = critical ? defender.stats.spc : applyStage(defender.stats.spc, defenderStages.spc);
    if (!critical) {
      attackStat = badgeBoost(attackStat, attackerBadges?.spc);
      defenseStat = badgeBoost(defenseStat, defenderBadges?.spc);
    }
  }

  const level = critical ? attacker.level * 2 : attacker.level;
  let damage = Math.floor(
    Math.floor((Math.floor((2 * level) / 5) + 2) * m.power * attackStat / defenseStat) / 50,
  ) + 2;

  // STAB
  if (atkSpecies.types.includes(m.type)) {
    damage = Math.floor((damage * 15) / 10);
  }
  // Type effectiveness
  const eff = effectivenessAgainst(m.type, defSpecies.types);
  damage = Math.floor((damage * eff) / 10);
  if (eff === 0) return { damage: 0, critical, effectiveness: 0 };

  // Random factor 217-255 /255
  if (damage > 1) {
    const r = 217 + Math.floor(Math.random() * 39);
    damage = Math.floor((damage * r) / 255);
  }
  return { damage: Math.max(1, damage), critical, effectiveness: eff };
}

// Gen 1 capture algorithm (pokered ItemUseBall).
// ballMod: 255 basic capsule, 200 great, 150 ultra/safari.
// ballDiv: 12 basic/ultra, 8 great.
export function rollCatch(wild: Monster, ballMod: number, ballDiv: number): { caught: boolean; wobbles: number } {
  const def = species(wild.speciesId);
  const statusBonus = wild.status === 'SLP' || wild.status === 'FRZ' ? 25 : wild.status === 'OK' ? 0 : 12;

  const r1 = Math.floor(Math.random() * (ballMod + 1));
  if (r1 < statusBonus) return { caught: true, wobbles: 3 };
  const r1adj = r1 - statusBonus;
  if (r1adj > def.catchRate) {
    return { caught: false, wobbles: wobbleCount(def.catchRate, ballDiv, wild) };
  }

  let f = Math.floor((wild.stats.hp * 255) / ballDiv);
  const quarterHp = Math.max(1, Math.floor(wild.hp / 4));
  f = Math.min(255, Math.floor(f / quarterHp));
  const r2 = rand256();
  if (r2 <= f) return { caught: true, wobbles: 3 };
  return { caught: false, wobbles: wobbleCount(def.catchRate, ballDiv, wild) };
}

// Wobble animation count on a failed catch, per the original table.
function wobbleCount(catchRate: number, ballDiv: number, wild: Monster): number {
  let f = Math.floor((wild.stats.hp * 255) / ballDiv);
  const quarterHp = Math.max(1, Math.floor(wild.hp / 4));
  f = Math.min(255, Math.floor(f / quarterHp));
  const x = Math.floor((catchRate * 100) / 255) + Math.floor((f * 100) / 255);
  if (x < 10) return 0;
  if (x < 30) return 1;
  if (x < 70) return 2;
  return 3;
}

// Gen 1 wild-battle escape formula.
export function rollEscape(playerSpd: number, enemySpd: number, attempts: number): boolean {
  const b = Math.floor(enemySpd / 4) % 256;
  if (b === 0) return true;
  const f = Math.floor((playerSpd * 32) / b) + 30 * attempts;
  if (f > 255) return true;
  return rand256() < f;
}

// Experience from defeating `defeated`; wild battles use 1.0 multiplier.
export function expGain(defeated: Monster, participants: number, isTrainer: boolean): number {
  const def = species(defeated.speciesId);
  let exp = Math.floor(Math.floor(def.baseExp * defeated.level / 7) / Math.max(1, participants));
  if (isTrainer) exp = Math.floor((exp * 3) / 2);
  return Math.max(1, exp);
}

// Gen 1 stat experience: winners bank the defeated species' base stats.
export function grantStatExp(winner: Monster, defeatedSpeciesId: string): void {
  const base = species(defeatedSpeciesId).base;
  winner.statExp.hp = Math.min(65535, winner.statExp.hp + base.hp);
  winner.statExp.atk = Math.min(65535, winner.statExp.atk + base.atk);
  winner.statExp.def = Math.min(65535, winner.statExp.def + base.def);
  winner.statExp.spd = Math.min(65535, winner.statExp.spd + base.spd);
  winner.statExp.spc = Math.min(65535, winner.statExp.spc + base.spc);
}

// Gen 1 multi-hit distribution: 2,3 (3/8 each) 4,5 (1/8 each).
export function rollMultiHitCount(): number {
  const r = Math.floor(Math.random() * 8);
  if (r < 3) return 2;
  if (r < 6) return 3;
  return r === 6 ? 4 : 5;
}

export function sleepTurns(): number {
  return 1 + Math.floor(Math.random() * 7);
}

export function confusionTurns(): number {
  return 2 + Math.floor(Math.random() * 4);
}
