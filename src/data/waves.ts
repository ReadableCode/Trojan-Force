export interface WaveSpawn {
  type: string;
  count: number;
  intervalSecs: number;
  delayOffsetSecs?: number;
  spawnEdge?: 'top' | 'left' | 'right';
}

export interface WaveDef {
  wave: number;
  spawns: WaveSpawn[];
  hpScale?: number;
}

const HP_SCALE_PER_WAVE = 1.15;

function scaleHp(wave: number): number {
  return Math.pow(HP_SCALE_PER_WAVE, wave - 1);
}

export const WAVE_DEFS: WaveDef[] = [
  { wave: 1,  spawns: [{ type: 'crawler', count: 8,  intervalSecs: 1.2 }], hpScale: scaleHp(1) },
  { wave: 2,  spawns: [{ type: 'crawler', count: 12, intervalSecs: 1.0 }], hpScale: scaleHp(2) },
  { wave: 3,  spawns: [{ type: 'crawler', count: 16, intervalSecs: 0.8 }], hpScale: scaleHp(3) },
  { wave: 4,  spawns: [{ type: 'crawler', count: 20, intervalSecs: 0.7 }], hpScale: scaleHp(4) },
  {
    wave: 5,
    spawns: [
      { type: 'crawler',   count: 10, intervalSecs: 0.6 },
      { type: 'swarmQueen', count: 1, intervalSecs: 20, delayOffsetSecs: 5 },
    ],
    hpScale: scaleHp(5),
  },
  {
    wave: 6,
    spawns: [
      { type: 'crawler', count: 15, intervalSecs: 0.7 },
      { type: 'brute',   count: 3,  intervalSecs: 3.0, delayOffsetSecs: 3 },
    ],
    hpScale: scaleHp(6),
  },
  {
    wave: 7,
    spawns: [
      { type: 'crawler', count: 18, intervalSecs: 0.6 },
      { type: 'brute',   count: 5,  intervalSecs: 2.5 },
    ],
    hpScale: scaleHp(7),
  },
  {
    wave: 8,
    spawns: [
      { type: 'crawler', count: 20, intervalSecs: 0.5 },
      { type: 'brute',   count: 6,  intervalSecs: 2.0 },
      { type: 'burster', count: 4,  intervalSecs: 3.0, delayOffsetSecs: 4 },
    ],
    hpScale: scaleHp(8),
  },
  {
    wave: 9,
    spawns: [
      { type: 'crawler', count: 22, intervalSecs: 0.45 },
      { type: 'brute',   count: 8,  intervalSecs: 1.8 },
      { type: 'burster', count: 6,  intervalSecs: 2.5, delayOffsetSecs: 2 },
    ],
    hpScale: scaleHp(9),
  },
  {
    wave: 10,
    spawns: [
      { type: 'crawler',     count: 20, intervalSecs: 0.4 },
      { type: 'brute',       count: 10, intervalSecs: 1.5 },
      { type: 'armoredTank', count: 2,  intervalSecs: 15, delayOffsetSecs: 8 },
    ],
    hpScale: scaleHp(10),
  },
  {
    wave: 11,
    spawns: [
      { type: 'crawler', count: 20, intervalSecs: 0.45 },
      { type: 'flyer',   count: 8,  intervalSecs: 1.5 },
    ],
    hpScale: scaleHp(11),
  },
  {
    wave: 12,
    spawns: [
      { type: 'crawler', count: 20, intervalSecs: 0.4 },
      { type: 'flyer',   count: 12, intervalSecs: 1.2 },
      { type: 'brute',   count: 6,  intervalSecs: 2.0, delayOffsetSecs: 3 },
    ],
    hpScale: scaleHp(12),
  },
  {
    wave: 13,
    spawns: [
      { type: 'crawler',  count: 25, intervalSecs: 0.35 },
      { type: 'flyer',    count: 15, intervalSecs: 1.0 },
      { type: 'brute',    count: 8,  intervalSecs: 1.8, delayOffsetSecs: 2 },
    ],
    hpScale: scaleHp(13),
  },
  {
    wave: 14,
    spawns: [
      { type: 'crawler',  count: 25, intervalSecs: 0.35 },
      { type: 'flyer',    count: 15, intervalSecs: 1.0 },
      { type: 'burrower', count: 5,  intervalSecs: 3.5, delayOffsetSecs: 5 },
    ],
    hpScale: scaleHp(14),
  },
  {
    wave: 15,
    spawns: [
      { type: 'crawler',     count: 50, intervalSecs: 0.2 },
      { type: 'brute',       count: 15, intervalSecs: 1.0, delayOffsetSecs: 2 },
      { type: 'flyer',       count: 20, intervalSecs: 0.8, delayOffsetSecs: 1 },
      { type: 'burster',     count: 10, intervalSecs: 1.5, delayOffsetSecs: 3 },
      { type: 'armoredTank', count: 3,  intervalSecs: 10, delayOffsetSecs: 10 },
    ],
    hpScale: scaleHp(15),
  },
  {
    wave: 16,
    spawns: [
      { type: 'crawler',  count: 30, intervalSecs: 0.3 },
      { type: 'brute',    count: 10, intervalSecs: 1.2 },
      { type: 'burrower', count: 8,  intervalSecs: 2.5, delayOffsetSecs: 3 },
    ],
    hpScale: scaleHp(16),
  },
  {
    wave: 17,
    spawns: [
      { type: 'crawler',  count: 30, intervalSecs: 0.3 },
      { type: 'flyer',    count: 20, intervalSecs: 0.8 },
      { type: 'burrower', count: 10, intervalSecs: 2.0, delayOffsetSecs: 4 },
    ],
    hpScale: scaleHp(17),
  },
  {
    wave: 18,
    spawns: [
      { type: 'crawler',     count: 35, intervalSecs: 0.25 },
      { type: 'brute',       count: 15, intervalSecs: 1.0 },
      { type: 'flyer',       count: 20, intervalSecs: 0.8, delayOffsetSecs: 2 },
      { type: 'armoredTank', count: 4,  intervalSecs: 8,  delayOffsetSecs: 8 },
    ],
    hpScale: scaleHp(18),
  },
  {
    wave: 19,
    spawns: [
      { type: 'crawler',  count: 40, intervalSecs: 0.2 },
      { type: 'brute',    count: 20, intervalSecs: 0.8 },
      { type: 'flyer',    count: 25, intervalSecs: 0.6, delayOffsetSecs: 2 },
      { type: 'burrower', count: 12, intervalSecs: 1.5, delayOffsetSecs: 3 },
      { type: 'burster',  count: 15, intervalSecs: 1.0, delayOffsetSecs: 1 },
    ],
    hpScale: scaleHp(19),
  },
  {
    wave: 20,
    spawns: [
      { type: 'crawler',     count: 30, intervalSecs: 0.2 },
      { type: 'brute',       count: 15, intervalSecs: 0.8 },
      { type: 'flyer',       count: 20, intervalSecs: 0.6, delayOffsetSecs: 2 },
      { type: 'armoredTank', count: 5,  intervalSecs: 6,  delayOffsetSecs: 5 },
      { type: 'swarmQueen',  count: 3,  intervalSecs: 15, delayOffsetSecs: 15 },
    ],
    hpScale: scaleHp(20),
  },
];
