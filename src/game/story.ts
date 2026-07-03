// Story triggers: scripted blockers and interactable events.
// All dialog here is original writing.

import type { GameContext } from './engine/scene';
import { DialogScene } from './scenes/dialog';
import { ChoiceScene } from './scenes/choice';
import { addItem, expForLevel, makeMonster, Monster, refreshStats } from './state';
import { species } from './data/species';
import { move } from './data/moves';
import { PcScene } from './scenes/pcbox';
import { ShopScene } from './scenes/shop';
import { TeamScene } from './scenes/menus';

// Day-care growth: silent level-ups, auto-learning moves by overwriting the
// oldest slot, no evolutions — matching the original day-care behavior.
function applyDaycareExp(mon: Monster, gained: number): void {
  const def = species(mon.speciesId);
  mon.exp += gained;
  while (mon.level < 100 && mon.exp >= expForLevel(def.growth, mon.level + 1)) {
    mon.level++;
    refreshStats(mon);
    for (const l of def.learnset.filter((l) => l.level === mon.level)) {
      if (mon.moves.some((s) => s.id === l.move)) continue;
      const m = move(l.move);
      if (mon.moves.length < 4) {
        mon.moves.push({ id: l.move, pp: m.pp, maxPp: m.pp });
      } else {
        mon.moves.shift();
        mon.moves.push({ id: l.move, pp: m.pp, maxPp: m.pp });
      }
    }
  }
}

// Returns dialog to show instead of allowing the player onto (x, y).
export function blocksMove(g: GameContext, mapId: string, x: number, y: number): string[] | null {
  const { flags } = g.state;
  if (mapId === 'myrtos_town' && !flags.starter && y <= 2 && (x === 8 || x === 9)) {
    return [
      'PROF. LAUREL: Hey! Wait! Do not go out!',
      'Wild CHIMERA live in tall grass. You need one of your own for protection.',
      'Come to my LAB, south of the square. I have three young CHIMERA that need partners!',
    ];
  }
  return null;
}

// The rival's starter counters the player's pick.
export function rivalStarterId(g: GameContext): string {
  for (const key of Object.keys(g.state.flags)) {
    if (key.startsWith('rival_has_')) return key.slice('rival_has_'.length);
  }
  return 'pyrling';
}

const STARTERS: Record<string, { speciesId: string; rivalPick: string; blurb: string }> = {
  starter_grass: {
    speciesId: 'olivet',
    rivalPick: 'pyrling',
    blurb: 'OLIVET, the sapling sprite! A patient, steady partner.',
  },
  starter_fire: {
    speciesId: 'pyrling',
    rivalPick: 'nerida',
    blurb: 'PYRLING, the hearth spirit! Quick-tempered but loyal.',
  },
  starter_water: {
    speciesId: 'nerida',
    rivalPick: 'olivet',
    blurb: 'NERIDA, the tidepool nymph! Calm as still water.',
  },
};

export function handleEvent(g: GameContext, id: string): void {
  if (id === 'item_route1_supertonic') {
    if (g.state.flags.took_route1_supertonic) {
      g.scenes.push(new DialogScene(['There is nothing left here.']));
      return;
    }
    g.state.flags.took_route1_supertonic = true;
    addItem(g.state, 'super_tonic', 1);
    g.scenes.push(new DialogScene([`${g.state.playerName} found a SUPER TONIC!`]));
    return;
  }
  if (id === 'nurse_heal') {
    g.scenes.push(
      new DialogScene(['NURSE: Welcome to the CHIMERA CENTER!', 'Let me patch up your team...'], () => {
        for (const mon of g.state.party) {
          mon.hp = mon.stats.hp;
          mon.status = 'OK';
          for (const slot of mon.moves) slot.pp = slot.maxPp;
        }
        g.scenes.push(new DialogScene(['NURSE: All better! We hope to see you again!']));
      }),
    );
    return;
  }
  if (id === 'pc_access') {
    g.scenes.push(new PcScene());
    return;
  }
  if (id === 'shop_kyma') {
    g.scenes.push(new ShopScene(['capsule', 'tonic', 'antivenom', 'nervesalt']));
    return;
  }
  if (id === 'shop_pyrgos') {
    g.scenes.push(
      new ShopScene(['capsule', 'grand_capsule', 'super_tonic', 'antivenom', 'burnbalm', 'wakestone']),
    );
    return;
  }
  if (id === 'item_cave_tonic') {
    if (g.state.flags.took_cave_tonic) {
      g.scenes.push(new DialogScene(['There is nothing left here.']));
      return;
    }
    g.state.flags.took_cave_tonic = true;
    addItem(g.state, 'tonic', 1);
    g.scenes.push(new DialogScene([`${g.state.playerName} found a TONIC!`]));
    return;
  }
  if (id === 'item_tower_supertonic') {
    if (g.state.flags.took_tower_supertonic) {
      g.scenes.push(new DialogScene(['There is nothing left here.']));
      return;
    }
    g.state.flags.took_tower_supertonic = true;
    addItem(g.state, 'super_tonic', 1);
    g.scenes.push(new DialogScene([`${g.state.playerName} found a SUPER TONIC!`]));
    return;
  }
  if (id === 'item_cave_nervesalt') {
    if (g.state.flags.took_cave_nervesalt) {
      g.scenes.push(new DialogScene(['There is nothing left here.']));
      return;
    }
    g.state.flags.took_cave_nervesalt = true;
    addItem(g.state, 'nervesalt', 1);
    g.scenes.push(new DialogScene([`${g.state.playerName} found a NERVESALT!`]));
    return;
  }
  if (id === 'give_old_rod') {
    if (!g.state.flags.got_old_rod) {
      g.state.flags.got_old_rod = true;
      addItem(g.state, 'old_rod', 1);
      g.scenes.push(
        new DialogScene([
          'FISHER: You again! A promise is a promise.',
          `${g.state.playerName} received the OLD ROD!`,
          'FISHER: Face the water, cast from your BAG, and mind the flopping.',
        ]),
      );
    } else {
      g.scenes.push(new DialogScene(['FISHER: Biting today, are they?']));
    }
    return;
  }
  if (id === 'daycare') {
    if (!g.state.daycare) {
      if (g.state.party.length <= 1) {
        g.scenes.push(new DialogScene(['GRANNY: I would watch one for you, but you need a partner by your side too!']));
        return;
      }
      g.scenes.push(
        new DialogScene(['GRANNY: I can raise one of your CHIMERA. Every step you take, it grows.', 'Leave one with me?'], () => {
          g.scenes.push(
            new ChoiceScene(['YES', 'NO'], (i) => {
              if (i !== 0) return;
              g.scenes.push(
                new TeamScene((pick) => {
                  const mon = g.state.party[pick];
                  if (!mon || g.state.party.length <= 1) return;
                  g.state.party.splice(pick, 1);
                  g.state.daycare = { mon, steps: g.state.steps };
                  g.scenes.push(new DialogScene([`GRANNY: I will take good care of ${species(mon.speciesId).name}!`]));
                }),
              );
            }),
          );
        }),
      );
      return;
    }
    // Withdraw: exp equal to steps walked, $100 flat, Gen 1 style.
    const { mon, steps } = g.state.daycare;
    const gained = Math.max(1, g.state.steps - steps);
    const fee = 100;
    if (g.state.money < fee) {
      g.scenes.push(new DialogScene(['GRANNY: The fee is $100, dearie. Come back when you have it.']));
      return;
    }
    if (g.state.party.length >= 6) {
      g.scenes.push(new DialogScene(['GRANNY: Your team is full! Make room first.']));
      return;
    }
    g.scenes.push(
      new DialogScene(
        [`GRANNY: ${species(mon.speciesId).name} walked ${gained} steps worth of growth!`, 'Take it back for $100?'],
        () => {
          g.scenes.push(
            new ChoiceScene(['YES', 'NO'], (i) => {
              if (i !== 0) return;
              g.state.money -= fee;
              applyDaycareExp(mon, gained);
              g.state.party.push(mon);
              g.state.daycare = null;
              g.scenes.push(new DialogScene([`${species(mon.speciesId).name} came back happy! (Lv${mon.level})`]));
            }),
          );
        },
      ),
    );
    return;
  }
  if (id === 'trade_frostkid') {
    if (g.state.flags.traded_frostkid) {
      g.scenes.push(new DialogScene(['COLLECTOR: My MYSLING and I are inseparable now. Thanks again!']));
      return;
    }
    const idx = g.state.party.findIndex((m) => m.speciesId === 'mysling');
    if (idx < 0) {
      g.scenes.push(
        new DialogScene([
          'COLLECTOR: I would trade my FROSTKID for a MYSLING in a heartbeat.',
          'Bring one and we have a deal!',
        ]),
      );
      return;
    }
    g.scenes.push(
      new DialogScene(['COLLECTOR: A MYSLING! Trade it for my FROSTKID?'], () => {
        g.scenes.push(
          new ChoiceScene(['YES', 'NO'], (i) => {
            if (i !== 0) return;
            const given = g.state.party[idx];
            const received = makeMonster('frostkid', given.level);
            g.state.party[idx] = received;
            g.state.flags.traded_frostkid = true;
            g.state.seenDex.frostkid = true;
            g.state.caughtDex.frostkid = true;
            g.scenes.push(
              new DialogScene([
                `${g.state.playerName} traded MYSLING for FROSTKID!`,
                'COLLECTOR: Treat the little rime-goat well!',
              ]),
            );
          }),
        );
      }),
    );
    return;
  }
  if (id === 'eris_thanks') {
    const beatBoth = g.state.flags.beat_cave_grunt_a && g.state.flags.beat_cave_grunt_b;
    if (!beatBoth) {
      g.scenes.push(
        new DialogScene([
          'RESEARCHER: TEAM ERIS thugs are shaking down the whole cave!',
          'They talk of some "great geode" out west... please drive them off!',
        ]),
      );
      return;
    }
    if (!g.state.flags.eris_thanks_given) {
      g.state.flags.eris_thanks_given = true;
      addItem(g.state, 'grand_capsule', 3);
      g.scenes.push(
        new DialogScene([
          'RESEARCHER: You drove them off! The crystals are safe... for now.',
          `${g.state.playerName} received 3 GRAND CAPSULES!`,
          'RESEARCHER: They kept muttering about the watchtower west of PYRGOS. Stay sharp.',
        ]),
      );
      return;
    }
    g.scenes.push(new DialogScene(['RESEARCHER: The cave hums happily again. Thank you!']));
    return;
  }
  const starter = STARTERS[id];
  if (starter) {
    const { flags } = g.state;
    if (flags.starter) {
      g.scenes.push(new DialogScene(['PROF. LAUREL: One partner is all a new trainer needs!']));
      return;
    }
    const def = species(starter.speciesId);
    g.scenes.push(
      new DialogScene([starter.blurb], () => {
        g.scenes.push(
          new ChoiceScene(['YES', 'NO'], (i) => {
            if (i !== 0) return;
            g.state.party.push(makeMonster(starter.speciesId, 5));
            flags.starter = true;
            flags[`rival_has_${starter.rivalPick}`] = true;
            flags.rival_pending = true;
            g.state.seenDex[starter.speciesId] = true;
            g.state.caughtDex[starter.speciesId] = true;
            addItem(g.state, 'capsule', 5);
            addItem(g.state, 'tonic', 3);
            const rivalDef = species(starter.rivalPick);
            g.scenes.push(
              new DialogScene([
                `${g.state.playerName} received ${def.name}!`,
                `PROF. LAUREL: Splendid! Take good care of ${def.name}.`,
                `${g.state.rivalName}: Heh, then I will take ${rivalDef.name}. It has the edge over yours!`,
                'PROF. LAUREL: Take these too: 5 CAPSULES to catch wild CHIMERA, and 3 TONICS.',
                'PROF. LAUREL: Off you go, you two. Your own legends are about to unfold!',
              ]),
            );
          }),
        );
      }),
    );
    return;
  }
}

export const INTRO_TEXT = [
  'Hello there! Welcome to the world of CHIMERA!',
  'My name is LAUREL. Folks call me the CHIMERA PROF!',
  'This world is home to wondrous creatures. Some keep them as friends; others battle with them.',
  'Myself... I study them as a career.',
  'Your very own tale of grand adventure is about to unfold. Let us go!',
];
