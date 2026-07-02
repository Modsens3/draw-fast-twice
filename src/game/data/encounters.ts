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
