import Phaser from 'phaser';

export interface ProjectileOptions {
  scene: Phaser.Scene;
  x: number; y: number;
  color: number;
  size: number;
  speed: number;
  damage: number;
  splashRadius?: number;
  dot?: { damage: number; duration: number };
  piercesArmor?: boolean;
}

export type ProjectileTarget = {
  x: number; y: number;
  alive: boolean;
  takeDamage: (dmg: number, opts?: { armor?: number; dot?: { damage: number; duration: number }; pierces?: boolean }) => void;
};

export class Projectile {
  sprite: Phaser.GameObjects.Arc;
  alive = true;
  private speed: number;
  private damage: number;
  private splash: number;
  private dot?: { damage: number; duration: number };
  private pierces?: boolean;
  target: ProjectileTarget | null;
  private fallbackX: number;
  private fallbackY: number;

  constructor(opts: ProjectileOptions, target: ProjectileTarget) {
    this.speed = opts.speed;
    this.damage = opts.damage;
    this.splash = opts.splashRadius ?? 0;
    this.dot = opts.dot;
    this.pierces = opts.piercesArmor;
    this.target = target;
    this.fallbackX = target.x;
    this.fallbackY = target.y;

    this.sprite = opts.scene.add.circle(opts.x, opts.y, opts.size, opts.color);
    this.sprite.setDepth(5);
  }

  update(dt: number, allEnemies: ProjectileTarget[]): void {
    if (!this.alive) return;

    const tx = this.target?.alive ? this.target.x : this.fallbackX;
    const ty = this.target?.alive ? this.target.y : this.fallbackY;

    const dx = tx - this.sprite.x;
    const dy = ty - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed * dt + 4) {
      this.explode(allEnemies);
      return;
    }

    this.sprite.x += (dx / dist) * this.speed * dt;
    this.sprite.y += (dy / dist) * this.speed * dt;
  }

  private explode(allEnemies: ProjectileTarget[]): void {
    this.alive = false;
    this.sprite.destroy();

    if (this.splash > 0) {
      const sr = this.splash * 32;
      for (const e of allEnemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - this.sprite.x, e.y - this.sprite.y);
        if (d <= sr) {
          e.takeDamage(this.damage, { dot: this.dot, pierces: this.pierces });
        }
      }
    } else if (this.target?.alive) {
      this.target.takeDamage(this.damage, { dot: this.dot, pierces: this.pierces });
    }
  }

  destroy(): void {
    this.alive = false;
    if (this.sprite?.active) this.sprite.destroy();
  }
}
