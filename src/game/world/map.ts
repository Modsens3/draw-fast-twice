import { TILE, TileBehavior, TileId, tileBehavior } from './tiles';
import type { Dir, SpriteId } from './sprites';

export interface Warp {
  x: number;
  y: number;
  toMap: string;
  toX: number;
  toY: number;
  toDir: Dir;
}

export interface SignDef {
  x: number;
  y: number;
  text: string[];
}

export interface NpcDef {
  id: string;
  x: number;
  y: number;
  sprite: SpriteId;
  dir: Dir;
  movement: 'static' | 'wander';
  dialog: string[];
}

export interface Connection {
  toMap: string;
  // Tile offset added to the crossing axis coordinate when entering the destination map.
  offset: number;
}

export interface MapDef {
  id: string;
  name: string;
  rows: string[];
  legend: Record<string, TileId>;
  border: TileId;
  outdoor: boolean;
  warps: Warp[];
  signs: SignDef[];
  npcs: NpcDef[];
  connections?: Partial<Record<'north' | 'south' | 'east' | 'west', Connection>>;
}

export class GameMap {
  readonly def: MapDef;
  readonly width: number;
  readonly height: number;
  private grid: TileId[][];

  constructor(def: MapDef) {
    this.def = def;
    this.height = def.rows.length;
    this.width = def.rows[0].length;
    this.grid = def.rows.map((row) =>
      [...row].map((ch) => {
        const id = def.legend[ch];
        if (!id) throw new Error(`Map ${def.id}: unknown legend char '${ch}'`);
        return id;
      }),
    );
  }

  tileAt(x: number, y: number): TileId {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return this.def.border;
    return this.grid[y][x];
  }

  behaviorAt(x: number, y: number): TileBehavior {
    return tileBehavior(this.tileAt(x, y));
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  warpAt(x: number, y: number): Warp | undefined {
    return this.def.warps.find((w) => w.x === x && w.y === y);
  }

  signAt(x: number, y: number): SignDef | undefined {
    return this.def.signs.find((s) => s.x === x && s.y === y);
  }

  get pixelWidth(): number {
    return this.width * TILE;
  }

  get pixelHeight(): number {
    return this.height * TILE;
  }
}
