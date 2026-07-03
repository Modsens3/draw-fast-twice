// Item definitions. Effects follow Gen 1 item mechanics; names are original.

export type ItemEffect =
  | { kind: 'ball'; ballMod: number; ballDiv: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'cure'; status: 'PSN' | 'BRN' | 'PAR' | 'SLP' | 'FRZ' | 'ALL' }
  | { kind: 'revive'; halfHp: boolean }
  | { kind: 'rod'; minLevel: number; maxLevel: number; speciesPool: string[] };

export interface ItemDef {
  id: string;
  name: string;
  price: number;
  effect: ItemEffect;
}

const I = (id: string, name: string, price: number, effect: ItemEffect): ItemDef => ({
  id,
  name,
  price,
  effect,
});

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(
  [
    I('capsule', 'CAPSULE', 200, { kind: 'ball', ballMod: 255, ballDiv: 12 }),
    I('grand_capsule', 'GRAND CAPSULE', 600, { kind: 'ball', ballMod: 200, ballDiv: 8 }),
    I('prime_capsule', 'PRIME CAPSULE', 1200, { kind: 'ball', ballMod: 150, ballDiv: 12 }),
    I('tonic', 'TONIC', 300, { kind: 'heal', amount: 20 }),
    I('super_tonic', 'SUPER TONIC', 700, { kind: 'heal', amount: 50 }),
    I('antivenom', 'ANTIVENOM', 100, { kind: 'cure', status: 'PSN' }),
    I('wakestone', 'WAKESTONE', 250, { kind: 'cure', status: 'SLP' }),
    I('thawsalve', 'THAWSALVE', 250, { kind: 'cure', status: 'FRZ' }),
    I('nervesalt', 'NERVESALT', 200, { kind: 'cure', status: 'PAR' }),
    I('burnbalm', 'BURNBALM', 250, { kind: 'cure', status: 'BRN' }),
    I('old_rod', 'OLD ROD', 0, { kind: 'rod', minLevel: 5, maxLevel: 10, speciesPool: ['minnowle'] }),
  ].map((i) => [i.id, i]),
);

export function item(id: string): ItemDef {
  const it = ITEMS[id];
  if (!it) throw new Error(`Unknown item: ${id}`);
  return it;
}
