import Phaser from 'phaser';
import { CANVAS_W, CANVAS_H } from '../constants';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'Menu' }); }

  create(): void {
    const cx = CANVAS_W / 2;

    // Background
    this.add.rectangle(cx, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x0a0a1a);

    // Animated grid lines
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x1a2a3a, 0.5);
    for (let x = 0; x <= CANVAS_W; x += 32) {
      gfx.lineBetween(x, 0, x, CANVAS_H);
    }
    for (let y = 0; y <= CANVAS_H; y += 32) {
      gfx.lineBetween(0, y, CANVAS_W, y);
    }

    // Title
    this.add.text(cx, 180, 'TOWER DEFENSE', {
      fontSize: '52px',
      fontFamily: 'monospace',
      color: '#ffdd00',
      stroke: '#885500',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, 248, 'FACTORY FRONT', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#ff8800',
      stroke: '#442200',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, 310, 'Build ▶ Mine ▶ Defend ▶ Repeat', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#88aacc',
    }).setOrigin(0.5);

    // Resource info
    const infoLines = [
      '⬛ Iron    — build towers & walls',
      '🟠 Copper  — electric upgrades',
      '⬛ Coal    — fuel & flame towers',
      '🔷 Crystal — tier-3 buildings & research',
    ];
    infoLines.forEach((line, i) => {
      this.add.text(cx, 380 + i * 26, line, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#aabbcc',
      }).setOrigin(0.5);
    });

    // Start button
    const btn = this.add.rectangle(cx, 550, 240, 56, 0x224422);
    btn.setStrokeStyle(2, 0x44ff44);
    btn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(cx, 550, 'START GAME', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#44ff44',
    }).setOrigin(0.5);

    btn.on('pointerover', () => { btn.fillColor = 0x336633; });
    btn.on('pointerout',  () => { btn.fillColor = 0x224422; });
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start('Game');
        this.scene.launch('UI');
      });
    });

    // Pulse animation on button text
    this.tweens.add({
      targets: btnText,
      alpha: { from: 1, to: 0.5 },
      yoyo: true,
      duration: 800,
      repeat: -1,
    });

    // Controls hint
    this.add.text(cx, 640, 'Left-click to place  ·  Right-click to sell (50% refund)  ·  R to rotate conveyor', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#556688',
    }).setOrigin(0.5);

    this.add.text(cx, 665, 'Waves 1-20 · Defend the Core · Mine resources to build more', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#556688',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(400);
  }
}
