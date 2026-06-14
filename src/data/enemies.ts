export interface EnemyDef {
  key: string;
  label: string;
  hp: number;
  speed: number;       // pixels per second
  armor: number;       // % damage reduction
  damage: number;      // damage dealt to core
  color: number;       // hex color for texture
  flying?: boolean;
  tunneling?: boolean;
  explodeOnDeath?: boolean;
  spawnOnDeath?: { type: string; count: number };
  reward: Partial<Record<string, number>>;
  scale?: number;
}

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  crawler: {
    key: 'crawler', label: 'Crawler',
    hp: 60, speed: 90, armor: 0, damage: 5,
    color: 0xff3333,
    reward: { iron: 5 },
  },
  brute: {
    key: 'brute', label: 'Brute',
    hp: 300, speed: 45, armor: 20, damage: 20,
    color: 0xaa1111, scale: 1.4,
    reward: { iron: 15, copper: 5 },
  },
  burster: {
    key: 'burster', label: 'Burster',
    hp: 80, speed: 75, armor: 0, damage: 8,
    color: 0xff8800,
    explodeOnDeath: true,
    reward: { iron: 8 },
  },
  flyer: {
    key: 'flyer', label: 'Flyer',
    hp: 120, speed: 110, armor: 0, damage: 10,
    color: 0xff44ff,
    flying: true,
    reward: { iron: 10, copper: 3 },
  },
  burrower: {
    key: 'burrower', label: 'Burrower',
    hp: 200, speed: 65, armor: 10, damage: 15,
    color: 0x884400,
    tunneling: true,
    reward: { iron: 12, copper: 5 },
  },
  armoredTank: {
    key: 'armoredTank', label: 'Armored Tank',
    hp: 800, speed: 28, armor: 50, damage: 40,
    color: 0x666666, scale: 1.6,
    reward: { iron: 40, copper: 15, crystal: 5 },
  },
  swarmQueen: {
    key: 'swarmQueen', label: 'Swarm Queen',
    hp: 400, speed: 38, armor: 20, damage: 30,
    color: 0x880088, scale: 1.5,
    spawnOnDeath: { type: 'crawler', count: 4 },
    reward: { iron: 30, copper: 10 },
  },
};
