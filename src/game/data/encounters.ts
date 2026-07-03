// Wild encounter tables. Slot probabilities are the Gen 1 distribution:
// 10 slots weighted 51/51/39/25/25/25/13/10/10/7 out of 256.

export interface EncounterSlot {
  speciesId: string;
  level: number;
}

export interface EncounterTable {
  rate: number; // 0-255 chance per step on grass
  slots: EncounterSlot[]; // exactly 10
}

export const SLOT_WEIGHTS = [51, 51, 39, 25, 25, 25, 13, 10, 10, 7];

export const ENCOUNTERS: Record<string, EncounterTable> = {
  route4: {
    rate: 25,
    slots: [
      { speciesId: 'sparhawk', level: 26 },
      { speciesId: 'thistrella', level: 26 },
      { speciesId: 'vipryss', level: 27 },
      { speciesId: 'sparhawk', level: 28 },
      { speciesId: 'fawnix', level: 27 },
      { speciesId: 'thistrella', level: 28 },
      { speciesId: 'myserker', level: 28 },
      { speciesId: 'vipryss', level: 29 },
      { speciesId: 'fawnix', level: 30 },
      { speciesId: 'drakelet', level: 30 },
    ],
  },
  thyella_pass: {
    rate: 20,
    slots: [
      { speciesId: 'crystrag', level: 32 },
      { speciesId: 'vesperyx', level: 32 },
      { speciesId: 'petrock', level: 33 },
      { speciesId: 'gloomurn', level: 33 },
      { speciesId: 'crystrag', level: 34 },
      { speciesId: 'vesperyx', level: 34 },
      { speciesId: 'rimehorn', level: 35 },
      { speciesId: 'gloomurn', level: 35 },
      { speciesId: 'drakelet', level: 36 },
      { speciesId: 'drakainos', level: 40 },
    ],
  },
  route2: {
    rate: 25,
    slots: [
      { speciesId: 'thistletot', level: 12 },
      { speciesId: 'sparvos', level: 13 },
      { speciesId: 'thistletot', level: 13 },
      { speciesId: 'pelikos', level: 12 },
      { speciesId: 'mysling', level: 13 },
      { speciesId: 'pelikos', level: 14 },
      { speciesId: 'thistletot', level: 14 },
      { speciesId: 'vipion', level: 14 },
      { speciesId: 'pelikos', level: 15 },
      { speciesId: 'thistrella', level: 21 },
    ],
  },
  halite_cave: {
    rate: 20,
    slots: [
      { speciesId: 'vesperon', level: 14 },
      { speciesId: 'vesperon', level: 15 },
      { speciesId: 'petraw', level: 14 },
      { speciesId: 'vesperon', level: 13 },
      { speciesId: 'crystalit', level: 15 },
      { speciesId: 'petraw', level: 15 },
      { speciesId: 'crystalit', level: 16 },
      { speciesId: 'vesperon', level: 16 },
      { speciesId: 'crystalit', level: 17 },
      { speciesId: 'petrock', level: 25 },
    ],
  },
  route1: {
    rate: 25,
    slots: [
      { speciesId: 'mysling', level: 2 },
      { speciesId: 'sparvos', level: 3 },
      { speciesId: 'mysling', level: 3 },
      { speciesId: 'mysling', level: 2 },
      { speciesId: 'sparvos', level: 2 },
      { speciesId: 'sparvos', level: 3 },
      { speciesId: 'mysling', level: 3 },
      { speciesId: 'sparvos', level: 4 },
      { speciesId: 'mysling', level: 4 },
      { speciesId: 'sparvos', level: 5 },
    ],
  },
};

export function rollEncounter(mapId: string): EncounterSlot | null {
  const table = ENCOUNTERS[mapId];
  if (!table) return null;
  if (Math.floor(Math.random() * 256) >= table.rate) return null;
  let roll = Math.floor(Math.random() * 256);
  for (let i = 0; i < SLOT_WEIGHTS.length; i++) {
    roll -= SLOT_WEIGHTS[i];
    if (roll < 0) return table.slots[i];
  }
  return table.slots[SLOT_WEIGHTS.length - 1];
}
