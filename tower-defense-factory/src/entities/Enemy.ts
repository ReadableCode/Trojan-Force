import Phaser from 'phaser';
import { EnemyDef } from '../data/enemies';
import { tileToWorld, TILE_SIZE } from '../constants';

export type EnemySpawnCallback = (type: string, x: number, y: number) => void;

export class Enemy {
  sprite: Phaser.GameObjects.Rectangle;
  hpBarBg: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;

  alive = true;
  hp: number;
  maxHp: number;
  speed: number;
  armor: number;
  damage: number;
  readonly def: EnemyDef;

  private path: Array<{ x: number; y: number }> = [];
  private dotTimers: Array<{ damage: number; remaining: number; interval: number; nextTick: number }> = [];
  onReachCore?: (damage: number) => void;
  onDie?: (enemy: Enemy) => void;
  onSpawnEnemy?: EnemySpawnCallback;

  // for Burrower: burrow under walls
  private burrowCooldown = 0;

  constructor(
    scene: Phaser.Scene,
    def: EnemyDef,
    startX: number,
    startY: number,
    hpScale = 1,
  ) {
    this.def = def;
    this.maxHp = Math.round(def.hp * hpScale);
    this.hp = this.maxHp;
    this.speed = def.speed;
    this.armor = def.armor;
    this.damage = def.damage;

    const s = (def.scale ?? 1) * TILE_SIZE * 0.75;
    this.sprite = scene.add.rectangle(startX, startY, s, s, def.color);
    this.sprite.setDepth(3);

    this.hpBarBg = scene.add.rectangle(startX, startY - 18, 24, 4, 0x330000);
    this.hpBarBg.setDepth(4);
    this.hpBar = scene.add.rectangle(startX, startY - 18, 24, 4, 0x00ff00);
    this.hpBar.setDepth(4);
    this.hpBar.setOrigin(0, 0.5);
  }

  setPath(path: Array<{ x: number; y: number }>): void {
    this.path = path.map(p => tileToWorld(p.x, p.y));
    if (this.path.length > 0) {
      this.path.shift(); // skip start tile
    }
  }

  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }

  update(dt: number): void {
    if (!this.alive) return;

    this.updateDots(dt);

    if (this.path.length === 0) return;

    const next = this.path[0];
    const dx = next.x - this.sprite.x;
    const dy = next.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = this.speed * dt;

    if (dist <= step + 1) {
      this.sprite.x = next.x;
      this.sprite.y = next.y;
      this.path.shift();
      if (this.path.length === 0) {
        this.onReachCore?.(this.damage);
        this.die(false);
      }
    } else {
      this.sprite.x += (dx / dist) * step;
      this.sprite.y += (dy / dist) * step;
    }

    this.updateHpBar();
  }

  takeDamage(dmg: number, opts?: { armor?: number; dot?: { damage: number; duration: number }; pierces?: boolean }): void {
    if (!this.alive) return;

    let actual = dmg;
    if (!opts?.pierces) {
      const reduction = this.armor / 100;
      actual = Math.max(1, Math.round(dmg * (1 - reduction)));
    }
    this.hp -= actual;

    if (opts?.dot) {
      this.addDot(opts.dot.damage, opts.dot.duration);
    }

    if (this.hp <= 0) {
      this.die(true);
    }
  }

  private addDot(dmg: number, duration: number): void {
    this.dotTimers.push({ damage: dmg, remaining: duration, interval: 0.5, nextTick: 0.5 });
  }

  private updateDots(dt: number): void {
    for (let i = this.dotTimers.length - 1; i >= 0; i--) {
      const d = this.dotTimers[i];
      d.remaining -= dt;
      d.nextTick -= dt;
      if (d.nextTick <= 0) {
        this.hp -= d.damage;
        d.nextTick = d.interval;
        if (this.hp <= 0 && this.alive) { this.die(true); return; }
      }
      if (d.remaining <= 0) this.dotTimers.splice(i, 1);
    }
  }

  private updateHpBar(): void {
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpBarBg.x = this.sprite.x;
    this.hpBarBg.y = this.sprite.y - 18;
    this.hpBar.x = this.sprite.x - 12;
    this.hpBar.y = this.sprite.y - 18;
    this.hpBar.width = 24 * ratio;
    this.hpBar.fillColor = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;
  }

  private die(killedByTower: boolean): void {
    if (!this.alive) return;
    this.alive = false;

    if (killedByTower && this.def.explodeOnDeath) {
      // Visual explosion handled by GameScene via callback
    }

    this.onDie?.(this);
    this.destroy();
  }

  destroy(): void {
    if (this.sprite?.active) this.sprite.destroy();
    if (this.hpBarBg?.active) this.hpBarBg.destroy();
    if (this.hpBar?.active) this.hpBar.destroy();
  }
}
