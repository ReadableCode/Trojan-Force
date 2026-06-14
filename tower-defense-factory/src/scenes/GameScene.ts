import Phaser from 'phaser';
import {
  TILE_SIZE, GRID_COLS, GRID_ROWS, GRID_OFFSET_X, GRID_OFFSET_Y,
  CANVAS_W, TOOLBAR_Y, CORE_HP, BUILD_PHASE_SECS,
  tileToWorld, worldToTile, isValidTile, tileKey,
} from '../constants';
import { EventBus } from '../EventBus';
import { ResourceManager } from '../ResourceManager';
import { Pathfinder } from '../Pathfinder';
import { Enemy } from '../entities/Enemy';
import { Tower } from '../entities/Tower';
import { Building, BuildingType } from '../entities/Building';
import { Projectile } from '../entities/Projectile';
import { ENEMY_DEFS } from '../data/enemies';
import { TOWER_DEFS, TowerDef } from '../data/towers';
import { WAVE_DEFS } from '../data/waves';
import { RESOURCE_PATCHES, ResourcePatch, CORE_POS } from '../data/mapData';

// ── Tool descriptor ───────────────────────────────────────────────────────────
interface ToolItem {
  key: string;
  label: string;
  texture: string;
  cost: Partial<Record<string, number>>;
  category: 'tower' | 'wall' | 'miner' | 'support' | 'delete';
}

const ALL_TOOLS: ToolItem[] = [
  // Towers
  ...Object.values(TOWER_DEFS).map(d => ({
    key: d.key, label: d.label, texture: d.key, cost: d.cost, category: 'tower' as const,
  })),
  // Miners
  { key: 'drill',     label: 'Drill',       texture: 'drill',     cost: { iron: 20 },            category: 'miner'   as const },
  { key: 'pumpDrill', label: 'Pump Drill',  texture: 'pumpDrill', cost: { iron: 10, copper: 10 }, category: 'miner'  as const },
  // Walls
  { key: 'wall',           label: 'Wall',     texture: 'wall',           cost: { iron: 5 },             category: 'wall' as const },
  { key: 'reinforcedWall', label: 'Rei. Wall',texture: 'reinforcedWall', cost: { iron: 5, copper: 5 },  category: 'wall' as const },
  // Support
  { key: 'conveyor',       label: 'Conveyor', texture: 'conveyor',       cost: { iron: 3 },             category: 'support' as const },
  { key: 'ammoCache',      label: 'Ammo Cache',texture: 'ammoCache',     cost: { iron: 10 },            category: 'support' as const },
  { key: 'coalPowerPlant', label: 'Power Plant',texture: 'coalPowerPlant',cost: { iron: 30, coal: 20 }, category: 'support' as const },
  { key: 'solarPanel',     label: 'Solar',    texture: 'solarPanel',     cost: { copper: 20, crystal: 10 }, category: 'support' as const },
  { key: 'researchLab',    label: 'Lab',      texture: 'researchLab',    cost: { iron: 40, crystal: 20 }, category: 'support' as const },
  // Delete
  { key: 'delete', label: 'Delete', texture: 'btn', cost: {}, category: 'delete' as const },
];

type GamePhase = 'build' | 'wave' | 'gameover';

// ── Resource patch runtime state ──────────────────────────────────────────────
interface PatchState {
  def: ResourcePatch;
  sprite: Phaser.GameObjects.Image;
  remaining: number;
  miner?: Building;
}

export class GameScene extends Phaser.Scene {
  // ── Systems ───────────────────────────────────────────────────────────────
  private resources!: ResourceManager;
  private pathfinder!: Pathfinder;

  // ── Grid state ────────────────────────────────────────────────────────────
  private gridGfx!: Phaser.GameObjects.Graphics;
  private highlightGfx!: Phaser.GameObjects.Graphics;
  private patches: PatchState[] = [];
  private patchMap = new Map<string, PatchState>(); // tileKey -> patch

  // ── Core ──────────────────────────────────────────────────────────────────
  private coreSprite!: Phaser.GameObjects.Image;
  private coreHpBar!: Phaser.GameObjects.Rectangle;
  private coreHpBarBg!: Phaser.GameObjects.Rectangle;
  private coreHp = CORE_HP;

  // ── Entities ──────────────────────────────────────────────────────────────
  private buildings = new Map<string, Building | Tower>();
  private towers: Tower[] = [];
  private miners: Building[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];

  // ── Wave / phase state ────────────────────────────────────────────────────
  private phase: GamePhase = 'build';
  private waveNumber = 0;
  private totalWaves = 20;
  private buildTimer = BUILD_PHASE_SECS;
  private spawnQueue: Array<{ type: string; timer: number }> = [];
  private waveComplete = false;
  private buildTimerEvent?: Phaser.Time.TimerEvent;

  // ── Research / upgrades ───────────────────────────────────────────────────
  private researchDone = new Set<string>();
  private drillEffMultiplier = 1;
  private turretRangeBonus = 0;
  private wallHpBonus = 0;

  // ── UI ────────────────────────────────────────────────────────────────────
  private selectedTool: ToolItem | null = null;
  private toolButtons: Array<{
    btn: Phaser.GameObjects.Image;
    icon: Phaser.GameObjects.Image;
    tool: ToolItem;
    costText: Phaser.GameObjects.Text;
  }> = [];
  private conveyorRotation = 0; // 0=right, 1=down, 2=left, 3=up

  // ── Score ─────────────────────────────────────────────────────────────────
  private resourcesSpent = 0;

  constructor() { super({ key: 'Game' }); }

  create(): void {
    this.resources = new ResourceManager();
    this.pathfinder = new Pathfinder();

    this.cameras.main.setBackgroundColor(0x111118);

    this.drawGrid();
    this.createCore();
    this.createPatches();
    this.createToolbar();
    this.setupInput();

    this.startBuildPhase();
    this.cameras.main.fadeIn(400);
  }

  // ── Grid drawing ─────────────────────────────────────────────────────────
  private drawGrid(): void {
    this.gridGfx = this.add.graphics();
    this.gridGfx.setDepth(0);

    // Ground fill
    this.gridGfx.fillStyle(0x1e2a1e);
    this.gridGfx.fillRect(GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS * TILE_SIZE, GRID_ROWS * TILE_SIZE);

    // Grid lines
    this.gridGfx.lineStyle(1, 0x2a3a2a, 0.8);
    for (let x = 0; x <= GRID_COLS; x++) {
      const px = GRID_OFFSET_X + x * TILE_SIZE;
      this.gridGfx.lineBetween(px, GRID_OFFSET_Y, px, GRID_OFFSET_Y + GRID_ROWS * TILE_SIZE);
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      const py = GRID_OFFSET_Y + y * TILE_SIZE;
      this.gridGfx.lineBetween(GRID_OFFSET_X, py, GRID_OFFSET_X + GRID_COLS * TILE_SIZE, py);
    }

    this.highlightGfx = this.add.graphics();
    this.highlightGfx.setDepth(10);
  }

  // ── Core ─────────────────────────────────────────────────────────────────
  private createCore(): void {
    const { x, y } = tileToWorld(CORE_POS.gx, CORE_POS.gy);
    this.coreSprite = this.add.image(x, y, 'core').setDepth(2);

    this.coreHpBarBg = this.add.rectangle(x, y + 20, 40, 5, 0x330000).setDepth(5);
    this.coreHpBar   = this.add.rectangle(x - 20, y + 20, 40, 5, 0x00ff88).setDepth(5);
    this.coreHpBar.setOrigin(0, 0.5);

    // Mark core tile as blocked for pathfinding (enemies target it but can't cross)
    this.pathfinder.setBlocked(CORE_POS.gx, CORE_POS.gy, false);
  }

  private updateCoreHpBar(): void {
    const ratio = Math.max(0, this.coreHp / CORE_HP);
    const { x, y } = tileToWorld(CORE_POS.gx, CORE_POS.gy);
    this.coreHpBar.x = x - 20;
    this.coreHpBar.y = y + 20;
    this.coreHpBar.width = 40 * ratio;
    this.coreHpBar.fillColor = ratio > 0.5 ? 0x00ff88 : ratio > 0.25 ? 0xffcc00 : 0xff2200;
  }

  // ── Resource patches ──────────────────────────────────────────────────────
  private createPatches(): void {
    for (const def of RESOURCE_PATCHES) {
      const { x, y } = tileToWorld(def.gx, def.gy);
      const sprite = this.add.image(x, y, `patch-${def.type}`).setDepth(1);
      const state: PatchState = { def, sprite, remaining: def.amount };
      this.patches.push(state);
      this.patchMap.set(tileKey(def.gx, def.gy), state);
    }
  }

  private getPatchAt(gx: number, gy: number): PatchState | undefined {
    return this.patchMap.get(tileKey(gx, gy));
  }

  // ── Toolbar ───────────────────────────────────────────────────────────────
  private createToolbar(): void {
    // Toolbar background (184px tall below the grid)
    this.add.rectangle(CANVAS_W / 2, TOOLBAR_Y + 92, CANVAS_W, 184, 0x0a0a18).setDepth(8);
    this.add.rectangle(CANVAS_W / 2, TOOLBAR_Y + 1, CANVAS_W, 2, 0x334477).setDepth(8);

    const btnW = 56, gap = 2;
    const row1Tools = ALL_TOOLS.slice(0, 9);  // towers + miners
    const row2Tools = ALL_TOOLS.slice(9);      // buildings + delete

    const makeRow = (tools: ToolItem[], rowY: number) => {
      const totalW = tools.length * (btnW + gap) - gap;
      const startX = (CANVAS_W - totalW) / 2;

      tools.forEach((tool, i) => {
        const bx = startX + i * (btnW + gap) + btnW / 2;
        const by = rowY;

        const btn = this.add.image(bx, by, 'btn').setDepth(9).setInteractive({ useHandCursor: true });
        const icon = this.add.image(bx, by - 6, tool.texture).setScale(0.75).setDepth(10);

        // Cost label
        const costStr = Object.entries(tool.cost)
          .map(([k, v]) => `${v}${k[0].toUpperCase()}`)
          .join(' ');
        const costText = this.add.text(bx, by + 18, costStr, {
          fontSize: '9px', fontFamily: 'monospace', color: '#aabbcc', align: 'center',
        }).setOrigin(0.5, 0.5).setDepth(10);

        // Tool label
        this.add.text(bx, by + 8, tool.label, {
          fontSize: '8px', fontFamily: 'monospace', color: '#8899aa', align: 'center',
        }).setOrigin(0.5, 0.5).setDepth(10);

        btn.on('pointerover', () => {
          if (this.selectedTool?.key !== tool.key) btn.setTexture('btn-hover');
          EventBus.emit('show-tooltip', tool);
        });
        btn.on('pointerout', () => {
          if (this.selectedTool?.key !== tool.key) btn.setTexture('btn');
          EventBus.emit('hide-tooltip');
        });
        btn.on('pointerdown', () => this.selectTool(tool));

        this.toolButtons.push({ btn, icon, tool, costText });
      });
    };

    makeRow(row1Tools, TOOLBAR_Y + 38);
    makeRow(row2Tools, TOOLBAR_Y + 102);

    // Label rows
    this.add.text(8, TOOLBAR_Y + 38, 'TOWERS / MINERS', {
      fontSize: '9px', fontFamily: 'monospace', color: '#445566',
    }).setOrigin(0, 0.5).setDepth(9);
    this.add.text(8, TOOLBAR_Y + 102, 'BUILDINGS', {
      fontSize: '9px', fontFamily: 'monospace', color: '#445566',
    }).setOrigin(0, 0.5).setDepth(9);
  }

  private selectTool(tool: ToolItem | null): void {
    this.selectedTool = tool;
    for (const { btn, tool: t } of this.toolButtons) {
      btn.setTexture(t.key === tool?.key ? 'btn-sel' : 'btn');
    }
    EventBus.emit('tool-selected', tool?.key ?? null);
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  private setupInput(): void {
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      this.updateHighlight(ptr.x, ptr.y);
    });

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.rightButtonDown()) {
        this.handleRightClick(ptr.x, ptr.y);
      } else {
        this.handleLeftClick(ptr.x, ptr.y);
      }
    });

    this.input.keyboard?.on('keydown-R', () => {
      this.conveyorRotation = (this.conveyorRotation + 1) % 4;
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.selectTool(null);
    });

    // Right-click context
    this.input.mouse?.disableContextMenu();
  }

  private updateHighlight(wx: number, wy: number): void {
    this.highlightGfx.clear();
    if (!this.selectedTool) return;

    const { gx, gy } = worldToTile(wx, wy);
    if (!isValidTile(gx, gy)) return;

    const valid = this.canPlace(gx, gy, this.selectedTool);
    this.highlightGfx.fillStyle(valid ? 0x44ff44 : 0xff4444, 0.25);
    this.highlightGfx.lineStyle(2, valid ? 0x44ff44 : 0xff4444, 0.8);

    const px = GRID_OFFSET_X + gx * TILE_SIZE;
    const py = GRID_OFFSET_Y + gy * TILE_SIZE;
    this.highlightGfx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    this.highlightGfx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
  }

  private handleLeftClick(wx: number, wy: number): void {
    // Ignore clicks in toolbar area
    if (wy >= TOOLBAR_Y) return;
    if (!this.selectedTool) return;

    const { gx, gy } = worldToTile(wx, wy);
    if (!isValidTile(gx, gy)) return;

    if (this.selectedTool.category === 'delete') {
      this.demolishAt(gx, gy);
      return;
    }

    if (!this.canPlace(gx, gy, this.selectedTool)) return;
    if (!this.resources.canAfford(this.selectedTool.cost)) {
      EventBus.emit('show-error', 'Not enough resources!');
      return;
    }

    this.resources.spend(this.selectedTool.cost);
    this.resourcesSpent += Object.values(this.selectedTool.cost).reduce((s: number, v) => s + (v ?? 0), 0);
    this.placeBuilding(gx, gy, this.selectedTool);
  }

  private handleRightClick(wx: number, wy: number): void {
    if (wy >= TOOLBAR_Y) return;
    const { gx, gy } = worldToTile(wx, wy);
    if (!isValidTile(gx, gy)) return;
    this.demolishAt(gx, gy);
  }

  // ── Placement logic ───────────────────────────────────────────────────────
  private canPlace(gx: number, gy: number, tool: ToolItem): boolean {
    if (tool.category === 'delete') return true;

    // Can't place on core
    if (gx === CORE_POS.gx && gy === CORE_POS.gy) return false;

    // Can't stack on existing building
    if (this.buildings.has(tileKey(gx, gy))) return false;

    // Miners must be on resource patches
    if (tool.category === 'miner') {
      return !!this.getPatchAt(gx, gy);
    }

    // Towers and walls can't be on resource patches (let miners go there)
    if (tool.category === 'tower' || tool.category === 'wall') {
      if (this.getPatchAt(gx, gy)) return false;
    }

    return true;
  }

  private placeBuilding(gx: number, gy: number, tool: ToolItem): void {
    if (tool.category === 'tower') {
      const def = TOWER_DEFS[tool.key] as TowerDef;
      const tower = new Tower(this, gx, gy, def, this.resources);
      if (this.turretRangeBonus > 0) tower.addRangeBonus(this.turretRangeBonus);
      this.buildings.set(tileKey(gx, gy), tower);
      this.towers.push(tower);
    } else {
      const btype = tool.key as BuildingType;
      const patch = this.getPatchAt(gx, gy);
      const resourceType = patch?.def.type ?? '';
      const bld = new Building(this, gx, gy, btype, resourceType);

      if (btype === 'wall' || btype === 'reinforcedWall') {
        bld.maxHp += this.wallHpBonus;
        bld.hp = bld.maxHp;
        this.pathfinder.setBlocked(gx, gy, true);
        this.reroute();
      }

      if (btype === 'drill' || btype === 'pumpDrill' || btype === 'deepMiner') {
        bld.drillEffBonus = this.drillEffMultiplier;
        this.miners.push(bld);
        if (patch) patch.miner = bld;
      }

      if (btype === 'coalPowerPlant') {
        this.resources.addPowerCapacity(50);
      }
      if (btype === 'solarPanel') {
        this.resources.addPowerCapacity(20);
      }

      this.buildings.set(tileKey(gx, gy), bld);
    }
  }

  private demolishAt(gx: number, gy: number): void {
    const k = tileKey(gx, gy);
    const entity = this.buildings.get(k);
    if (!entity) return;

    // Refund
    let cost: Partial<Record<string, number>> = {};
    if (entity instanceof Tower) {
      cost = entity.def.cost;
    } else {
      // Find cost from tool defs
      const tool = ALL_TOOLS.find(t => t.key === entity.type);
      if (tool) cost = tool.cost;
    }
    this.resources.refund(cost, 0.5);

    // Unblock path if wall
    if (entity instanceof Building &&
        (entity.type === 'wall' || entity.type === 'reinforcedWall')) {
      this.pathfinder.setBlocked(gx, gy, false);
      this.reroute();
    }

    // Remove from collections
    if (entity instanceof Tower) {
      this.towers = this.towers.filter(t => t !== entity);
    } else if (entity instanceof Building && entity.isMiner()) {
      this.miners = this.miners.filter(m => m !== entity);
      const patch = this.getPatchAt(gx, gy);
      if (patch) patch.miner = undefined;
    }

    entity.destroy();
    this.buildings.delete(k);
  }

  // ── Pathfinding ───────────────────────────────────────────────────────────
  private reroute(): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.def.flying || enemy.def.tunneling) continue;
      const { gx, gy } = worldToTile(enemy.x, enemy.y);
      const path = this.pathfinder.findPath(gx, gy, CORE_POS.gx, CORE_POS.gy);
      enemy.setPath(path);
    }
  }

  private buildPathFor(startGx: number, startGy: number, flying: boolean): Array<{ x: number; y: number }> {
    return this.pathfinder.findPath(startGx, startGy, CORE_POS.gx, CORE_POS.gy, flying);
  }

  // ── Wave / Phase management ───────────────────────────────────────────────
  private startBuildPhase(): void {
    this.phase = 'build';
    this.buildTimer = BUILD_PHASE_SECS;
    this.waveComplete = false;
    this.spawnQueue = [];

    this.buildTimerEvent?.remove(false);
    this.buildTimerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickBuildTimer,
      callbackScope: this,
      loop: true,
    });

    EventBus.emit('phase-changed', 'build', this.waveNumber, this.totalWaves, BUILD_PHASE_SECS);
  }

  private tickBuildTimer(): void {
    if (this.phase !== 'build') return;
    this.buildTimer--;
    EventBus.emit('build-timer', this.buildTimer);
    if (this.buildTimer <= 0) {
      this.startWave();
    }
  }

  private startWave(): void {
    this.buildTimerEvent?.remove(false);
    this.buildTimerEvent = undefined;
    this.waveNumber++;
    if (this.waveNumber > this.totalWaves) {
      this.triggerVictory();
      return;
    }

    this.phase = 'wave';
    this.waveComplete = false;
    EventBus.emit('phase-changed', 'wave', this.waveNumber, this.totalWaves, 0);

    const waveDef = WAVE_DEFS[this.waveNumber - 1];
    if (!waveDef) { this.triggerVictory(); return; }

    const hpScale = waveDef.hpScale ?? 1;

    // Build the spawn queue
    this.spawnQueue = [];
    for (const spawnDef of waveDef.spawns) {
      let t = spawnDef.delayOffsetSecs ?? 0;
      for (let i = 0; i < spawnDef.count; i++) {
        this.spawnQueue.push({ type: spawnDef.type, timer: t });
        t += spawnDef.intervalSecs;
      }
    }
    this.spawnQueue.sort((a, b) => a.timer - b.timer);

    // Store hpScale for use during spawning
    this._currentHpScale = hpScale;

    // Announce spawn edge
    const edge = this.getSpawnEdge();
    this._currentSpawnEdge = edge;
    EventBus.emit('wave-started', this.waveNumber, edge);
  }

  private _currentHpScale = 1;
  private _currentSpawnEdge: 'top' | 'left' | 'right' = 'top';

  private getSpawnEdge(): 'top' | 'left' | 'right' {
    const edges: Array<'top' | 'left' | 'right'> = ['top', 'left', 'right'];
    if (this.waveNumber <= 4) return 'top';
    if (this.waveNumber <= 9) return this.waveNumber % 2 === 0 ? 'left' : 'top';
    return edges[this.waveNumber % 3];
  }

  private getSpawnTile(edge: 'top' | 'left' | 'right'): { gx: number; gy: number } {
    switch (edge) {
      case 'top':   return { gx: Phaser.Math.Between(0, GRID_COLS - 1), gy: 0 };
      case 'left':  return { gx: 0, gy: Phaser.Math.Between(0, GRID_ROWS - 1) };
      case 'right': return { gx: GRID_COLS - 1, gy: Phaser.Math.Between(0, GRID_ROWS - 1) };
    }
  }

  private spawnEnemy(type: string, gx: number, gy: number): void {
    const def = ENEMY_DEFS[type];
    if (!def) return;

    const { x, y } = tileToWorld(gx, gy);
    const enemy = new Enemy(this, def, x, y, this._currentHpScale);

    const path = this.buildPathFor(gx, gy, (def.flying ?? false) || (def.tunneling ?? false));
    if (path.length === 0 && !def.flying && !def.tunneling) {
      // No path to core; spawn anyway but they'll idle
    }
    enemy.setPath(path);

    enemy.onReachCore = (dmg) => {
      this.coreHp -= dmg;
      this.updateCoreHpBar();
      EventBus.emit('core-hit', this.coreHp, CORE_HP);
      this.cameras.main.shake(120, 0.006);
      if (this.coreHp <= 0) this.triggerGameOver();
    };

    enemy.onDie = (e) => {
      this.enemies = this.enemies.filter(x => x !== e);
      // Award resources
      for (const [k, v] of Object.entries(e.def.reward)) {
        this.resources.add(k as 'iron' | 'copper' | 'coal' | 'crystal', v ?? 0);
      }
      // Spawn-on-death (SwarmQueen)
      if (e.def.spawnOnDeath) {
        for (let i = 0; i < e.def.spawnOnDeath.count; i++) {
          const angle = (i / e.def.spawnOnDeath.count) * Math.PI * 2;
          const { gx: ex, gy: ey } = worldToTile(e.x, e.y);
          this.spawnEnemy(e.def.spawnOnDeath.type, ex, ey);
        }
      }
      // Explosion damage (Burster)
      if (e.def.explodeOnDeath) {
        this.applyExplosion(e.x, e.y, 64, 30);
      }
      EventBus.emit('enemy-killed', this.enemies.length);
    };

    this.enemies.push(enemy);
  }

  private applyExplosion(wx: number, wy: number, radius: number, damage: number): void {
    // Damage nearby enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - wx, e.y - wy);
      if (d <= radius) e.takeDamage(damage);
    }
    // Damage nearby buildings
    const { gx, gy } = worldToTile(wx, wy);
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const bld = this.buildings.get(tileKey(gx + dx, gy + dy));
        if (bld instanceof Building) bld.takeDamage(damage / 2);
      }
    }
    // Flash effect
    this.cameras.main.flash(80, 255, 100, 0, true);

    // Explosion visual
    const circle = this.add.circle(wx, wy, radius, 0xff6600, 0.6).setDepth(6);
    this.tweens.add({
      targets: circle, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 300,
      onComplete: () => circle.destroy(),
    });
  }

  private checkWaveComplete(): void {
    if (!this.waveComplete) return;
    if (this.enemies.length === 0 && this.spawnQueue.length === 0) {
      if (this.waveNumber >= this.totalWaves) {
        this.triggerVictory();
      } else {
        this.startBuildPhase();
      }
    }
  }

  // ── Brute wall-attack ─────────────────────────────────────────────────────
  private bruteAttackWalls(): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.def.key !== 'brute') continue;
      const { gx, gy } = worldToTile(enemy.x, enemy.y);
      for (const [dk, dv] of [[-1,0],[1,0],[0,-1],[0,1]] as const) {
        const bld = this.buildings.get(tileKey(gx + dk, gy + dv));
        if (bld instanceof Building &&
            (bld.type === 'wall' || bld.type === 'reinforcedWall')) {
          bld.takeDamage(5);
          if (!bld.alive) {
            this.pathfinder.setBlocked(gx + dk, gy + dv, false);
            bld.destroy();
            this.buildings.delete(tileKey(gx + dk, gy + dv));
            this.reroute();
          }
        }
      }
    }
  }

  // ── Game over / victory ───────────────────────────────────────────────────
  private triggerGameOver(): void {
    if (this.phase === 'gameover') return;
    this.phase = 'gameover';
    this.cameras.main.shake(300, 0.02);
    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.time.delayedCall(1600, () => {
      EventBus.emit('game-over', this.waveNumber, this.calcScore());
    });
  }

  private triggerVictory(): void {
    if (this.phase === 'gameover') return;
    this.phase = 'gameover';
    this.cameras.main.flash(500, 255, 220, 0);
    this.time.delayedCall(1000, () => {
      EventBus.emit('victory', this.waveNumber, this.calcScore());
    });
  }

  private calcScore(): number {
    return this.waveNumber * 1000 + this.resourcesSpent * 10 + this.coreHp * 5;
  }

  // ── Main update loop ──────────────────────────────────────────────────────
  update(time: number, delta: number): void {
    if (this.phase === 'gameover') return;
    const dt = delta / 1000;

    // Update miners
    for (const miner of this.miners) {
      if (!miner.alive) continue;
      const patch = this.getPatchAt(miner.gx, miner.gy);
      if (patch) {
        const extracted = miner.update(dt, this.resources, patch.remaining);
        patch.remaining = Math.max(0, patch.remaining - extracted);
        if (patch.remaining === 0) {
          patch.sprite.setAlpha(0.3);
        }
      }
    }

    // Clean up dead buildings (collect keys first to avoid modifying while iterating)
    const deadKeys: string[] = [];
    for (const [k, bld] of this.buildings) {
      if (bld instanceof Building && !bld.alive) deadKeys.push(k);
    }
    for (const k of deadKeys) {
      const bld = this.buildings.get(k);
      if (!(bld instanceof Building)) continue;
      if (bld.type === 'wall' || bld.type === 'reinforcedWall') {
        this.pathfinder.setBlocked(bld.gx, bld.gy, false);
        this.reroute();
      }
      if (bld.isMiner()) this.miners = this.miners.filter(m => m !== bld);
      this.buildings.delete(k);
    }

    // Power plants update (included in Building.update called by miners loop — handle separately)
    for (const [, bld] of this.buildings) {
      if (bld instanceof Building && bld.isPowerSource()) {
        bld.update(dt, this.resources, 0);
      }
    }

    if (this.phase === 'wave') {
      // Advance spawn queue
      for (const sq of this.spawnQueue) {
        sq.timer -= dt;
      }
      while (this.spawnQueue.length > 0 && this.spawnQueue[0].timer <= 0) {
        const sq = this.spawnQueue.shift()!;
        const tile = this.getSpawnTile(this._currentSpawnEdge);
        this.spawnEnemy(sq.type, tile.gx, tile.gy);
      }

      if (this.spawnQueue.length === 0) this.waveComplete = true;

      // Update enemies
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        enemy.update(dt);
      }
      this.enemies = this.enemies.filter(e => e.alive);

      // Towers fire
      for (const tower of this.towers) {
        tower.update(dt, this.enemies, this.projectiles);
      }

      // Update projectiles
      for (const proj of this.projectiles) {
        if (!proj.alive) continue;
        proj.update(dt, this.enemies);
      }
      this.projectiles = this.projectiles.filter(p => p.alive);

      // Brutes attack walls periodically
      if (Math.floor(time / 500) !== Math.floor((time - delta) / 500)) {
        this.bruteAttackWalls();
      }

      this.checkWaveComplete();
    }
  }
}
