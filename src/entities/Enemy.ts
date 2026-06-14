import Phaser from 'phaser';
import { EnemyDef } from '../data/enemies';
import { tileToWorld, TILE_SIZE, worldToTile } from '../constants';

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

  // Wall-smashing callbacks (set by GameScene)
  checkBlocked?: (gx: number, gy: number) => boolean;
  onAttackBuilding?: (gx: number, gy: number, damage: number) => void;

  private wallAttackTimer = 0;
  private readonly WALL_ATTACK_INTERVAL = 0.8;
  private readonly WALL_ATTACK_DAMAGE = 25;
  private noValidPath = false;

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
    this.noValidPath = path.length === 0;
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

    // Core tile grid position (must match CORE_POS in mapData)
    const CORE_GX = 15, CORE_GY = 14;

    // No path at all — smash the nearest blocked tile toward the core
    if (this.path.length === 0) {
      if (this.noValidPath && this.onAttackBuilding && this.checkBlocked) {
        this.wallAttackTimer -= dt;
        if (this.wallAttackTimer <= 0) {
          this.wallAttackTimer = this.WALL_ATTACK_INTERVAL;
          const { gx, gy } = worldToTile(this.sprite.x, this.sprite.y);
          // Pick the cardinal neighbor closest to the core that is blocked
          const neighbors: Array<[number, number]> = [
            [gx - 1, gy], [gx + 1, gy], [gx, gy - 1], [gx, gy + 1],
          ];
          let bestGx = -1, bestGy = -1, bestDist = Infinity;
          for (const [nx, ny] of neighbors) {
            if (this.checkBlocked(nx, ny)) {
              const d = Math.abs(nx - CORE_GX) + Math.abs(ny - CORE_GY);
              if (d < bestDist) { bestDist = d; bestGx = nx; bestGy = ny; }
            }
          }
          if (bestGx >= 0) {
            this.onAttackBuilding(bestGx, bestGy, this.WALL_ATTACK_DAMAGE);
          }
        }
      }
      this.updateHpBar();
      return;
    }

    // Check if the next tile in the path is now blocked (wall placed after pathfinding)
    const next = this.path[0];
    const { gx: nextGx, gy: nextGy } = worldToTile(next.x, next.y);
    if (this.checkBlocked?.(nextGx, nextGy)) {
      // Smash that wall tile instead of moving
      this.wallAttackTimer -= dt;
      if (this.wallAttackTimer <= 0) {
        this.wallAttackTimer = this.WALL_ATTACK_INTERVAL;
        this.onAttackBuilding?.(nextGx, nextGy, this.WALL_ATTACK_DAMAGE);
      }
      this.updateHpBar();
      return;
    }

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
