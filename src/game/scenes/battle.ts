// Wild battle scene: full Gen 1 turn mechanics (order, accuracy, crits,
// stat stages, status conditions, catching, escaping, exp/levels).
// Trainer battles build on this in M5.

import type { GameContext, Scene } from '../engine/scene';
import { Screen, SCREEN_H, SCREEN_W } from '../engine/screen';
import { species } from '../data/species';
import { move, MoveDef, moveCategory } from '../data/moves';
import { item } from '../data/items';
import {
  applyStage,
  BadgeBoosts,
  computeDamage,
  confusionTurns,
  expGain,
  freshStages,
  grantStatExp,
  rollCatch,
  rollCritical,
  rollEscape,
  rollHit,
  rollMultiHitCount,
  sleepTurns,
  StatStages,
} from '../battle/calc';
import { effectivenessAgainst } from '../data/typechart';
import { addItem, expForLevel, makeMonster, Monster, refreshStats } from '../state';
import { backSprite, frontSprite } from '../world/monsterSprites';

type Phase = 'anim' | 'menu' | 'moves' | 'bag' | 'team' | 'steps' | 'learn' | 'done';

interface Step {
  run?: () => void;
  text?: string;
  hp?: { side: 'player' | 'enemy'; to: number };
  wait?: number;
  end?: 'ran' | 'caught' | 'won' | 'lost' | 'fled_enemy';
  learn?: { mon: Monster; moveId: string };
}

interface Combatant {
  mon: Monster;
  stages: StatStages;
  sleepTurns: number;
  confusionTurns: number;
  flinched: boolean;
  displayHp: number; // animated HP bar value
}

export interface TrainerConfig {
  name: string;
  party: Monster[];
  prize: number;
  smart?: boolean; // gym-leader AI prefers super-effective moves
  winText: string[]; // shown when the PLAYER wins
  onWin?: () => void;
}

export class BattleScene implements Scene {
  readonly debugName = 'battle';

  private player!: Combatant;
  private enemy!: Combatant;
  private phase: Phase = 'anim';
  private tick = 0;
  private menuIndex = 0;
  private moveIndex = 0;
  private bagIndex = 0;
  private teamIndex = 0;
  private steps: Step[] = [];
  private currentText = '';
  private textShown = 0;
  private stepWait = 0;
  private runAttempts = 0;
  private outcome: string | null = null;
  private hpAnim: { side: 'player' | 'enemy'; to: number } | null = null;
  private learnCtx: { mon: Monster; moveId: string; index: number } | null = null;
  private participantIndex = 0;
  private trainer: TrainerConfig | null = null;
  private trainerIndex = 0;
  private afterPop?: () => void;

  constructor(wildSpeciesId: string, wildLevel: number, trainer?: TrainerConfig) {
    if (trainer) {
      this.trainer = trainer;
      this.enemy = this.makeCombatant(trainer.party[0]);
    } else {
      const wild = makeMonster(wildSpeciesId, wildLevel);
      this.enemy = this.makeCombatant(wild);
    }
  }

  static forTrainer(trainer: TrainerConfig): BattleScene {
    return new BattleScene('', 0, trainer);
  }

  private makeCombatant(mon: Monster): Combatant {
    return {
      mon,
      stages: freshStages(),
      sleepTurns: mon.status === 'SLP' ? sleepTurns() : 0,
      confusionTurns: 0,
      flinched: false,
      displayHp: mon.hp,
    };
  }

  private get g(): GameContext {
    return this._g!;
  }
  private _g: GameContext | null = null;

  debug(): Record<string, unknown> {
    return {
      battlePhase: this.phase,
      enemyHp: this.enemy.mon.hp,
      enemySpecies: this.enemy.mon.speciesId,
      enemyLevel: this.enemy.mon.level,
      playerHp: this.player?.mon.hp,
      outcome: this.outcome,
      trainerName: this.trainer?.name ?? null,
      text: this.currentText,
    };
  }

  // ---- step queue helpers ----

  private say(text: string): void {
    this.steps.push({ text });
  }

  private animHp(side: 'player' | 'enemy', to: number): void {
    this.steps.push({ hp: { side, to } });
  }

  private side(c: Combatant): 'player' | 'enemy' {
    return c === this.player ? 'player' : 'enemy';
  }

  private name(c: Combatant): string {
    const n = c.mon.nickname ?? species(c.mon.speciesId).name;
    if (c !== this.enemy) return n;
    return this.trainer ? `Foe ${n}` : `Wild ${n}`;
  }

  // Player-side badge boosts from earned badges.
  private playerBadges(): BadgeBoosts {
    const f = this.g.state.flags;
    return { atk: !!f.badge_cliff, def: !!f.badge_tide, spd: !!f.badge_gale, spc: !!f.badge_ember };
  }

  // ---- battle turn logic ----

  private effectiveSpeed(c: Combatant): number {
    let spd = applyStage(c.mon.stats.spd, c.stages.spd);
    if (c.mon.status === 'PAR') spd = Math.max(1, Math.floor(spd / 4));
    return spd;
  }

  private queueTurn(playerAction: { kind: 'move'; index: number } | { kind: 'pass' }): void {
    const enemyMoveId = this.pickEnemyMove();
    const playerMove = playerAction.kind === 'move' ? move(this.player.mon.moves[playerAction.index].id) : null;
    const enemyMove = move(enemyMoveId);

    let playerFirst: boolean;
    if (!playerMove) {
      playerFirst = false;
    } else {
      const pPri = playerMove.effect === 'priority' ? 1 : 0;
      const ePri = enemyMove.effect === 'priority' ? 1 : 0;
      if (pPri !== ePri) playerFirst = pPri > ePri;
      else {
        const ps = this.effectiveSpeed(this.player);
        const es = this.effectiveSpeed(this.enemy);
        playerFirst = ps === es ? Math.random() < 0.5 : ps > es;
      }
    }

    const acts: [Combatant, Combatant, MoveDef | null, number][] = playerFirst
      ? [
          [this.player, this.enemy, playerMove, playerAction.kind === 'move' ? playerAction.index : -1],
          [this.enemy, this.player, enemyMove, -1],
        ]
      : [
          [this.enemy, this.player, enemyMove, -1],
          [this.player, this.enemy, playerMove, playerAction.kind === 'move' ? playerAction.index : -1],
        ];

    for (const [attacker, defender, mv, moveIdx] of acts) {
      if (!mv) continue;
      this.steps.push({
        run: () => {
          if (attacker.mon.hp <= 0 || defender.mon.hp <= 0) return;
          this.performMove(attacker, defender, mv, moveIdx);
        },
      });
    }
    // End-of-turn residual damage.
    this.steps.push({ run: () => this.residual(this.player) });
    this.steps.push({ run: () => this.residual(this.enemy) });
  }

  private pickEnemyMove(): string {
    const usable = this.enemy.mon.moves.filter((m) => m.pp > 0);
    if (usable.length === 0) return 'ram'; // Struggle-style fallback
    if (this.trainer?.smart && this.player) {
      // Gym-leader AI: prefer the most effective damaging move.
      const defTypes = species(this.player.mon.speciesId).types;
      let best = usable[0];
      let bestScore = -1;
      for (const slot of usable) {
        const m = move(slot.id);
        const score = m.power > 0 ? m.power * effectivenessAgainst(m.type, defTypes) : 1;
        if (score > bestScore) {
          bestScore = score;
          best = slot;
        }
      }
      return best.id;
    }
    return usable[Math.floor(Math.random() * usable.length)].id;
  }

  // Immediately runs (inside a step) and prepends follow-up steps.
  private performMove(attacker: Combatant, defender: Combatant, mv: MoveDef, moveIdx: number): void {
    const pre: Step[] = [];

    // Pre-move status gates.
    if (attacker.mon.status === 'SLP') {
      attacker.sleepTurns--;
      if (attacker.sleepTurns > 0) {
        pre.push({ text: `${this.name(attacker)} is fast asleep!` });
        this.prepend(pre);
        return;
      }
      attacker.mon.status = 'OK';
      pre.push({ text: `${this.name(attacker)} woke up!` });
      this.prepend(pre);
      return; // Gen 1: the waking turn is spent.
    }
    if (attacker.mon.status === 'FRZ') {
      pre.push({ text: `${this.name(attacker)} is frozen solid!` });
      this.prepend(pre);
      return;
    }
    if (attacker.flinched) {
      attacker.flinched = false;
      pre.push({ text: `${this.name(attacker)} flinched!` });
      this.prepend(pre);
      return;
    }
    if (attacker.mon.status === 'PAR' && Math.random() < 0.25) {
      pre.push({ text: `${this.name(attacker)} is fully paralyzed!` });
      this.prepend(pre);
      return;
    }
    if (attacker.confusionTurns > 0) {
      attacker.confusionTurns--;
      if (attacker.confusionTurns === 0) {
        pre.push({ text: `${this.name(attacker)} snapped out of confusion!` });
      } else {
        pre.push({ text: `${this.name(attacker)} is confused!` });
        if (Math.random() < 0.5) {
          // Typeless 40-power self-hit using physical stats.
          const dmg = Math.max(
            1,
            Math.floor(
              (Math.floor((Math.floor((2 * attacker.mon.level) / 5) + 2) * 40 * applyStage(attacker.mon.stats.atk, attacker.stages.atk) / applyStage(attacker.mon.stats.def, attacker.stages.def)) / 50) + 2,
            ),
          );
          attacker.mon.hp = Math.max(0, attacker.mon.hp - dmg);
          pre.push({ text: 'It hurt itself in its confusion!' });
          pre.push({ hp: { side: this.side(attacker), to: attacker.mon.hp } });
          pre.push({ run: () => this.checkFaint(attacker) });
          this.prepend(pre);
          return;
        }
      }
    }

    // PP spend (player side tracks PP precisely).
    if (moveIdx >= 0) {
      const slot = attacker.mon.moves[moveIdx];
      if (slot) slot.pp = Math.max(0, slot.pp - 1);
    } else {
      const slot = attacker.mon.moves.find((s) => s.id === mv.id);
      if (slot) slot.pp = Math.max(0, slot.pp - 1);
    }

    pre.push({ text: `${this.name(attacker)} used ${mv.name}!` });

    if (!rollHit(mv, attacker.stages, defender.stages)) {
      pre.push({ text: 'But it missed!' });
      this.prepend(pre);
      return;
    }

    const category = moveCategory(mv);
    if (category === 'status') {
      this.applyStatusMove(attacker, defender, mv, pre);
      this.prepend(pre);
      return;
    }

    const hits = mv.effect === 'multi_hit' ? rollMultiHitCount() : mv.effect === 'double_hit' ? 2 : 1;
    let totalDamage = 0;
    let lastEff = 10;
    let anyCrit = false;
    const atkBadges = attacker === this.player ? this.playerBadges() : undefined;
    const defBadges = defender === this.player ? this.playerBadges() : undefined;
    for (let h = 0; h < hits && defender.mon.hp - totalDamage > 0; h++) {
      const crit = rollCritical(attacker.mon, mv.effect === 'high_crit');
      const res = computeDamage(
        attacker.mon, defender.mon, mv, attacker.stages, defender.stages, crit, atkBadges, defBadges,
      );
      totalDamage += res.damage;
      lastEff = res.effectiveness;
      anyCrit = anyCrit || (crit && res.damage > 0);
    }

    if (lastEff === 0) {
      pre.push({ text: `It doesn't affect ${this.name(defender)}!` });
      this.prepend(pre);
      return;
    }

    defender.mon.hp = Math.max(0, defender.mon.hp - totalDamage);
    if (anyCrit) pre.push({ text: 'A critical hit!' });
    if (hits > 1) pre.push({ text: `Hit ${hits} time(s)!` });
    if (lastEff > 10) pre.push({ text: "It's super effective!" });
    if (lastEff < 10) pre.push({ text: "It's not very effective..." });
    pre.push({ hp: { side: this.side(defender), to: defender.mon.hp } });

    // Secondary effects.
    pre.push({
      run: () => {
        if (defender.mon.hp <= 0) return;
        this.applySecondary(attacker, defender, mv);
      },
    });
    if (mv.effect === 'drain_half') {
      pre.push({
        run: () => {
          const heal = Math.max(1, Math.floor(totalDamage / 2));
          attacker.mon.hp = Math.min(attacker.mon.stats.hp, attacker.mon.hp + heal);
          this.prepend([
            { text: `${this.name(defender)} had its energy drained!` },
            { hp: { side: this.side(attacker), to: attacker.mon.hp } },
          ]);
        },
      });
    }
    if (mv.effect === 'recoil_quarter') {
      pre.push({
        run: () => {
          const recoil = Math.max(1, Math.floor(totalDamage / 4));
          attacker.mon.hp = Math.max(0, attacker.mon.hp - recoil);
          this.prepend([
            { text: `${this.name(attacker)} is hit with recoil!` },
            { hp: { side: this.side(attacker), to: attacker.mon.hp } },
            { run: () => this.checkFaint(attacker) },
          ]);
        },
      });
    }
    pre.push({ run: () => this.checkFaint(defender) });
    this.prepend(pre);
  }

  private applySecondary(attacker: Combatant, defender: Combatant, mv: MoveDef): void {
    const out: Step[] = [];
    const roll = (p: number) => Math.random() < p;
    const trySetStatus = (status: Monster['status'], text: string, p: number) => {
      if (defender.mon.status === 'OK' && roll(p)) {
        defender.mon.status = status;
        if (status === 'SLP') defender.sleepTurns = sleepTurns();
        out.push({ text: `${this.name(defender)} ${text}` });
      }
    };
    switch (mv.effect) {
      case 'flinch10': if (roll(0.1)) defender.flinched = true; break;
      case 'flinch30': if (roll(0.3)) defender.flinched = true; break;
      case 'burn10': trySetStatus('BRN', 'was burned!', 0.1); break;
      case 'freeze10': trySetStatus('FRZ', 'was frozen solid!', 0.1); break;
      case 'paralyze10': trySetStatus('PAR', 'is paralyzed!', 0.1); break;
      case 'paralyze30': trySetStatus('PAR', 'is paralyzed!', 0.3); break;
      case 'poison20': trySetStatus('PSN', 'was poisoned!', 0.2); break;
      case 'poison40': trySetStatus('PSN', 'was poisoned!', 0.4); break;
      case 'confuse10':
        if (defender.confusionTurns === 0 && roll(0.1)) {
          defender.confusionTurns = confusionTurns();
          out.push({ text: `${this.name(defender)} became confused!` });
        }
        break;
      default: break;
    }
    if (out.length) this.prepend(out);
  }

  private applyStatusMove(attacker: Combatant, defender: Combatant, mv: MoveDef, pre: Step[]): void {
    const changeStage = (c: Combatant, stat: keyof StatStages, delta: number, label: string) => {
      const cur = c.stages[stat];
      const next = Math.max(-6, Math.min(6, cur + delta));
      if (next === cur) {
        pre.push({ text: 'Nothing happened!' });
        return;
      }
      c.stages[stat] = next;
      pre.push({ text: `${this.name(c)}'s ${label} ${delta > 0 ? 'rose' : 'fell'}!` });
    };
    switch (mv.effect) {
      case 'lower_attack': changeStage(defender, 'atk', -1, 'ATTACK'); break;
      case 'lower_defense': changeStage(defender, 'def', -1, 'DEFENSE'); break;
      case 'lower_speed': changeStage(defender, 'spd', -1, 'SPEED'); break;
      case 'lower_accuracy': changeStage(defender, 'acc', -1, 'ACCURACY'); break;
      case 'raise_attack': changeStage(attacker, 'atk', +1, 'ATTACK'); break;
      case 'raise_defense': changeStage(attacker, 'def', +1, 'DEFENSE'); break;
      case 'raise_defense2': changeStage(attacker, 'def', +2, 'DEFENSE'); break;
      case 'raise_speed2': changeStage(attacker, 'spd', +2, 'SPEED'); break;
      case 'raise_special': changeStage(attacker, 'spc', +1, 'SPECIAL'); break;
      case 'raise_evasion': changeStage(attacker, 'eva', +1, 'EVASION'); break;
      case 'status_sleep':
        if (defender.mon.status !== 'OK') pre.push({ text: 'But it failed!' });
        else {
          defender.mon.status = 'SLP';
          defender.sleepTurns = sleepTurns();
          pre.push({ text: `${this.name(defender)} fell asleep!` });
        }
        break;
      case 'status_poison':
        if (defender.mon.status !== 'OK') pre.push({ text: 'But it failed!' });
        else {
          defender.mon.status = 'PSN';
          pre.push({ text: `${this.name(defender)} was poisoned!` });
        }
        break;
      case 'status_paralyze':
        if (defender.mon.status !== 'OK') pre.push({ text: 'But it failed!' });
        else {
          defender.mon.status = 'PAR';
          pre.push({ text: `${this.name(defender)} is paralyzed!` });
        }
        break;
      case 'status_confuse':
        if (defender.confusionTurns > 0) pre.push({ text: 'But it failed!' });
        else {
          defender.confusionTurns = confusionTurns();
          pre.push({ text: `${this.name(defender)} became confused!` });
        }
        break;
      case 'heal_half': {
        const heal = Math.floor(attacker.mon.stats.hp / 2);
        attacker.mon.hp = Math.min(attacker.mon.stats.hp, attacker.mon.hp + heal);
        pre.push({ text: `${this.name(attacker)} regained health!` });
        pre.push({ hp: { side: this.side(attacker), to: attacker.mon.hp } });
        break;
      }
      default:
        pre.push({ text: 'Nothing happened!' });
    }
  }

  // 1/16 max HP poison/burn residual, Gen 1 style.
  private residual(c: Combatant): void {
    if (c.mon.hp <= 0) return;
    if (c.mon.status === 'PSN' || c.mon.status === 'BRN') {
      const dmg = Math.max(1, Math.floor(c.mon.stats.hp / 16));
      c.mon.hp = Math.max(0, c.mon.hp - dmg);
      this.prepend([
        { text: `${this.name(c)} is hurt by ${c.mon.status === 'PSN' ? 'poison' : 'its burn'}!` },
        { hp: { side: this.side(c), to: c.mon.hp } },
        { run: () => this.checkFaint(c) },
      ]);
    }
  }

  private checkFaint(c: Combatant): void {
    if (c.mon.hp > 0) return;
    const out: Step[] = [{ text: `${this.name(c)} fainted!` }];
    if (c === this.enemy) {
      // Clear remaining queued actions for this round.
      this.steps = [];
      const winner = this.player.mon;
      const gained = expGain(this.enemy.mon, 1, this.trainer !== null);
      grantStatExp(winner, this.enemy.mon.speciesId);
      out.push({ text: `${this.name(this.player)} gained ${gained} EXP!` });
      out.push({ run: () => this.applyExp(winner, gained) });
      if (this.trainer && this.trainerIndex < this.trainer.party.length - 1) {
        out.push({
          run: () => {
            this.trainerIndex++;
            const next = this.trainer!.party[this.trainerIndex];
            this.enemy = this.makeCombatant(next);
            this.prepend([
              { text: `${this.trainer!.name} sent out ${species(next.speciesId).name}!` },
            ]);
          },
        });
      } else if (this.trainer) {
        out.push({ text: `${this.g.state.playerName} defeated ${this.trainer.name}!` });
        for (const line of this.trainer.winText) out.push({ text: line });
        out.push({ text: `Got $${this.trainer.prize} for winning!` });
        out.push({
          run: () => {
            this.g.state.money += this.trainer!.prize;
            // Defer onWin until after this scene pops, so a chained battle
            // (Elite Four) is pushed onto the overworld, not stacked on us.
            this.afterPop = this.trainer!.onWin;
            this.finish('won');
          },
        });
      } else {
        out.push({ run: () => this.finish('won') });
      }
    } else {
      this.steps = [];
      const next = this.g.state.party.find((m) => m.hp > 0);
      if (next) {
        out.push({
          run: () => {
            this.participantIndex = this.g.state.party.indexOf(next);
            this.player = this.makeCombatant(next);
            this.prepend([{ text: `Go! ${species(next.speciesId).name}!` }]);
          },
        });
      } else {
        out.push({ text: `${this.g.state.playerName} is out of usable CHIMERA!` });
        out.push({ text: `${this.g.state.playerName} blacked out!` });
        out.push({ run: () => this.finish('lost') });
      }
    }
    this.prepend(out);
  }

  private applyExp(mon: Monster, gained: number): void {
    const def = species(mon.speciesId);
    mon.exp += gained;
    const out: Step[] = [];
    while (mon.level < 100 && mon.exp >= expForLevel(def.growth, mon.level + 1)) {
      mon.level++;
      refreshStats(mon);
      out.push({ text: `${def.name} grew to level ${mon.level}!` });
      const learned = def.learnset.filter((l) => l.level === mon.level);
      for (const l of learned) {
        if (mon.moves.some((s) => s.id === l.move)) continue;
        if (mon.moves.length < 4) {
          const m = move(l.move);
          mon.moves.push({ id: l.move, pp: m.pp, maxPp: m.pp });
          out.push({ text: `${def.name} learned ${m.name}!` });
        } else {
          out.push({ learn: { mon, moveId: l.move } });
        }
      }
    }
    if (mon.level >= (def.evolution?.level ?? 999)) {
      this.g.state.flags[`evolve_${mon.speciesId}`] = true;
    }
    if (out.length) this.prepend(out);
  }

  private finish(outcome: 'ran' | 'caught' | 'won' | 'lost' | 'fled_enemy'): void {
    this.outcome = outcome;
    this.prepend([{ end: outcome }]);
  }

  private prepend(steps: Step[]): void {
    this.steps = [...steps, ...this.steps];
  }

  // ---- player actions ----

  private actFight(g: GameContext, index: number): void {
    this.phase = 'steps';
    this.queueTurn({ kind: 'move', index });
  }

  private actRun(): void {
    this.phase = 'steps';
    if (this.trainer) {
      this.say("No! There's no running from a trainer battle!");
      return;
    }
    this.runAttempts++;
    const ok = rollEscape(
      this.effectiveSpeed(this.player),
      this.effectiveSpeed(this.enemy),
      this.runAttempts,
    );
    if (ok) {
      this.say('Got away safely!');
      this.steps.push({ run: () => this.finish('ran') });
    } else {
      this.say("Can't escape!");
      this.queueTurn({ kind: 'pass' });
    }
  }

  private actUseItem(g: GameContext, itemId: string): void {
    this.phase = 'steps';
    const def = item(itemId);
    if (def.effect.kind === 'ball' && this.trainer) {
      this.say('The trainer blocked the CAPSULE!');
      this.say("Don't be a thief!");
      return;
    }
    addItem(g.state, itemId, -1);
    if (def.effect.kind === 'ball') {
      this.say(`${g.state.playerName} threw a ${def.name}!`);
      const { caught, wobbles } = rollCatch(this.enemy.mon, def.effect.ballMod, def.effect.ballDiv);
      if (caught) {
        this.say(`Gotcha! ${species(this.enemy.mon.speciesId).name} was caught!`);
        this.steps.push({
          run: () => {
            g.state.caughtDex[this.enemy.mon.speciesId] = true;
            if (g.state.party.length < 6) {
              g.state.party.push(this.enemy.mon);
            } else {
              this.prepend([{ text: `${species(this.enemy.mon.speciesId).name} was sent to the STORAGE PC!` }]);
              g.state.pc.push(this.enemy.mon);
            }
            this.finish('caught');
          },
        });
      } else {
        this.say(wobbles === 0 ? 'The CAPSULE missed!' : wobbles < 3 ? 'Aww! It appeared to be caught!' : 'Shoot! It was so close, too!');
        this.queueTurn({ kind: 'pass' });
      }
    } else if (def.effect.kind === 'heal') {
      const mon = this.player.mon;
      const healed = Math.min(def.effect.amount, mon.stats.hp - mon.hp);
      mon.hp += healed;
      this.say(`${species(mon.speciesId).name} recovered ${healed} HP!`);
      this.animHp('player', mon.hp);
      this.queueTurn({ kind: 'pass' });
    } else if (def.effect.kind === 'cure') {
      const mon = this.player.mon;
      mon.status = 'OK';
      this.say(`${species(mon.speciesId).name} feels fine now!`);
      this.queueTurn({ kind: 'pass' });
    }
  }

  private actSwitch(g: GameContext, index: number): void {
    const target = g.state.party[index];
    if (!target || target.hp <= 0 || target === this.player.mon) return;
    this.phase = 'steps';
    this.say(`Come back, ${species(this.player.mon.speciesId).name}!`);
    this.steps.push({
      run: () => {
        this.participantIndex = index;
        this.player = this.makeCombatant(target);
        this.prepend([{ text: `Go! ${species(target.speciesId).name}!` }]);
      },
    });
    this.queueTurn({ kind: 'pass' });
  }

  // ---- scene lifecycle ----

  update(g: GameContext): void {
    this._g = g;
    this.tick++;

    if (this.phase === 'anim') {
      if (!this.player) {
        const active = g.state.party.find((m) => m.hp > 0);
        if (!active) {
          g.scenes.pop();
          return;
        }
        this.participantIndex = g.state.party.indexOf(active);
        this.player = this.makeCombatant(active);
        g.state.seenDex[this.enemy.mon.speciesId] = true;
        if (this.trainer) {
          this.say(`${this.trainer.name} wants to battle!`);
          this.say(`${this.trainer.name} sent out ${species(this.enemy.mon.speciesId).name}!`);
        } else {
          this.say(`Wild ${species(this.enemy.mon.speciesId).name} appeared!`);
        }
        this.say(`Go! ${species(this.player.mon.speciesId).name}!`);
        this.phase = 'steps';
      }
      return;
    }

    if (this.phase === 'steps') {
      this.processSteps(g);
      return;
    }

    if (this.phase === 'menu') {
      if (g.input.wasPressed('LEFT') || g.input.wasPressed('RIGHT')) this.menuIndex ^= 1;
      if (g.input.wasPressed('UP') || g.input.wasPressed('DOWN')) this.menuIndex ^= 2;
      if (g.input.wasPressed('A')) {
        switch (this.menuIndex) {
          case 0:
            this.phase = 'moves';
            this.moveIndex = 0;
            break;
          case 1:
            this.phase = 'bag';
            this.bagIndex = 0;
            break;
          case 2:
            this.phase = 'team';
            this.teamIndex = 0;
            break;
          case 3:
            this.actRun();
            break;
        }
      }
      return;
    }

    if (this.phase === 'moves') {
      const count = this.player.mon.moves.length;
      if (g.input.wasPressed('UP')) this.moveIndex = (this.moveIndex + count - 1) % count;
      if (g.input.wasPressed('DOWN')) this.moveIndex = (this.moveIndex + 1) % count;
      if (g.input.wasPressed('B')) this.phase = 'menu';
      if (g.input.wasPressed('A')) {
        const slot = this.player.mon.moves[this.moveIndex];
        if (slot.pp <= 0) return;
        this.actFight(g, this.moveIndex);
      }
      return;
    }

    if (this.phase === 'bag') {
      const entries = Object.entries(g.state.bag);
      if (entries.length === 0) {
        if (g.input.wasPressed('A') || g.input.wasPressed('B')) this.phase = 'menu';
        return;
      }
      if (g.input.wasPressed('UP')) this.bagIndex = (this.bagIndex + entries.length - 1) % entries.length;
      if (g.input.wasPressed('DOWN')) this.bagIndex = (this.bagIndex + 1) % entries.length;
      if (g.input.wasPressed('B')) this.phase = 'menu';
      if (g.input.wasPressed('A')) this.actUseItem(g, entries[Math.min(this.bagIndex, entries.length - 1)][0]);
      return;
    }

    if (this.phase === 'team') {
      const count = g.state.party.length;
      if (g.input.wasPressed('UP')) this.teamIndex = (this.teamIndex + count - 1) % count;
      if (g.input.wasPressed('DOWN')) this.teamIndex = (this.teamIndex + 1) % count;
      if (g.input.wasPressed('B')) this.phase = 'menu';
      if (g.input.wasPressed('A')) this.actSwitch(g, this.teamIndex);
      return;
    }

    if (this.phase === 'learn' && this.learnCtx) {
      const options = 5; // 4 moves + give up
      if (g.input.wasPressed('UP')) this.learnCtx.index = (this.learnCtx.index + options - 1) % options;
      if (g.input.wasPressed('DOWN')) this.learnCtx.index = (this.learnCtx.index + 1) % options;
      if (g.input.wasPressed('A')) {
        const { mon, moveId, index } = this.learnCtx;
        const newMove = move(moveId);
        if (index < 4) {
          const old = move(mon.moves[index].id);
          mon.moves[index] = { id: moveId, pp: newMove.pp, maxPp: newMove.pp };
          this.prepend([
            { text: `1, 2 and... Poof!` },
            { text: `${species(mon.speciesId).name} forgot ${old.name}...` },
            { text: `And it learned ${newMove.name}!` },
          ]);
        } else {
          this.prepend([{ text: `${species(mon.speciesId).name} did not learn ${newMove.name}.` }]);
        }
        this.learnCtx = null;
        this.phase = 'steps';
      }
      return;
    }
  }

  private processSteps(g: GameContext): void {
    // Text animates; A/B skips ahead.
    if (this.currentText) {
      if (this.textShown < this.currentText.length) {
        this.textShown += g.input.isHeld('A') || g.input.isHeld('B') ? 2 : 1;
        return;
      }
      if (this.stepWait > 0) {
        this.stepWait--;
        if (g.input.wasPressed('A') || g.input.wasPressed('B')) this.stepWait = 0;
        return;
      }
      this.currentText = '';
    }

    // HP bar animation in progress?
    if (this.hpAnim) {
      const c = this.hpAnim.side === 'player' ? this.player : this.enemy;
      const to = this.hpAnim.to;
      const dir = c.displayHp < to ? 1 : -1;
      c.displayHp += dir * Math.max(1, Math.floor(c.mon.stats.hp / 48));
      if ((dir === 1 && c.displayHp >= to) || (dir === -1 && c.displayHp <= to)) {
        c.displayHp = to;
        this.hpAnim = null;
      }
      return;
    }

    const step = this.steps.shift();
    if (!step) {
      this.phase = 'menu';
      this.menuIndex = 0;
      return;
    }
    if (step.text !== undefined) {
      this.currentText = step.text;
      this.textShown = 0;
      this.stepWait = 45;
      return;
    }
    if (step.hp) {
      this.hpAnim = { side: step.hp.side, to: step.hp.to };
      return;
    }
    if (step.learn) {
      this.learnCtx = { mon: step.learn.mon, moveId: step.learn.moveId, index: 0 };
      this.currentText = '';
      this.phase = 'learn';
      return;
    }
    if (step.run) {
      step.run();
      return;
    }
    if (step.end) {
      g.scenes.pop();
      // Fire any deferred continuation (e.g. next Elite Four battle) now that
      // this battle is off the stack.
      if (this.afterPop) {
        const cb = this.afterPop;
        this.afterPop = undefined;
        cb();
      }
      if (step.end === 'lost') {
        // Blackout: heal up and return home, Gen 1 style (half money lost).
        for (const m of g.state.party) {
          m.hp = m.stats.hp;
          m.status = 'OK';
        }
        g.state.money = Math.floor(g.state.money / 2);
        g.state.mapId = 'player_house';
        g.state.x = 4;
        g.state.y = 4;
        g.state.dir = 'down';
        g.state.flags.blackout = true;
      }
      return;
    }
  }

  // ---- drawing ----

  draw(g: GameContext, s: Screen): void {
    s.clear(0);

    // Enemy info (top-left) + sprite (top-right).
    const e = this.enemy;
    const eDef = species(e.mon.speciesId);
    s.blit(frontSprite(e.mon.speciesId), SCREEN_W - 56, 0);
    s.text(eDef.name, 4, 4);
    s.text(`Lv${e.mon.level}`, 10, 13);
    this.hpBar(s, 10, 22, 56, e.displayHp / e.mon.stats.hp);
    if (e.mon.status !== 'OK') s.text(e.mon.status, 70, 13, 2);

    // Player info (bottom-right) + back sprite (bottom-left).
    if (this.player) {
      const p = this.player;
      const pDef = species(p.mon.speciesId);
      s.blit(backSprite(p.mon.speciesId), 8, 44);
      s.text(pDef.name, 76, 52);
      s.text(`Lv${p.mon.level}`, 82, 61);
      this.hpBar(s, 82, 70, 56, p.displayHp / p.mon.stats.hp);
      s.text(`${Math.max(0, Math.round(p.displayHp))}/${p.mon.stats.hp}`, 88, 77);
      if (p.mon.status !== 'OK') s.text(p.mon.status, 142, 61, 2);
    }

    // Bottom box: text or menus.
    s.frame(0, SCREEN_H - 48, SCREEN_W, 48);
    if (this.phase === 'menu') {
      const opts = ['FIGHT', 'BAG', 'TEAM', 'RUN'];
      opts.forEach((o, i) => {
        const x = 16 + (i % 2) * 72;
        const y = SCREEN_H - 36 + Math.floor(i / 2) * 16;
        s.text(o, x, y);
        if (i === this.menuIndex) s.text('▶', x - 10, y);
      });
    } else if (this.phase === 'moves') {
      this.player.mon.moves.forEach((slot, i) => {
        const m = move(slot.id);
        const y = SCREEN_H - 44 + i * 10;
        s.text(m.name, 16, y);
        s.text(`${slot.pp}/${slot.maxPp}`, 112, y, 2);
        if (i === this.moveIndex) s.text('▶', 6, y);
      });
    } else if (this.phase === 'bag') {
      const entries = Object.entries(g.state.bag);
      if (entries.length === 0) {
        s.text('The bag is empty!', 8, SCREEN_H - 36);
      } else {
        entries.slice(0, 4).forEach(([id, count], i) => {
          const y = SCREEN_H - 44 + i * 10;
          s.text(`${item(id).name} x${count}`, 16, y);
          if (i === this.bagIndex) s.text('▶', 6, y);
        });
      }
    } else if (this.phase === 'team') {
      g.state.party.slice(0, 4).forEach((mon, i) => {
        const y = SCREEN_H - 44 + i * 10;
        s.text(`${species(mon.speciesId).name} ${mon.hp}/${mon.stats.hp}`, 16, y);
        if (i === this.teamIndex) s.text('▶', 6, y);
      });
    } else if (this.phase === 'learn' && this.learnCtx) {
      const { mon, moveId, index } = this.learnCtx;
      s.text(`Forget which move`, 8, SCREEN_H - 46);
      s.text(`for ${move(moveId).name}?`, 8, SCREEN_H - 38);
      const opts = [...mon.moves.map((slot) => move(slot.id).name), 'GIVE UP'];
      opts.forEach((o, i) => {
        const x = 16 + (i % 2) * 72;
        const y = SCREEN_H - 28 + Math.floor(i / 2) * 9;
        s.text(o, x, y, i === index ? 3 : 2);
        if (i === index) s.text('▶', x - 10, y);
      });
    } else {
      const shown = this.currentText.slice(0, this.textShown);
      const lines = this.wrapText(shown);
      lines.slice(0, 2).forEach((line, i) => s.text(line, 8, SCREEN_H - 36 + i * 16));
    }
  }

  private wrapText(text: string): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      if (line && line.length + 1 + w.length > 23) {
        lines.push(line);
        line = w;
      } else {
        line = line ? line + ' ' + w : w;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  private hpBar(s: Screen, x: number, y: number, w: number, ratio: number): void {
    s.text('HP', x - 2, y - 1, 2);
    const bx = x + 12;
    s.rect(bx - 1, y, w + 2, 5, 3);
    s.rect(bx, y + 1, w, 3, 0);
    const fill = Math.max(0, Math.min(w, Math.round(w * ratio)));
    if (fill > 0) s.rect(bx, y + 1, fill, 3, ratio > 0.5 ? 1 : ratio > 0.2 ? 2 : 3);
  }
}
