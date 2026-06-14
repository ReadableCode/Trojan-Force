import Phaser from 'phaser';
import { CANVAS_W, GRID_OFFSET_Y, CORE_HP } from '../constants';
import { EventBus } from '../EventBus';
import { Inventory } from '../ResourceManager';

export class UIScene extends Phaser.Scene {
  // HUD elements
  private resTexts: Record<string, Phaser.GameObjects.Text> = {};
  private waveText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private coreHpText!: Phaser.GameObjects.Text;

  // Tooltip
  private tooltipBg!: Phaser.GameObjects.Rectangle;
  private tooltipText!: Phaser.GameObjects.Text;

  // Overlay (game over / victory)
  private overlayBg!: Phaser.GameObjects.Rectangle;
  private overlayTitle!: Phaser.GameObjects.Text;
  private overlayBody!: Phaser.GameObjects.Text;
  private overlayBtn!: Phaser.GameObjects.Rectangle;
  private overlayBtnText!: Phaser.GameObjects.Text;

  // Error flash
  private errorText!: Phaser.GameObjects.Text;

  // Announce
  private announceText!: Phaser.GameObjects.Text;

  private coreHp = CORE_HP;

  constructor() { super({ key: 'UI' }); }

  create(): void {
    this.createHUD();
    this.createTooltip();
    this.createOverlay();
    this.createAnnounce();
    this.bindEvents();
  }

  private createHUD(): void {
    // HUD background
    this.add.rectangle(CANVAS_W / 2, GRID_OFFSET_Y / 2, CANVAS_W, GRID_OFFSET_Y, 0x080818);
    this.add.rectangle(CANVAS_W / 2, GRID_OFFSET_Y - 1, CANVAS_W, 2, 0x223355);

    // Resource labels
    const resources: Array<{ key: string; label: string; color: string; x: number }> = [
      { key: 'iron',    label: 'IRON',    color: '#aaaaaa', x: 30  },
      { key: 'copper',  label: 'COPPER',  color: '#cc8833', x: 170 },
      { key: 'coal',    label: 'COAL',    color: '#777777', x: 310 },
      { key: 'crystal', label: 'CRYSTAL', color: '#44cccc', x: 450 },
      { key: 'power',   label: 'POWER',   color: '#88ccff', x: 590 },
    ];

    for (const r of resources) {
      this.add.text(r.x, 10, r.label, {
        fontSize: '10px', fontFamily: 'monospace', color: r.color,
      });
      this.resTexts[r.key] = this.add.text(r.x, 26, '0', {
        fontSize: '18px', fontFamily: 'monospace', color: r.color, fontStyle: 'bold',
      });
    }

    // Wave info
    this.waveText = this.add.text(CANVAS_W - 180, 8, 'Wave 0/20', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ccddff',
    });
    this.timerText = this.add.text(CANVAS_W - 180, 28, 'BUILD  45s', {
      fontSize: '14px', fontFamily: 'monospace', color: '#44ff88',
    });
    this.phaseText = this.add.text(CANVAS_W - 60, 8, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(1, 0);

    // Core HP
    this.coreHpText = this.add.text(CANVAS_W / 2, 8, `CORE  ${CORE_HP}/${CORE_HP}`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffdd44', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Error text
    this.errorText = this.add.text(CANVAS_W / 2, GRID_OFFSET_Y + 30, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff4444',
    }).setOrigin(0.5, 0).setDepth(20).setAlpha(0);
  }

  private createTooltip(): void {
    this.tooltipBg = this.add.rectangle(0, 0, 180, 60, 0x0a0a20, 0.92)
      .setDepth(30).setVisible(false);
    this.tooltipBg.setStrokeStyle(1, 0x334477);
    this.tooltipText = this.add.text(0, 0, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ccddff', wordWrap: { width: 170 },
    }).setDepth(31).setVisible(false).setOrigin(0.5, 0.5);
  }

  private createOverlay(): void {
    this.overlayBg = this.add.rectangle(CANVAS_W / 2, 350, CANVAS_W, 820, 0x000000, 0)
      .setDepth(50).setVisible(false);
    this.overlayTitle = this.add.text(CANVAS_W / 2, 280, '', {
      fontSize: '48px', fontFamily: 'monospace', color: '#ffdd00',
      stroke: '#885500', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(51).setVisible(false);
    this.overlayBody = this.add.text(CANVAS_W / 2, 360, '', {
      fontSize: '20px', fontFamily: 'monospace', color: '#ccddff', align: 'center',
    }).setOrigin(0.5).setDepth(51).setVisible(false);
    this.overlayBtn = this.add.rectangle(CANVAS_W / 2, 460, 220, 50, 0x224422)
      .setDepth(51).setVisible(false).setStrokeStyle(2, 0x44ff44)
      .setInteractive({ useHandCursor: true });
    this.overlayBtnText = this.add.text(CANVAS_W / 2, 460, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'monospace', color: '#44ff44',
    }).setOrigin(0.5).setDepth(52).setVisible(false);

    this.overlayBtn.on('pointerover', () => this.overlayBtn.fillColor = 0x336633);
    this.overlayBtn.on('pointerout',  () => this.overlayBtn.fillColor = 0x224422);
    this.overlayBtn.on('pointerdown', () => {
      this.scene.stop('UI');
      this.scene.stop('Game');
      this.scene.start('Menu');
    });
  }

  private createAnnounce(): void {
    this.announceText = this.add.text(CANVAS_W / 2, 120, '', {
      fontSize: '28px', fontFamily: 'monospace', color: '#ffdd00',
      stroke: '#553300', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
  }

  private bindEvents(): void {
    EventBus.on('resources-changed', (inv: unknown) => {
      const i = inv as Inventory;
      this.resTexts['iron'].setText(String(Math.floor(i.iron)));
      this.resTexts['copper'].setText(String(Math.floor(i.copper)));
      this.resTexts['coal'].setText(String(Math.floor(i.coal)));
      this.resTexts['crystal'].setText(String(Math.floor(i.crystal)));
      this.resTexts['power'].setText(`${Math.floor(i.power)}/${i.maxPower}`);
    });

    EventBus.on('phase-changed', (phase: unknown, wave: unknown, total: unknown, timer: unknown) => {
      const p = phase as string, w = wave as number, t = total as number, s = timer as number;
      this.waveText.setText(`Wave ${w}/${t}`);
      if (p === 'build') {
        this.timerText.setColor('#44ff88').setText(`BUILD  ${s}s`);
        this.announce(`Build Phase — ${s}s`);
      } else {
        this.timerText.setColor('#ff8844').setText(`WAVE ${w} ▶`);
        this.announce(`Wave ${w} incoming!`);
      }
    });

    EventBus.on('build-timer', (secs: unknown) => {
      const s = secs as number;
      const color = s > 10 ? '#44ff88' : s > 5 ? '#ffcc00' : '#ff4444';
      this.timerText.setColor(color).setText(`BUILD  ${s}s`);
    });

    EventBus.on('wave-started', (wave: unknown, edge: unknown) => {
      const edgeStr = (edge as string).toUpperCase();
      this.announce(`Wave ${wave} — Enemies from ${edgeStr}!`);
    });

    EventBus.on('core-hit', (hp: unknown, maxHp: unknown) => {
      this.coreHp = hp as number;
      const cur = Math.max(0, this.coreHp);
      const max = maxHp as number;
      const color = cur > max * 0.5 ? '#ffdd44' : cur > max * 0.25 ? '#ff8800' : '#ff2222';
      this.coreHpText.setColor(color).setText(`CORE  ${cur}/${max}`);
    });

    EventBus.on('show-tooltip', (tool: unknown) => {
      const t = tool as { label: string; cost: Record<string, number>; key: string };
      const costStr = Object.entries(t.cost).map(([k, v]) => `${v} ${k}`).join(', ') || 'Free';
      this.tooltipText.setText(`${t.label}\nCost: ${costStr}`);
      this.tooltipBg.setSize(190, 55);
      this.tooltipBg.setVisible(true);
      this.tooltipText.setVisible(true);
      this.input.on('pointermove', this.moveTooltip, this);
    });

    EventBus.on('hide-tooltip', () => {
      this.tooltipBg.setVisible(false);
      this.tooltipText.setVisible(false);
      this.input.off('pointermove', this.moveTooltip, this);
    });

    EventBus.on('show-error', (msg: unknown) => {
      this.errorText.setText(msg as string).setAlpha(1);
      this.tweens.add({
        targets: this.errorText, alpha: 0, duration: 1500, delay: 500,
      });
    });

    EventBus.on('game-over', (wave: unknown, score: unknown) => {
      this.showOverlay('GAME OVER', `Survived ${wave} waves\nScore: ${score}`, false);
    });

    EventBus.on('victory', (wave: unknown, score: unknown) => {
      this.showOverlay('VICTORY!', `All ${wave} waves defeated!\nScore: ${score}`, true);
    });
  }

  private moveTooltip(ptr: Phaser.Input.Pointer): void {
    const tx = Math.min(ptr.x + 100, CANVAS_W - 100);
    const ty = ptr.y - 40;
    this.tooltipBg.x = tx;
    this.tooltipBg.y = ty;
    this.tooltipText.x = tx;
    this.tooltipText.y = ty;
  }

  private announce(msg: string): void {
    this.announceText.setText(msg).setAlpha(1);
    this.tweens.add({
      targets: this.announceText, alpha: 0, duration: 800, delay: 1200,
    });
  }

  private showOverlay(title: string, body: string, victory: boolean): void {
    this.overlayBg.setAlpha(0.75).setVisible(true);
    this.overlayTitle.setText(title)
      .setColor(victory ? '#ffdd00' : '#ff4444')
      .setVisible(true);
    this.overlayBody.setText(body).setVisible(true);
    this.overlayBtn.setVisible(true);
    this.overlayBtnText.setVisible(true);
  }
}
