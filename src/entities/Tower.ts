import Phaser from 'phaser';
import { TowerDef } from '../data/towers';
import { TILE_SIZE, tileToWorld } from '../constants';
import { Projectile } from './Projectile';
import { Enemy } from './Enemy';
import { ResourceManager } from '../ResourceManager';

export class Tower {
  sprite: Phaser.GameObjects.Rectangle;
  rangeCircle: Phaser.GameObjects.Arc;
  barrelSprite: Phaser.GameObjects.Rectangle;

  readonly gx: number;
  readonly gy: number;
  readonly def: TowerDef;

  private fireCooldown = 0;
  range: number;
  private scene: Phaser.Scene;
  private resources: ResourceManager;
  private rangeBonus = 0;

  // ── Research upgrade modifiers ──────────────────────────────────────────────
  extraSplash = 0;      // Explosive Shells adds splash radius (tiles)
  powerCostMult = 1;    // Power Grid reduces power cost per shot

  constructor(
    scene: Phaser.Scene,
    gx: number, gy: number,
    def: TowerDef,
    resources: ResourceManager,
  ) {
    this.scene = scene;
    this.gx = gx;
    this.gy = gy;
    this.def = def;
    this.resources = resources;
    this.range = def.range;

    const { x, y } = tileToWorld(gx, gy);

    this.sprite = scene.add.rectangle(x, y, TILE_SIZE - 2, TILE_SIZE - 2, def.color);
    this.sprite.setDepth(2);

    this.barrelSprite = scene.add.rectangle(x, y - TILE_SIZE * 0.3, 4, TILE_SIZE * 0.5, 0xffffff);
    this.barrelSprite.setDepth(2);
    this.barrelSprite.setOrigin(0.5, 1);

    this.rangeCircle = scene.add.circle(x, y, this.range * TILE_SIZE, 0xffffff, 0.05);
    this.rangeCircle.setStrokeStyle(1, 0xffffff, 0.3);
    this.rangeCircle.setDepth(1);
    this.rangeCircle.setVisible(false);
  }

  showRange(visible: boolean): void {
    this.rangeCircle.setVisible(visible);
  }

  addRangeBonus(bonus: number): void {
    this.rangeBonus += bonus;
    this.range = this.def.range + this.rangeBonus;
    const { x, y } = tileToWorld(this.gx, this.gy);
    this.rangeCircle.setRadius(this.range * TILE_SIZE);
    this.rangeCircle.x = x;
    this.rangeCircle.y = y;
  }

  update(dt: number, enemies: Enemy[], projectiles: Projectile[]): void {
    this.fireCooldown -= dt;
    if (this.fireCooldown > 0) return;

    const target = this.findTarget(enemies);
    if (!target) return;

    if (!this.canFire()) return;

    this.consumeResources();
    this.fireCooldown = 1 / this.def.fireRate;

    const { x, y } = tileToWorld(this.gx, this.gy);

    // Rotate barrel toward target
    const angle = Math.atan2(target.y - y, target.x - x) + Math.PI / 2;
    this.barrelSprite.setRotation(angle);

    if (this.def.chain) {
      // Tesla: arc to multiple targets
      const targets = this.findChainTargets(enemies, this.def.chain);
      for (const t of targets) {
        projectiles.push(new Projectile({
          scene: this.scene,
          x, y,
          color: this.def.projectileColor,
          size: this.def.projectileSize,
          speed: 500,
          damage: this.def.damage,
          piercesArmor: this.def.piercesArmor,
          dot: this.def.dot,
        }, t));
      }
    } else {
      const splash = (this.def.splash ?? 0) + this.extraSplash;
      projectiles.push(new Projectile({
        scene: this.scene,
        x, y,
        color: this.def.projectileColor,
        size: this.def.projectileSize,
        speed: 320,
        damage: this.def.damage,
        splashRadius: splash > 0 ? splash : undefined,
        piercesArmor: this.def.piercesArmor,
        dot: this.def.dot ?? undefined,
      }, target));
    }
  }

  private findTarget(enemies: Enemy[]): Enemy | null {
    const { x, y } = tileToWorld(this.gx, this.gy);
    const rangePx = this.range * TILE_SIZE;
    let best: Enemy | null = null;
    let bestDist = Infinity;

    for (const e of enemies) {
      if (!e.alive) continue;
      if (e.def.flying && !this.canTargetFlying()) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d <= rangePx && d < bestDist) {
        best = e;
        bestDist = d;
      }
    }
    return best;
  }

  private findChainTargets(enemies: Enemy[], count: number): Enemy[] {
    const { x, y } = tileToWorld(this.gx, this.gy);
    const rangePx = this.range * TILE_SIZE;
    return enemies
      .filter(e => e.alive && Math.hypot(e.x - x, e.y - y) <= rangePx)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
      .slice(0, count);
  }

  private canTargetFlying(): boolean {
    // All towers can target flying enemies
    return true;
  }

  private powerCost(): number {
    return Math.max(1, Math.ceil((this.def.powerPerShot ?? 1) * this.powerCostMult));
  }

  private canFire(): boolean {
    if (this.def.ammoType) {
      const amt = this.def.ammoPerShot ?? 1;
      if (!this.resources.canAfford({ [this.def.ammoType]: amt })) return false;
    }
    if (this.def.usePower) {
      if (this.resources.get('power') < this.powerCost()) return false;
    }
    return true;
  }

  private consumeResources(): void {
    if (this.def.ammoType) {
      this.resources.spend({ [this.def.ammoType]: this.def.ammoPerShot ?? 1 });
    }
    if (this.def.usePower) {
      this.resources.spend({ power: this.powerCost() });
    }
  }

  destroy(): void {
    if (this.sprite?.active) this.sprite.destroy();
    if (this.barrelSprite?.active) this.barrelSprite.destroy();
    if (this.rangeCircle?.active) this.rangeCircle.destroy();
  }
}
