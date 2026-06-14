export interface ResearchDef {
  key: string;
  label: string;
  cost: { crystal: number };
  description: string;
  requires?: string[];
}

export const RESEARCH_DEFS: Record<string, ResearchDef> = {
  drillEff1: {
    key: 'drillEff1', label: 'Drill Efficiency I',
    cost: { crystal: 20 },
    description: 'Drills output +25%',
  },
  drillEff2: {
    key: 'drillEff2', label: 'Drill Efficiency II',
    cost: { crystal: 60 },
    description: 'Drills output +50% cumulative',
    requires: ['drillEff1'],
  },
  turretRange: {
    key: 'turretRange', label: 'Turret Range',
    cost: { crystal: 30 },
    description: 'All turrets +1 range',
  },
  explosiveShells: {
    key: 'explosiveShells', label: 'Explosive Shells',
    cost: { crystal: 50 },
    description: 'Cannon shells splash on impact',
  },
  powerGrid: {
    key: 'powerGrid', label: 'Power Grid',
    cost: { crystal: 40 },
    description: 'Tesla/Laser power cost -30%',
  },
  reinforcedWallsResearch: {
    key: 'reinforcedWallsResearch', label: 'Reinforced Walls',
    cost: { crystal: 25 },
    description: 'Walls gain +50 HP',
  },
  deepMining: {
    key: 'deepMining', label: 'Deep Mining',
    cost: { crystal: 80 },
    description: 'Unlocks Deep Miner building',
    requires: ['drillEff2'],
  },
  autoConveyor: {
    key: 'autoConveyor', label: 'Auto-Conveyor',
    cost: { crystal: 60 },
    description: 'Conveyors self-route to nearest hungry tower',
  },
};
