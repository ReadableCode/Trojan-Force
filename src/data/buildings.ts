export interface BuildingDef {
  key: string;
  label: string;
  cost: Partial<Record<string, number>>;
  hp: number;
  color: number;
  blocksPath?: boolean;
  description?: string;
}

export interface MinerDef extends BuildingDef {
  outputRate: number;  // units per second
  requiresResource: true;
}

export const WALL_DEFS: Record<string, BuildingDef> = {
  wall: {
    key: 'wall', label: 'Wall',
    cost: { iron: 5 }, hp: 100,
    color: 0x888888, blocksPath: true,
  },
  reinforcedWall: {
    key: 'reinforcedWall', label: 'Reinforced Wall',
    cost: { iron: 5, copper: 5 }, hp: 300,
    color: 0xaaaaaa, blocksPath: true,
  },
};

export const SUPPORT_DEFS: Record<string, BuildingDef> = {
  conveyor: {
    key: 'conveyor', label: 'Conveyor',
    cost: { iron: 3 }, hp: 50,
    color: 0x885500,
    description: 'Routes ammo to nearby towers',
  },
  ammoCache: {
    key: 'ammoCache', label: 'Ammo Cache',
    cost: { iron: 10 }, hp: 80,
    color: 0x556677,
    description: 'Buffers ammo to prevent tower starvation',
  },
  coalPowerPlant: {
    key: 'coalPowerPlant', label: 'Power Plant',
    cost: { iron: 30, coal: 20 }, hp: 100,
    color: 0xff7700,
    description: 'Generates 50 Power/sec (burns Coal)',
  },
  solarPanel: {
    key: 'solarPanel', label: 'Solar Panel',
    cost: { copper: 20, crystal: 10 }, hp: 60,
    color: 0x3366ff,
    description: 'Generates 20 Power/sec',
  },
  researchLab: {
    key: 'researchLab', label: 'Research Lab',
    cost: { iron: 40, crystal: 20 }, hp: 120,
    color: 0x993399,
    description: 'Processes Crystal to unlock upgrades',
  },
};

export const MINER_DEFS: Record<string, MinerDef> = {
  drill: {
    key: 'drill', label: 'Drill',
    cost: { iron: 20 }, hp: 80,
    color: 0xcccc00,
    outputRate: 2,
    requiresResource: true,
    description: 'Must be placed on a resource patch',
  },
  pumpDrill: {
    key: 'pumpDrill', label: 'Pump Drill',
    cost: { iron: 10, copper: 10 }, hp: 100,
    color: 0xaacc00,
    outputRate: 4,
    requiresResource: true,
    description: 'Upgraded drill, faster output',
  },
  deepMiner: {
    key: 'deepMiner', label: 'Deep Miner',
    cost: { iron: 30, crystal: 20 }, hp: 150,
    color: 0x88dd00,
    outputRate: 8,
    requiresResource: true,
    description: 'Requires Deep Mining research',
  },
};

export type AnyBuildingKey =
  | keyof typeof WALL_DEFS
  | keyof typeof SUPPORT_DEFS
  | keyof typeof MINER_DEFS;
