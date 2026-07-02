import { GameMap, MapDef } from '../world/map';
import type { TileId } from '../world/tiles';

const OUTDOOR_LEGEND: Record<string, TileId> = {
  T: 'tree',
  '.': 'ground',
  ',': 'flowers',
  G: 'tallgrass',
  W: 'water',
  F: 'fence',
  S: 'sign',
  w: 'wall',
  r: 'roof',
  d: 'door',
  o: 'window',
  L: 'ledge',
};

const INDOOR_LEGEND: Record<string, TileId> = {
  I: 'iwall',
  f: 'floor',
  t: 'table',
  b: 'ball',
  m: 'mat',
};

const MYRTOS_TOWN: MapDef = {
  id: 'myrtos_town',
  name: 'MYRTOS TOWN',
  outdoor: true,
  border: 'tree',
  legend: OUTDOOR_LEGEND,
  rows: [
    'TTTTTTTT..TTTTTTTTTT',
    'T.......GG.........T',
    'T.......GG.........T',
    'T..rrrr......rrrr..T',
    'T..rrrr......rrrr..T',
    'T..wodw......wodw..T',
    'T...,........,.....T',
    'T.S................T',
    'T........WWWW......T',
    'T........WWWW......T',
    'T..FFFF..WWWW..,...T',
    'T......rrrrrr......T',
    'T......rrrrrr......T',
    'T......wwodww......T',
    'T............S.....T',
    'T.....,........,...T',
    'T..................T',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  warps: [
    { x: 5, y: 5, toMap: 'player_house', toX: 5, toY: 6, toDir: 'up' },
    { x: 15, y: 5, toMap: 'neighbor_house', toX: 5, toY: 6, toDir: 'up' },
    { x: 10, y: 13, toMap: 'laurel_lab', toX: 5, toY: 8, toDir: 'up' },
  ],
  signs: [
    { x: 2, y: 7, text: ['MYRTOS TOWN', 'Where the olive', 'breeze blows.'] },
    { x: 13, y: 14, text: ['CHIMERA LAB', 'PROF. LAUREL, resident researcher.'] },
  ],
  npcs: [
    {
      id: 'myrtos_villager',
      x: 3,
      y: 14,
      sprite: 'villager',
      dir: 'down',
      movement: 'wander',
      dialog: [
        'Tall grass is full of wild CHIMERA!',
        'You need one of your own to stay safe.',
      ],
    },
  ],
  connections: {
    north: { toMap: 'route1', offset: 0 },
  },
};

const PLAYER_HOUSE: MapDef = {
  id: 'player_house',
  name: "PLAYER's HOUSE",
  outdoor: false,
  border: 'iwall',
  legend: INDOOR_LEGEND,
  rows: [
    'IIIIIIIIII',
    'IffffffffI',
    'IfttfffffI',
    'IffffffffI',
    'IffffffffI',
    'IffffffffI',
    'IffffmmffI',
    'IIIIIIIIII',
  ],
  warps: [
    { x: 5, y: 6, toMap: 'myrtos_town', toX: 5, toY: 6, toDir: 'down' },
    { x: 6, y: 6, toMap: 'myrtos_town', toX: 5, toY: 6, toDir: 'down' },
  ],
  signs: [],
  npcs: [
    {
      id: 'mom',
      x: 2,
      y: 4,
      sprite: 'villager',
      dir: 'down',
      movement: 'static',
      dialog: [
        'MOM: Off on an adventure already?',
        'Every trainer starts somewhere. Be careful out there!',
      ],
    },
  ],
};

const NEIGHBOR_HOUSE: MapDef = {
  id: 'neighbor_house',
  name: 'NEIGHBOR HOUSE',
  outdoor: false,
  border: 'iwall',
  legend: INDOOR_LEGEND,
  rows: [
    'IIIIIIIIII',
    'IffffffffI',
    'IfffffttfI',
    'IffffffffI',
    'IffffffffI',
    'IffffffffI',
    'IffffmmffI',
    'IIIIIIIIII',
  ],
  warps: [
    { x: 5, y: 6, toMap: 'myrtos_town', toX: 15, toY: 6, toDir: 'down' },
    { x: 6, y: 6, toMap: 'myrtos_town', toX: 15, toY: 6, toDir: 'down' },
  ],
  signs: [],
  npcs: [
    {
      id: 'neighbor',
      x: 6,
      y: 3,
      sprite: 'villager',
      dir: 'left',
      movement: 'static',
      dialog: [
        'The PROFESSOR studies wild CHIMERA.',
        'Her lab is up on ROUTE 1... or it will be, soon!',
      ],
    },
  ],
};

const LAUREL_LAB: MapDef = {
  id: 'laurel_lab',
  name: 'CHIMERA LAB',
  outdoor: false,
  border: 'iwall',
  legend: INDOOR_LEGEND,
  rows: [
    'IIIIIIIIIIII',
    'IffffffffffI',
    'IftffffffftI',
    'IffffffffffI',
    'IfffbbbffffI',
    'IffffffffffI',
    'IffffffffffI',
    'IffffffffffI',
    'IffffmmffffI',
    'IIIIIIIIIIII',
  ],
  warps: [
    { x: 5, y: 8, toMap: 'myrtos_town', toX: 10, toY: 14, toDir: 'down' },
    { x: 6, y: 8, toMap: 'myrtos_town', toX: 10, toY: 14, toDir: 'down' },
  ],
  signs: [],
  events: [
    { x: 4, y: 4, id: 'starter_grass' },
    { x: 5, y: 4, id: 'starter_fire' },
    { x: 6, y: 4, id: 'starter_water' },
  ],
  npcs: [
    {
      id: 'prof_laurel',
      x: 5,
      y: 2,
      sprite: 'professor',
      dir: 'down',
      movement: 'static',
      dialog: [
        'PROF. LAUREL: Each of these three young CHIMERA needs a partner.',
        'Go on, pick the one that speaks to your heart!',
      ],
    },
    {
      id: 'rival_theron',
      x: 8,
      y: 5,
      sprite: 'rival',
      dir: 'left',
      movement: 'static',
      dialog: ['THERON: Gran says I have to wait my turn. Hurry up and pick already!'],
    },
  ],
};

const KYMA_TOWN: MapDef = {
  id: 'kyma_town',
  name: 'KYMA TOWN',
  outdoor: true,
  border: 'tree',
  legend: OUTDOOR_LEGEND,
  rows: [
    'TTTTTTTTTTTTTTTTTTTT',
    'T..................T',
    'T..rrrr....rrrrrr..T',
    'T..rrrr....rrrrrr..T',
    'T..wodw....wwodww..T',
    'T..................T',
    'T.S.....,..........T',
    'T..................T',
    'T....rrrr..........T',
    'T....rrrr....,.....T',
    'T....wodw..........T',
    'T..................T',
    'T........,.........T',
    'T..............,...T',
    'T..................T',
    'T..................T',
    'T..................T',
    'TTTTTTTT..TTTTTTTTTT',
  ],
  warps: [
    { x: 5, y: 4, toMap: 'kyma_house', toX: 5, toY: 6, toDir: 'up' },
    { x: 7, y: 10, toMap: 'kyma_house2', toX: 5, toY: 6, toDir: 'up' },
  ],
  signs: [
    { x: 2, y: 6, text: ['KYMA TOWN', 'The waves carry every story here.'] },
  ],
  npcs: [
    {
      id: 'kyma_villager',
      x: 12,
      y: 12,
      sprite: 'villager',
      dir: 'down',
      movement: 'wander',
      dialog: [
        'Our GYM has been closed for weeks. The LEADER trains in the hills, they say.',
      ],
    },
    {
      id: 'kyma_kid',
      x: 8,
      y: 7,
      sprite: 'villager',
      dir: 'down',
      movement: 'wander',
      dialog: [
        'When a wild CHIMERA appears, you can catch it with a CAPSULE!',
        "The shop will stock them soon... I spent all my allowance already.",
      ],
    },
  ],
  connections: {
    south: { toMap: 'route1', offset: 0 },
  },
};

const KYMA_HOUSE: MapDef = {
  id: 'kyma_house',
  name: 'KYMA HOUSE',
  outdoor: false,
  border: 'iwall',
  legend: INDOOR_LEGEND,
  rows: [
    'IIIIIIIIII',
    'IffffffffI',
    'IfttfffffI',
    'IffffffffI',
    'IffffffffI',
    'IffffffffI',
    'IffffmmffI',
    'IIIIIIIIII',
  ],
  warps: [
    { x: 5, y: 6, toMap: 'kyma_town', toX: 5, toY: 5, toDir: 'down' },
    { x: 6, y: 6, toMap: 'kyma_town', toX: 5, toY: 5, toDir: 'down' },
  ],
  signs: [],
  npcs: [
    {
      id: 'kyma_fisher',
      x: 2,
      y: 4,
      sprite: 'villager',
      dir: 'down',
      movement: 'static',
      dialog: [
        'I used to fish off the south pier every morning.',
        'One day I will lend you my old ROD, promise.',
      ],
    },
  ],
};

const KYMA_HOUSE2: MapDef = {
  id: 'kyma_house2',
  name: 'KYMA HOUSE',
  outdoor: false,
  border: 'iwall',
  legend: INDOOR_LEGEND,
  rows: [
    'IIIIIIIIII',
    'IffffffffI',
    'IfffffttfI',
    'IffffffffI',
    'IffffffffI',
    'IffffffffI',
    'IffffmmffI',
    'IIIIIIIIII',
  ],
  warps: [
    { x: 5, y: 6, toMap: 'kyma_town', toX: 7, toY: 11, toDir: 'down' },
    { x: 6, y: 6, toMap: 'kyma_town', toX: 7, toY: 11, toDir: 'down' },
  ],
  signs: [],
  npcs: [
    {
      id: 'kyma_elder',
      x: 6,
      y: 3,
      sprite: 'villager',
      dir: 'left',
      movement: 'static',
      dialog: [
        'Long ago, folk said a storm bird sleeps beyond the far cape.',
        'Old tales, old tales... but every tale starts somewhere true.',
      ],
    },
  ],
};

const ROUTE1: MapDef = {
  id: 'route1',
  name: 'ROUTE 1',
  outdoor: true,
  border: 'tree',
  legend: OUTDOOR_LEGEND,
  rows: [
    'TTTTTTTT..TTTTTTTTTT',
    'T........,.........T',
    'T..GGGG............T',
    'T..GGGG.......S....T',
    'T..GGGG..GGG.......T',
    'T........GGG.......T',
    'T........GGG.......T',
    'T..................T',
    'T....LLLLLLLL......T',
    'T..................T',
    'T.......GGGG.......T',
    'T.......GGGG.......T',
    'T...,..............T',
    'T..................T',
    'T.......,......,...T',
    'T..GG..............T',
    'T..GG........GG....T',
    'T............GG....T',
    'T..................T',
    'T....,.............T',
    'T..................T',
    'T..................T',
    'T........,.........T',
    'T..................T',
    'T..................T',
    'T..................T',
    'TTTTTTTT..TTTTTTTTTT',
  ],
  warps: [],
  signs: [
    { x: 14, y: 3, text: ['ROUTE 1', 'MYRTOS TOWN -', 'KYMA TOWN'] },
  ],
  npcs: [
    {
      id: 'route1_hiker',
      x: 6,
      y: 13,
      sprite: 'villager',
      dir: 'down',
      movement: 'wander',
      dialog: [
        "Watch out for ledges! You can hop down them, but there's no way back up.",
      ],
    },
  ],
  connections: {
    south: { toMap: 'myrtos_town', offset: 0 },
    north: { toMap: 'kyma_town', offset: 0 },
  },
};

const DEFS = [
  MYRTOS_TOWN,
  PLAYER_HOUSE,
  NEIGHBOR_HOUSE,
  LAUREL_LAB,
  KYMA_TOWN,
  KYMA_HOUSE,
  KYMA_HOUSE2,
  ROUTE1,
];

let registry: Map<string, GameMap> | null = null;

export function getMap(id: string): GameMap {
  if (!registry) {
    registry = new Map(DEFS.map((d) => [d.id, new GameMap(d)]));
  }
  const m = registry.get(id);
  if (!m) throw new Error(`Unknown map: ${id}`);
  return m;
}

export const START_MAP = 'player_house';
export const START_POS = { x: 4, y: 4 };
