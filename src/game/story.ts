// Story triggers: scripted blockers and interactable events.
// All dialog here is original writing.

import type { GameContext } from './engine/scene';
import { DialogScene } from './scenes/dialog';
import { ChoiceScene } from './scenes/choice';
import { addItem, makeMonster } from './state';
import { species } from './data/species';
import { PcScene } from './scenes/pcbox';
import { ShopScene } from './scenes/shop';

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
