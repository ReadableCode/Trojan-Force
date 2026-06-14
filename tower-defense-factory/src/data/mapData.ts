export interface ResourcePatch {
  gx: number;
  gy: number;
  type: 'iron' | 'copper' | 'coal' | 'crystal';
  amount: number;
  color: number;
}

export const RESOURCE_PATCHES: ResourcePatch[] = [
  { gx: 2,  gy: 1,  type: 'iron',    amount: 2000, color: 0x888888 },
  { gx: 5,  gy: 2,  type: 'iron',    amount: 1800, color: 0x888888 },
  { gx: 10, gy: 1,  type: 'iron',    amount: 1600, color: 0x888888 },
  { gx: 14, gy: 2,  type: 'coal',    amount: 1200, color: 0x333333 },
  { gx: 19, gy: 1,  type: 'coal',    amount: 1000, color: 0x333333 },
  { gx: 2,  gy: 12, type: 'copper',  amount: 1400, color: 0xcc6600 },
  { gx: 6,  gy: 13, type: 'copper',  amount: 1100, color: 0xcc6600 },
  { gx: 25, gy: 10, type: 'crystal', amount: 600,  color: 0x00cccc },
  { gx: 29, gy: 12, type: 'crystal', amount: 450,  color: 0x00cccc },
];

export const CORE_POS = { gx: 15, gy: 14 };

export type SpawnEdge = 'top' | 'left' | 'right';

export const SPAWN_EDGES: SpawnEdge[] = ['top', 'left', 'right'];
