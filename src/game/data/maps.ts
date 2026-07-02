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
    'T..................T',
    'T...,..............T',
    'T..................T',
    'T..................T',
    'T.....,........,...T',
    'T..................T',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  warps: [
    { x: 5, y: 5, toMap: 'player_house', toX: 5, toY: 6, toDir: 'up' },
    { x: 15, y: 5, toMap: 'neighbor_house', toX: 5, toY: 6, toDir: 'up' },
  ],
  signs: [
    { x: 2, y: 7, text: ['MYRTOS TOWN', 'Where the olive', 'breeze blows.'] },
  ],
  npcs: [
    {
      id: 'myrtos_villager',
      x: 13,
      y: 12,
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

const ROUTE1: MapDef = {
  id: 'route1',
  name: 'ROUTE 1',
  outdoor: true,
  border: 'tree',
  legend: OUTDOOR_LEGEND,
  rows: [
    'TTTTTTTTTTTTTTTTTTTT',
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
  },
};

const DEFS = [MYRTOS_TOWN, PLAYER_HOUSE, NEIGHBOR_HOUSE, ROUTE1];

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
