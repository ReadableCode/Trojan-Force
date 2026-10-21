import Phaser from 'phaser';
import { CANVAS_W, GRID_OFFSET_Y, CORE_HP } from '../constants';
import { EventBus } from '../EventBus';
import { Inventory } from '../ResourceManager';

const MONO = 'monospace';

export class UIScene extends Phaser.Scene {
  private resTexts: Record<string, Phaser.GameObjects.Text> = {};
  private waveText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private coreHpText!: Phaser.GameObjects.Text;
  private tooltipBg!: Phaser.GameObjects.Rectangle;
  private tooltipText!: Phaser.GameObjects.Text;
  private overlayBg!: Phaser.GameObjects.Rectangle;
  private overlayTitle!: Phaser.GameObjects.Text;
  private overlayBody!: Phaser.GameObjects.Text;
  private overlayBtn!: Phaser.GameObjects.Rectangle;
  private overlayBtnText!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private announceText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'UI' }); }

  create(): void {
    this.createHUD();
    this.createTooltip();
    this.createOverlay();
    this.createAnnounce();
    this.bindEvents();
  }

  private createHUD(): void {
    // Background panel
    this.add.rectangle(CANVAS_W / 2, GRID_OFFSET_Y / 2, CANVAS_W, GRID_OFFSET_Y, 0x060610);
    this.add.rectangle(CANVAS_W / 2, GRID_OFFSET_Y - 1, CANVAS_W, 2, 0x2244aa);

    // Game name badge (top-left)
    this.add.text(10, 6, 'TROJAN FORCE', {
      fontSize: '16px', fontFamily: MONO, color: '#ffbb00', fontStyle: 'bold',
    });

    // Core HP (left column, under the game name)
    this.add.text(10, 36, '❤ CORE', {
      fontSize: '17px', fontFamily: MONO, color: '#ffee55',
    });
    this.coreHpText = this.add.text(10, 60, `${CORE_HP}/${CORE_HP}`, {
      fontSize: '32px', fontFamily: MONO, color: '#ffee55', fontStyle: 'bold',
      stroke: '#553300', strokeThickness: 3,
    });

    // Resources — one column each:  LABEL over VALUE
    const RES: Array<{ key: string; label: string; color: string; x: number }> = [
      { key: 'iron',    label: '⬜ IRON',    color: '#bbbbbb', x: 175 },
      { key: 'copper',  label: '🟠 COPPER',  color: '#dd8833', x: 300 },
      { key: 'coal',    label: '⬛ COAL',    color: '#999999', x: 425 },
      { key: 'crystal', label: '🔷 CRYSTAL', color: '#33cccc', x: 550 },
      { key: 'power',   label: '⚡ POWER',   color: '#88bbff', x: 675 },
    ];

    for (const r of RES) {
      this.add.text(r.x, 8, r.label, {
        fontSize: '17px', fontFamily: MONO, color: r.color,
      });
      this.resTexts[r.key] = this.add.text(r.x, 48, '0', {
        fontSize: '38px', fontFamily: MONO, color: r.color, fontStyle: 'bold',
      });
    }

    // Wave + timer (right side, stacked)
    this.waveText = this.add.text(CANVAS_W - 12, 8, 'Wave 0 / 20', {
      fontSize: '20px', fontFamily: MONO, color: '#aaccff',
    }).setOrigin(1, 0);

    this.timerText = this.add.text(CANVAS_W - 12, 32, 'BUILD  45s', {
      fontSize: '34px', fontFamily: MONO, color: '#44ff88', fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.timerText.setStroke('#002200', 3);

    // Error flash (below HUD)
    this.errorText = this.add.text(CANVAS_W / 2, GRID_OFFSET_Y + 36, '', {
      fontSize: '24px', fontFamily: MONO, color: '#ff4444',
      stroke: '#220000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(20).setAlpha(0);
  }

  private createTooltip(): void {
    this.tooltipBg = this.add.rectangle(0, 0, 280, 80, 0x080820, 0.95)
      .setDepth(30).setVisible(false);
    this.tooltipBg.setStrokeStyle(2, 0x3355aa);
    this.tooltipText = this.add.text(0, 0, '', {
      fontSize: '18px', fontFamily: MONO, color: '#ccdeff',
      wordWrap: { width: 290 }, lineSpacing: 4,
    }).setDepth(31).setVisible(false).setOrigin(0.5, 0.5);
  }

  private createOverlay(): void {
    this.overlayBg = this.add.rectangle(CANVAS_W / 2, 385, CANVAS_W, 770, 0x000000, 0)
      .setDepth(50).setVisible(false);
    this.overlayTitle = this.add.text(CANVAS_W / 2, 240, '', {
      fontSize: '72px', fontFamily: MONO, color: '#ffdd00',
      stroke: '#885500', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(51).setVisible(false);
    this.overlayBody = this.add.text(CANVAS_W / 2, 330, '', {
      fontSize: '28px', fontFamily: MONO, color: '#ccddff', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setDepth(51).setVisible(false);
    this.overlayBtn = this.add.rectangle(CANVAS_W / 2, 440, 260, 60, 0x224422)
      .setDepth(51).setVisible(false).setStrokeStyle(2, 0x44ff44)
      .setInteractive({ useHandCursor: true });
    this.overlayBtnText = this.add.text(CANVAS_W / 2, 440, 'PLAY AGAIN', {
      fontSize: '30px', fontFamily: MONO, color: '#44ff44',
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
    this.announceText = this.add.text(CANVAS_W / 2, 140, '', {
      fontSize: '40px', fontFamily: MONO, color: '#ffdd00',
      stroke: '#553300', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
  }

  // EventBus outlives the scene, so drop this scene's handlers when it shuts
  // down; otherwise Play Again leaves stale handlers writing to destroyed text.
  private listen(event: string, handler: (...args: unknown[]) => void): void {
    EventBus.on(event, handler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.off(event, handler));
  }

  private bindEvents(): void {
    this.listen('resources-changed', (inv: unknown) => {
      const i = inv as Inventory;
      this.resTexts['iron'].setText(String(Math.floor(i.iron)));
      this.resTexts['copper'].setText(String(Math.floor(i.copper)));
      this.resTexts['coal'].setText(String(Math.floor(i.coal)));
      this.resTexts['crystal'].setText(String(Math.floor(i.crystal)));
      this.resTexts['power'].setText(`${Math.floor(i.power)}/${i.maxPower}`);
    });

    this.listen('phase-changed', (phase: unknown, wave: unknown, total: unknown, timer: unknown) => {
      const p = phase as string, w = wave as number, t = total as number, s = timer as number;
      this.waveText.setText(`Wave ${w} / ${t}`);
      if (p === 'build') {
        this.timerText.setColor('#44ff88').setText(`BUILD  ${s}s`);
      } else {
        this.timerText.setColor('#ff8844').setText(`WAVE ${w}  ▶`);
        this.announce(`⚔ Wave ${w} incoming!`);
      }
    });

    this.listen('build-timer', (secs: unknown) => {
      const s = secs as number;
      const color = s > 15 ? '#44ff88' : s > 7 ? '#ffcc00' : '#ff4444';
      this.timerText.setColor(color).setText(`BUILD  ${s}s`);
    });

    this.listen('wave-started', (wave: unknown, edge: unknown) => {
      const e = (edge as string).toUpperCase();
      this.announce(`⚔ Wave ${wave} — from ${e}!`);
    });

    this.listen('core-hit', (hp: unknown, maxHp: unknown) => {
      const cur = Math.max(0, hp as number);
      const max = maxHp as number;
      const ratio = cur / max;
      const color = ratio > 0.5 ? '#ffee55' : ratio > 0.25 ? '#ff8800' : '#ff2222';
      this.coreHpText.setColor(color).setText(`${cur}/${max}`);
    });

    this.listen('show-tooltip', (tool: unknown) => {
      const t = tool as { label: string; cost: Record<string, number>; description?: string };
      const costStr = Object.entries(t.cost).map(([k, v]) => `${v} ${k}`).join('  ') || 'Free';
      const lines = [t.label, `Cost: ${costStr}`];
      if (t.description) lines.push('', t.description);
      this.tooltipText.setText(lines.join('\n'));
      const h = this.tooltipText.height + 24;
      this.tooltipBg.setSize(300, Math.max(80, h));
      this.tooltipBg.setVisible(true);
      this.tooltipText.setVisible(true);
      this.input.on('pointermove', this.moveTooltip, this);
    });

    this.listen('hide-tooltip', () => {
      this.tooltipBg.setVisible(false);
      this.tooltipText.setVisible(false);
      this.input.off('pointermove', this.moveTooltip, this);
    });

    this.listen('show-error', (msg: unknown) => {
      this.errorText.setText(msg as string).setAlpha(1);
      this.tweens.add({ targets: this.errorText, alpha: 0, duration: 1500, delay: 500 });
    });

    this.listen('game-over', (wave: unknown, score: unknown) => {
      this.showOverlay('GAME OVER', `Survived ${wave} waves\nScore: ${score}`, false);
    });

    this.listen('victory', (wave: unknown, score: unknown) => {
      this.showOverlay('VICTORY!', `All ${wave} waves defeated!\nScore: ${score}`, true);
    });
  }

  private moveTooltip(ptr: Phaser.Input.Pointer): void {
    const tx = Math.min(ptr.x + 115, CANVAS_W - 115);
    const ty = Math.max(ptr.y - 50, 50);
    this.tooltipBg.x = tx;
    this.tooltipBg.y = ty;
    this.tooltipText.x = tx;
    this.tooltipText.y = ty;
  }

  private announce(msg: string): void {
    this.announceText.setText(msg).setAlpha(1);
    this.tweens.add({ targets: this.announceText, alpha: 0, duration: 900, delay: 1400 });
  }

  private showOverlay(title: string, body: string, victory: boolean): void {
    this.overlayBg.setAlpha(0.82).setVisible(true);
    this.overlayTitle.setText(title)
      .setColor(victory ? '#ffdd00' : '#ff4444').setVisible(true);
    this.overlayBody.setText(body).setVisible(true);
    this.overlayBtn.setVisible(true);
    this.overlayBtnText.setVisible(true);
  }
}
