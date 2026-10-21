import Phaser from 'phaser';
import { TILE_SIZE, tileToWorld } from '../constants';
import { ResourceManager } from '../ResourceManager';

export type BuildingType = 'wall' | 'reinforcedWall' | 'drill' | 'pumpDrill' | 'deepMiner'
  | 'conveyor' | 'ammoCache' | 'coalPowerPlant' | 'solarPanel' | 'researchLab';

interface BuildingConfig {
  hp: number;
  color: number;
  outputRate?: number;     // for miners
  resourceType?: string;   // for miners: what resource is here
  powerOutput?: number;    // for power buildings
  powerType?: 'coal' | 'solar';
}

const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {
  wall:            { hp: 100, color: 0x888888 },
  reinforcedWall:  { hp: 300, color: 0xbbbbbb },
  drill:           { hp: 80,  color: 0xcccc00, outputRate: 2 },
  pumpDrill:       { hp: 100, color: 0xaacc00, outputRate: 4 },
  deepMiner:       { hp: 150, color: 0x88dd00, outputRate: 8 },
  conveyor:        { hp: 50,  color: 0x885500 },
  ammoCache:       { hp: 80,  color: 0x556677 },
  coalPowerPlant:  { hp: 100, color: 0xff7700, powerOutput: 50, powerType: 'coal' },
  solarPanel:      { hp: 60,  color: 0x3366ff, powerOutput: 20, powerType: 'solar' },
  researchLab:     { hp: 120, color: 0x993399 },
};

export class Building {
  sprite: Phaser.GameObjects.Rectangle;
  icon?: Phaser.GameObjects.Image;
  hpBar?: Phaser.GameObjects.Rectangle;
  hpBarBg?: Phaser.GameObjects.Rectangle;

  readonly gx: number;
  readonly gy: number;
  readonly type: BuildingType;
  readonly rotation: number;   // conveyor facing, index into DIRECTIONS

  hp: number;
  maxHp: number;
  alive = true;

  private cfg: BuildingConfig;
  private mineAccum = 0;
  private powerAccum = 0;
  private coalBurnAccum = 0;

  resourceType = '';
  drillEffBonus = 1;

  constructor(
    scene: Phaser.Scene,
    gx: number, gy: number,
    type: BuildingType,
    resourceType = '',
    rotation = 0,
  ) {
    this.gx = gx;
    this.gy = gy;
    this.type = type;
    this.resourceType = resourceType;
    this.rotation = rotation;
    this.cfg = BUILDING_CONFIGS[type];
    this.maxHp = this.cfg.hp;
    this.hp = this.maxHp;

    const { x, y } = tileToWorld(gx, gy);

    this.sprite = scene.add.rectangle(x, y, TILE_SIZE - 2, TILE_SIZE - 2, this.cfg.color);
    this.sprite.setDepth(2);

    if (type === 'conveyor') {
      this.icon = scene.add.image(x, y, 'conveyor').setDepth(3).setRotation(rotation * Math.PI / 2);
    }

    if (type !== 'wall' && type !== 'reinforcedWall' && type !== 'conveyor') {
      this.hpBarBg = scene.add.rectangle(x, y - 18, 24, 3, 0x330000);
      this.hpBarBg.setDepth(4);
      this.hpBar = scene.add.rectangle(x - 12, y - 18, 24, 3, 0x00cc00);
      this.hpBar.setDepth(4);
      this.hpBar.setOrigin(0, 0.5);
    }
  }

  isMiner(): boolean {
    return this.type === 'drill' || this.type === 'pumpDrill' || this.type === 'deepMiner';
  }

  isPowerSource(): boolean {
    return this.type === 'coalPowerPlant' || this.type === 'solarPanel';
  }

  update(dt: number, resources: ResourceManager, remainingPatchAmount: number): number {
    if (!this.alive) return 0;
    let extracted = 0;

    if (this.isMiner() && this.cfg.outputRate && this.resourceType) {
      if (remainingPatchAmount > 0) {
        this.mineAccum += dt * this.cfg.outputRate * this.drillEffBonus;
        if (this.mineAccum >= 1) {
          const amount = Math.min(Math.floor(this.mineAccum), remainingPatchAmount);
          resources.add(this.resourceType as 'iron' | 'copper' | 'coal' | 'crystal', amount);
          this.mineAccum -= amount;
          extracted = amount;
        }
      }
    }

    if (this.isPowerSource() && this.cfg.powerOutput) {
      this.powerAccum += dt;
      if (this.powerAccum >= 1) {
        this.powerAccum -= 1;
        if (this.cfg.powerType === 'coal') {
          this.coalBurnAccum += 1;
          if (this.coalBurnAccum >= 1 && resources.canAfford({ coal: 1 })) {
            resources.spend({ coal: 1 });
            this.coalBurnAccum -= 1;
            resources.add('power', this.cfg.powerOutput);
          }
        } else {
          resources.add('power', this.cfg.powerOutput);
        }
      }
    }

    return extracted;
  }

  takeDamage(dmg: number): void {
    this.hp -= dmg;
    this.updateDamageVisual();
    this.updateHpBar();
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  private updateDamageVisual(): void {
    if (this.type !== 'wall' && this.type !== 'reinforcedWall') return;
    const ratio = this.hp / this.maxHp;
    if (ratio > 0.66) {
      // Healthy — original color with slight darkening
      this.sprite.setFillStyle(this.cfg.color);
    } else if (ratio > 0.33) {
      // Damaged — orange-brown tinge
      this.sprite.setFillStyle(0xaa5511);
    } else {
      // Critical — red/dark
      this.sprite.setFillStyle(0x881111);
    }
    // Also reduce alpha slightly
    this.sprite.setAlpha(0.6 + ratio * 0.4);
  }

  private updateHpBar(): void {
    if (!this.hpBar || !this.hpBarBg) return;
    const ratio = Math.max(0, this.hp / this.maxHp);
    const { x, y } = tileToWorld(this.gx, this.gy);
    this.hpBarBg.x = x;
    this.hpBarBg.y = y - 18;
    this.hpBar.x = x - 12;
    this.hpBar.y = y - 18;
    this.hpBar.width = 24 * ratio;
  }

  destroy(): void {
    if (this.sprite?.active) this.sprite.destroy();
    if (this.icon?.active) this.icon.destroy();
    if (this.hpBar?.active) this.hpBar.destroy();
    if (this.hpBarBg?.active) this.hpBarBg.destroy();
    this.alive = false;
  }
}
