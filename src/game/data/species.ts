// Original creature roster for CHIMERA RED. Names, designs and dex text are
// original creations (Greek-myth flavored); stat structure and mechanics
// follow Gen 1 exactly. The dex grows with each content milestone toward 151.

export type MonsterType =
  | 'NORMAL'
  | 'FIGHTING'
  | 'FLYING'
  | 'POISON'
  | 'GROUND'
  | 'ROCK'
  | 'BUG'
  | 'GHOST'
  | 'FIRE'
  | 'WATER'
  | 'GRASS'
  | 'ELECTRIC'
  | 'PSYCHIC'
  | 'ICE'
  | 'DRAGON';

export type GrowthRate = 'fast' | 'medium_fast' | 'medium_slow' | 'slow';

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  spc: number;
}

export interface Evolution {
  level: number;
  into: string;
}

export interface SpeciesDef {
  id: string;
  dexNo: number;
  name: string;
  category: string; // dex category line, e.g. "SAPLING"
  types: [MonsterType] | [MonsterType, MonsterType];
  base: BaseStats;
  catchRate: number; // 0-255, Gen 1 style
  baseExp: number;
  growth: GrowthRate;
  evolution?: Evolution;
  learnset: { level: number; move: string }[];
  dexEntry: string;
}

interface SpeciesInput extends Omit<SpeciesDef, 'base' | 'learnset'> {
  base: [number, number, number, number, number]; // hp atk def spd spc
  learnset: [number, string][];
}

const S = (def: SpeciesInput): SpeciesDef => ({
  ...def,
  base: { hp: def.base[0], atk: def.base[1], def: def.base[2], spd: def.base[3], spc: def.base[4] },
  learnset: def.learnset.map(([level, move]) => ({ level, move })),
});

const LIST: SpeciesDef[] = [
  // --- Starter lines ---
  S({
    id: 'olivet', dexNo: 1, name: 'OLIVET', category: 'SAPLING', types: ['GRASS'],
    base: [45, 49, 49, 45, 65], catchRate: 45, baseExp: 64, growth: 'medium_slow',
    evolution: { level: 16, into: 'olivern' },
    learnset: [[1, 'ram'], [1, 'bleat'], [7, 'vinelash'], [13, 'sporeburst'], [20, 'leafcut'], [27, 'sapdrain'], [34, 'petalgale']],
    dexEntry: 'A sapling sprite. The olive shoot on its head grows all its life.',
  }),
  S({
    id: 'olivern', dexNo: 2, name: 'OLIVERN', category: 'GROVE', types: ['GRASS'],
    base: [60, 62, 63, 60, 80], catchRate: 45, baseExp: 141, growth: 'medium_slow',
    evolution: { level: 32, into: 'olivyrm' },
    learnset: [[1, 'ram'], [1, 'bleat'], [1, 'vinelash'], [13, 'sporeburst'], [22, 'leafcut'], [30, 'sapdrain'], [38, 'petalgale']],
    dexEntry: 'Its shoot has become a young bough. Birds nest in its shade.',
  }),
  S({
    id: 'olivyrm', dexNo: 3, name: 'OLIVYRM', category: 'ELDERTREE', types: ['GRASS', 'POISON'],
    base: [80, 82, 83, 80, 100], catchRate: 45, baseExp: 208, growth: 'medium_slow',
    learnset: [[1, 'vinelash'], [1, 'leafcut'], [30, 'sapdrain'], [43, 'petalgale'], [50, 'toxicmist']],
    dexEntry: 'An ancient grove wound into one being. Its pollen dazes foes.',
  }),
  S({
    id: 'pyrling', dexNo: 4, name: 'PYRLING', category: 'HEARTH', types: ['FIRE'],
    base: [39, 52, 43, 65, 50], catchRate: 45, baseExp: 62, growth: 'medium_slow',
    evolution: { level: 16, into: 'pyrvane' },
    learnset: [[1, 'ram'], [1, 'bleat'], [9, 'cinder'], [15, 'ashveil'], [22, 'furyclaws'], [30, 'slashfang'], [38, 'flarelash']],
    dexEntry: 'A hearth spirit. Its tail wick burns brighter when it is excited.',
  }),
  S({
    id: 'pyrvane', dexNo: 5, name: 'PYRVANE', category: 'BRAZIER', types: ['FIRE'],
    base: [58, 64, 58, 80, 65], catchRate: 45, baseExp: 142, growth: 'medium_slow',
    evolution: { level: 36, into: 'pyrvorax' },
    learnset: [[1, 'ram'], [1, 'cinder'], [15, 'ashveil'], [24, 'furyclaws'], [33, 'slashfang'], [42, 'flarelash']],
    dexEntry: 'Its flame steadies into a proud crest. It never chills at night.',
  }),
  S({
    id: 'pyrvorax', dexNo: 6, name: 'PYRVORAX', category: 'PYRE', types: ['FIRE', 'FLYING'],
    base: [78, 84, 78, 100, 85], catchRate: 45, baseExp: 209, growth: 'medium_slow',
    learnset: [[1, 'cinder'], [1, 'slashfang'], [36, 'galewing'], [46, 'flarelash'], [55, 'pyreburst']],
    dexEntry: 'A blaze given wings. Its passing warms whole valleys at dusk.',
  }),
  S({
    id: 'nerida', dexNo: 7, name: 'NERIDA', category: 'TIDEPOOL', types: ['WATER'],
    base: [44, 48, 65, 43, 50], catchRate: 45, baseExp: 63, growth: 'medium_slow',
    evolution: { level: 16, into: 'nerine' },
    learnset: [[1, 'ram'], [1, 'glare'], [8, 'tidejet'], [15, 'brinefog'], [22, 'shellclamp'], [31, 'mistveil'], [39, 'surgewave']],
    dexEntry: 'A tidepool nymph. It naps inside its spiral shell on hot days.',
  }),
  S({
    id: 'nerine', dexNo: 8, name: 'NERINE', category: 'LAGOON', types: ['WATER'],
    base: [59, 63, 80, 58, 65], catchRate: 45, baseExp: 142, growth: 'medium_slow',
    evolution: { level: 36, into: 'nereidon' },
    learnset: [[1, 'ram'], [1, 'tidejet'], [15, 'brinefog'], [24, 'shellclamp'], [33, 'mistveil'], [42, 'surgewave']],
    dexEntry: 'Its shell hardens into pearly armor. It sings to the evening tide.',
  }),
  S({
    id: 'nereidon', dexNo: 9, name: 'NEREIDON', category: 'DEEPSEA', types: ['WATER'],
    base: [79, 83, 100, 78, 85], catchRate: 45, baseExp: 210, growth: 'medium_slow',
    learnset: [[1, 'tidejet'], [1, 'shellclamp'], [36, 'mistveil'], [46, 'surgewave'], [55, 'glacierram']],
    dexEntry: 'Lord of quiet depths. Storms calm where its great shell drifts.',
  }),
  // --- Early routes ---
  S({
    id: 'mysling', dexNo: 10, name: 'MYSLING', category: 'FIELDMOUSE', types: ['NORMAL'],
    base: [30, 56, 35, 72, 25], catchRate: 255, baseExp: 57, growth: 'medium_fast',
    evolution: { level: 20, into: 'myserker' },
    learnset: [[1, 'ram'], [1, 'glare'], [7, 'quickdart'], [14, 'gnaw'], [23, 'furyclaws']],
    dexEntry: 'A field mouse chimera. It hoards shiny pebbles in its cheek pouches.',
  }),
  S({
    id: 'myserker', dexNo: 11, name: 'MYSERKER', category: 'GNAWER', types: ['NORMAL'],
    base: [55, 81, 60, 97, 50], catchRate: 127, baseExp: 116, growth: 'medium_fast',
    learnset: [[1, 'ram'], [1, 'quickdart'], [14, 'gnaw'], [27, 'furyclaws'], [41, 'bodycheck']],
    dexEntry: 'Its front teeth never stop growing. It gnaws standing stones flat.',
  }),
  S({
    id: 'sparvos', dexNo: 12, name: 'SPARVOS', category: 'HARBORBIRD', types: ['NORMAL', 'FLYING'],
    base: [40, 45, 40, 56, 35], catchRate: 255, baseExp: 55, growth: 'medium_slow',
    evolution: { level: 18, into: 'sparhawk' },
    learnset: [[1, 'peck'], [5, 'glare'], [12, 'gustline'], [19, 'quickdart'], [28, 'galewing']],
    dexEntry: 'A tiny harbor bird. It rides the sea breeze without flapping once.',
  }),
  S({
    id: 'sparhawk', dexNo: 13, name: 'SPARHAWK', category: 'SKERRYHAWK', types: ['NORMAL', 'FLYING'],
    base: [63, 60, 55, 71, 50], catchRate: 90, baseExp: 113, growth: 'medium_slow',
    learnset: [[1, 'peck'], [1, 'gustline'], [19, 'quickdart'], [31, 'galewing'], [40, 'skydive']],
    dexEntry: 'It patrols the coast in wide rings and dives like a thrown spear.',
  }),
  S({
    id: 'lumbee', dexNo: 14, name: 'LUMBEE', category: 'WAXGRUB', types: ['BUG'],
    base: [40, 35, 30, 50, 20], catchRate: 255, baseExp: 52, growth: 'medium_fast',
    evolution: { level: 7, into: 'lumbrood' },
    learnset: [[1, 'needlejab'], [1, 'ram']],
    dexEntry: 'A wax-coated grub. It glows faintly where honey flowers bloom.',
  }),
  S({
    id: 'lumbrood', dexNo: 15, name: 'LUMBROOD', category: 'WAXCASE', types: ['BUG'],
    base: [45, 25, 50, 30, 25], catchRate: 120, baseExp: 71, growth: 'medium_fast',
    evolution: { level: 10, into: 'lumdrone' },
    learnset: [[1, 'cocoonguard']],
    dexEntry: 'Sealed in hardened wax, it waits. Tapping it rings like a bell.',
  }),
  S({
    id: 'lumdrone', dexNo: 16, name: 'LUMDRONE', category: 'LAMPWING', types: ['BUG', 'FLYING'],
    base: [60, 45, 50, 70, 80], catchRate: 45, baseExp: 160, growth: 'medium_fast',
    learnset: [[1, 'gustline'], [12, 'needlejab'], [16, 'swarmrush'], [22, 'mirrordance'], [30, 'psiblast']],
    dexEntry: 'Its wings shed golden dust that glows along night roads.',
  }),
  S({
    id: 'vipion', dexNo: 17, name: 'VIPION', category: 'LANEVIPER', types: ['POISON'],
    base: [35, 60, 44, 55, 40], catchRate: 255, baseExp: 58, growth: 'medium_fast',
    evolution: { level: 22, into: 'vipryss' },
    learnset: [[1, 'venomsting'], [1, 'glare'], [10, 'gnaw'], [17, 'toxicmist'], [24, 'sludgeball']],
    dexEntry: 'A hedge viper chimera. Its scales smell faintly of crushed laurel.',
  }),
  S({
    id: 'vipryss', dexNo: 18, name: 'VIPRYSS', category: 'CROWNVIPER', types: ['POISON'],
    base: [60, 85, 69, 80, 65], catchRate: 90, baseExp: 120, growth: 'medium_fast',
    learnset: [[1, 'venomsting'], [1, 'gnaw'], [17, 'toxicmist'], [27, 'sludgeball'], [38, 'slashfang']],
    dexEntry: 'The hood it spreads bears a crown mark. Old roads are its kingdom.',
  }),
  S({
    id: 'voltaur', dexNo: 19, name: 'VOLTAUR', category: 'STORMCALF', types: ['ELECTRIC'],
    base: [35, 55, 40, 90, 50], catchRate: 190, baseExp: 82, growth: 'medium_fast',
    evolution: { level: 26, into: 'voltarion' },
    learnset: [[1, 'sparknip'], [1, 'bleat'], [9, 'quickdart'], [16, 'staticweb'], [26, 'voltlance']],
    dexEntry: 'A calf that grazes under thunderheads. Its horns hum before rain.',
  }),
  S({
    id: 'voltarion', dexNo: 20, name: 'VOLTARION', category: 'STORMBULL', types: ['ELECTRIC'],
    base: [60, 75, 60, 115, 75], catchRate: 75, baseExp: 152, growth: 'medium_fast',
    learnset: [[1, 'sparknip'], [1, 'quickdart'], [16, 'staticweb'], [30, 'voltlance'], [42, 'bodycheck']],
    dexEntry: 'It charges with the storm at its back. Fences mean nothing to it.',
  }),
  S({
    id: 'petraw', dexNo: 21, name: 'PETRAW', category: 'PEBBLE', types: ['ROCK', 'GROUND'],
    base: [40, 80, 100, 20, 30], catchRate: 255, baseExp: 86, growth: 'medium_slow',
    evolution: { level: 25, into: 'petrock' },
    learnset: [[1, 'ram'], [1, 'ironhide'], [11, 'stonecast'], [16, 'glare'], [26, 'quakestomp']],
    dexEntry: 'A pebble with stubby limbs. It naps among ordinary stones.',
  }),
  S({
    id: 'petrock', dexNo: 22, name: 'PETROCK', category: 'BOULDER', types: ['ROCK', 'GROUND'],
    base: [55, 95, 115, 35, 45], catchRate: 120, baseExp: 134, growth: 'medium_slow',
    learnset: [[1, 'ram'], [1, 'stonecast'], [16, 'ironhide'], [29, 'quakestomp'], [41, 'bodycheck']],
    dexEntry: 'Rolls downhill to travel. Roads bend around its favorite slopes.',
  }),
  S({
    id: 'gloomote', dexNo: 23, name: 'GLOOMOTE', category: 'CANDLEWISP', types: ['GHOST'],
    base: [30, 35, 30, 80, 100], catchRate: 190, baseExp: 95, growth: 'medium_fast',
    evolution: { level: 25, into: 'gloomurn' },
    learnset: [[1, 'shadegrip'], [1, 'glare'], [12, 'dizzyspin'], [19, 'dreamhex'], [27, 'mindjab']],
    dexEntry: 'A wisp that drifts from unlit lamps. It giggles in cold hallways.',
  }),
  S({
    id: 'gloomurn', dexNo: 24, name: 'GLOOMURN', category: 'URNSHADE', types: ['GHOST'],
    base: [45, 50, 45, 95, 115], catchRate: 90, baseExp: 126, growth: 'medium_fast',
    learnset: [[1, 'shadegrip'], [1, 'dizzyspin'], [19, 'dreamhex'], [31, 'mindjab'], [44, 'psiblast']],
    dexEntry: 'It nests in cracked urns. Whistling near one invites a cold draft.',
  }),
  S({
    id: 'fawnix', dexNo: 25, name: 'FAWNIX', category: 'DAPPLEFAWN', types: ['NORMAL'],
    base: [55, 45, 45, 60, 60], catchRate: 190, baseExp: 89, growth: 'medium_fast',
    learnset: [[1, 'ram'], [1, 'bleat'], [8, 'quickdart'], [15, 'mend'], [24, 'bodycheck'], [32, 'warble']],
    dexEntry: 'Its dappled coat mirrors the season. In autumn it turns gold.',
  }),
  S({
    id: 'psygnet', dexNo: 26, name: 'PSYGNET', category: 'DREAMSWAN', types: ['PSYCHIC'],
    base: [45, 30, 40, 60, 90], catchRate: 150, baseExp: 100, growth: 'medium_fast',
    learnset: [[1, 'mindjab'], [10, 'dizzyspin'], [18, 'focusveil'], [26, 'dreamhex'], [36, 'psiblast']],
    dexEntry: 'A swan that swims through dreams. Sleepers smile when it passes.',
  }),
  S({
    id: 'brawlyx', dexNo: 27, name: 'BRAWLYX', category: 'SPARRER', types: ['FIGHTING'],
    base: [65, 80, 50, 55, 35], catchRate: 180, baseExp: 91, growth: 'medium_fast',
    learnset: [[1, 'palmstrike'], [7, 'warcry'], [14, 'doublekick'], [24, 'breakerfist']],
    dexEntry: 'It trains by striking waterfalls. Its palms are hard as oars.',
  }),
  S({
    id: 'frostkid', dexNo: 28, name: 'FROSTKID', category: 'RIMEGOAT', types: ['ICE'],
    base: [50, 55, 60, 55, 65], catchRate: 150, baseExp: 98, growth: 'medium_fast',
    learnset: [[1, 'ram'], [1, 'frostbite'], [13, 'ironhide'], [22, 'mistveil'], [34, 'glacierram']],
    dexEntry: 'A goat kid rimed with frost. It grazes where morning ice lingers.',
  }),
  S({
    id: 'drakelet', dexNo: 29, name: 'DRAKELET', category: 'CAPEWYRM', types: ['DRAGON'],
    base: [41, 64, 45, 50, 50], catchRate: 45, baseExp: 67, growth: 'slow',
    learnset: [[1, 'wyrmgale'], [1, 'glare'], [10, 'quickdart'], [20, 'slashfang'], [35, 'surgewave']],
    dexEntry: 'Sailors swear the far cape hides these. Few have proof.',
  }),
  // --- Route 2 / Halite Cave / Pyrgos region ---
  S({
    id: 'pelikos', dexNo: 30, name: 'PELIKOS', category: 'DOCKBIRD', types: ['WATER', 'FLYING'],
    base: [50, 40, 40, 60, 45], catchRate: 190, baseExp: 77, growth: 'medium_fast',
    evolution: { level: 25, into: 'pelagorn' },
    learnset: [[1, 'peck'], [1, 'tidejet'], [12, 'gustline'], [20, 'mistveil'], [28, 'galewing']],
    dexEntry: 'It scoops whole tidepools into its beak pouch, crabs and all.',
  }),
  S({
    id: 'pelagorn', dexNo: 31, name: 'PELAGORN', category: 'GALEBIRD', types: ['WATER', 'FLYING'],
    base: [70, 55, 55, 85, 65], catchRate: 75, baseExp: 154, growth: 'medium_fast',
    learnset: [[1, 'peck'], [1, 'tidejet'], [20, 'mistveil'], [30, 'galewing'], [40, 'surgewave']],
    dexEntry: 'It rides storms far past the horizon and returns with strange shells.',
  }),
  S({
    id: 'urchinet', dexNo: 32, name: 'URCHINET', category: 'SPINEBALL', types: ['WATER'],
    base: [45, 55, 70, 30, 55], catchRate: 190, baseExp: 81, growth: 'medium_fast',
    evolution: { level: 26, into: 'urchidon' },
    learnset: [[1, 'needlejab'], [1, 'tidejet'], [14, 'ironhide'], [22, 'venomsting'], [30, 'surgewave']],
    dexEntry: 'Its spines drink brine and glow faintly violet at low tide.',
  }),
  S({
    id: 'urchidon', dexNo: 33, name: 'URCHIDON', category: 'REEFCROWN', types: ['WATER', 'POISON'],
    base: [65, 75, 95, 45, 75], catchRate: 60, baseExp: 160, growth: 'medium_fast',
    learnset: [[1, 'needlejab'], [1, 'tidejet'], [22, 'venomsting'], [32, 'sludgeball'], [42, 'surgewave']],
    dexEntry: 'Reefs grow around it like a crown. Divers give it a wide berth.',
  }),
  S({
    id: 'vesperon', dexNo: 34, name: 'VESPERON', category: 'DUSKBAT', types: ['POISON', 'FLYING'],
    base: [40, 45, 35, 55, 40], catchRate: 255, baseExp: 54, growth: 'medium_fast',
    evolution: { level: 22, into: 'vesperyx' },
    learnset: [[1, 'gnaw'], [1, 'glare'], [10, 'venomsting'], [17, 'gustline'], [26, 'dizzyspin']],
    dexEntry: 'It naps hooked to cave salt. Its squeak sets crystals ringing.',
  }),
  S({
    id: 'vesperyx', dexNo: 35, name: 'VESPERYX', category: 'NIGHTWING', types: ['POISON', 'FLYING'],
    base: [75, 80, 70, 90, 65], catchRate: 90, baseExp: 135, growth: 'medium_fast',
    learnset: [[1, 'gnaw'], [1, 'venomsting'], [17, 'gustline'], [30, 'dizzyspin'], [40, 'galewing']],
    dexEntry: 'Its wingbeats are silent as dusk. Miners follow it to fresh air.',
  }),
  S({
    id: 'crystalit', dexNo: 36, name: 'CRYSTALIT', category: 'SALTGEM', types: ['ROCK'],
    base: [40, 60, 85, 25, 55], catchRate: 150, baseExp: 86, growth: 'medium_slow',
    evolution: { level: 30, into: 'crystrag' },
    learnset: [[1, 'ram'], [1, 'ironhide'], [13, 'stonecast'], [21, 'glare'], [31, 'mirrordance']],
    dexEntry: 'A living halite shard. Lamplight scatters through it in rainbows.',
  }),
  S({
    id: 'crystrag', dexNo: 37, name: 'CRYSTRAG', category: 'GEODEHULK', types: ['ROCK'],
    base: [65, 85, 115, 40, 80], catchRate: 60, baseExp: 168, growth: 'medium_slow',
    learnset: [[1, 'stonecast'], [1, 'ironhide'], [21, 'mirrordance'], [34, 'crushblow'], [44, 'quakestomp']],
    dexEntry: 'Its cracked hide hides a geode heart. It hums in the dark.',
  }),
  S({
    id: 'thistletot', dexNo: 38, name: 'THISTLETOT', category: 'BURRCHILD', types: ['GRASS'],
    base: [40, 50, 45, 50, 40], catchRate: 235, baseExp: 60, growth: 'medium_fast',
    evolution: { level: 21, into: 'thistrella' },
    learnset: [[1, 'ram'], [1, 'vinelash'], [11, 'needlejab'], [18, 'sporeburst'], [26, 'sapdrain']],
    dexEntry: 'It hitches rides on travelers cloaks and drops off at nice meadows.',
  }),
  S({
    id: 'thistrella', dexNo: 39, name: 'THISTRELLA', category: 'BRAMBLE', types: ['GRASS', 'POISON'],
    base: [60, 75, 65, 70, 60], catchRate: 90, baseExp: 132, growth: 'medium_fast',
    learnset: [[1, 'vinelash'], [1, 'needlejab'], [18, 'sporeburst'], [28, 'sapdrain'], [38, 'petalgale']],
    dexEntry: 'Its bramble skirt snags whole hedgerows. Farmers both curse and thank it.',
  }),
  S({
    id: 'minnowle', dexNo: 40, name: 'MINNOWLE', category: 'PUDDLEFISH', types: ['WATER'],
    base: [20, 10, 55, 80, 20], catchRate: 255, baseExp: 20, growth: 'slow',
    evolution: { level: 20, into: 'leviathra' },
    learnset: [[1, 'quickdart'], [15, 'ram']],
    dexEntry: 'It flops more than it swims. Somehow, it endures every net.',
  }),
  S({
    id: 'leviathra', dexNo: 41, name: 'LEVIATHRA', category: 'SEAWRATH', types: ['WATER', 'DRAGON'],
    base: [95, 125, 79, 81, 60], catchRate: 45, baseExp: 214, growth: 'slow',
    learnset: [[20, 'gnaw'], [25, 'wyrmgale'], [32, 'slashfang'], [41, 'surgewave'], [50, 'pyreburst']],
    dexEntry: 'The meek puddlefish reborn as a storm. Harbors empty when it sings.',
  }),
];

export const SPECIES: Record<string, SpeciesDef> = Object.fromEntries(LIST.map((s) => [s.id, s]));

export const DEX_ORDER: string[] = LIST.map((s) => s.id);

export function species(id: string): SpeciesDef {
  const s = SPECIES[id];
  if (!s) throw new Error(`Unknown species: ${id}`);
  return s;
}
