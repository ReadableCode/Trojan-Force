export interface TowerDef {
  key: string;
  label: string;
  cost: Partial<Record<string, number>>;
  dps: number;
  range: number;        // in tiles
  fireRate: number;     // shots per second
  damage: number;
  ammoType?: string;    // resource key for ammo
  ammoPerShot?: number;
  usePower?: boolean;
  powerPerShot?: number;
  splash?: number;      // splash radius in tiles
  dot?: { damage: number; duration: number };
  chain?: number;
  piercesArmor?: boolean;
  color: number;
  projectileColor: number;
  projectileSize: number;
}

export const TOWER_DEFS: Record<string, TowerDef> = {
  turret: {
    key: 'turret', label: 'Turret',
    cost: { iron: 30 },
    dps: 15, range: 4, fireRate: 1, damage: 15,
    color: 0x3344bb, projectileColor: 0xffff44, projectileSize: 4,
  },
  cannon: {
    key: 'cannon', label: 'Cannon',
    cost: { iron: 50, copper: 20 },
    dps: 40, range: 5, fireRate: 0.5, damage: 80,
    ammoType: 'iron', ammoPerShot: 2, splash: 1.5,
    color: 0x885500, projectileColor: 0x888800, projectileSize: 8,
  },
  tesla: {
    key: 'tesla', label: 'Tesla',
    cost: { copper: 60 },
    dps: 30, range: 3, fireRate: 2, damage: 15,
    chain: 3, usePower: true, powerPerShot: 5,
    color: 0x9900cc, projectileColor: 0xcc88ff, projectileSize: 3,
  },
  flameTower: {
    key: 'flameTower', label: 'Flame Tower',
    cost: { iron: 40, coal: 30 },
    dps: 25, range: 2, fireRate: 4, damage: 6,
    ammoType: 'coal', ammoPerShot: 1,
    dot: { damage: 5, duration: 2 },
    color: 0xcc3300, projectileColor: 0xff6600, projectileSize: 6,
  },
  crystalSniper: {
    key: 'crystalSniper', label: 'Crystal Sniper',
    cost: { iron: 20, crystal: 40 },
    dps: 80, range: 9, fireRate: 0.33, damage: 240,
    color: 0x00aaaa, projectileColor: 0x44ffff, projectileSize: 5,
  },
  laser: {
    key: 'laser', label: 'Laser',
    cost: { copper: 50, crystal: 30 },
    dps: 60, range: 6, fireRate: 10, damage: 6,
    usePower: true, powerPerShot: 2,
    piercesArmor: true,
    color: 0x004444, projectileColor: 0x00ff88, projectileSize: 3,
  },
};
