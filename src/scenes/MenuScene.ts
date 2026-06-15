import Phaser from 'phaser';
import { CANVAS_W, CANVAS_H } from '../constants';

const MONO = 'monospace';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'Menu' }); }

  create(): void {
    const cx = CANVAS_W / 2;

    this.add.rectangle(cx, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x060610);

    // Subtle grid pattern
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x0d1a2a, 0.7);
    for (let x = 0; x <= CANVAS_W; x += 32) gfx.lineBetween(x, 0, x, CANVAS_H);
    for (let y = 0; y <= CANVAS_H; y += 32) gfx.lineBetween(0, y, CANVAS_W, y);

    // Title — TROJAN FORCE  (generous vertical gaps so nothing overlaps)
    this.add.text(cx, 82, 'TROJAN', {
      fontSize: '72px', fontFamily: MONO, color: '#ffcc00',
      stroke: '#885500', strokeThickness: 5, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 170, 'FORCE', {
      fontSize: '56px', fontFamily: MONO, color: '#ff7700',
      stroke: '#442200', strokeThickness: 4, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Tag line
    this.add.text(cx, 234, 'Build · Mine · Defend · Repeat', {
      fontSize: '22px', fontFamily: MONO, color: '#7799bb',
    }).setOrigin(0.5);

    // Divider
    const gfx2 = this.add.graphics();
    gfx2.lineStyle(1, 0x334455, 1);
    gfx2.lineBetween(cx - 260, 258, cx + 260, 258);

    // Resource legend
    const legend: Array<[string, string]> = [
      ['IRON',    'Build towers, walls & drills'],
      ['COPPER',  'Electric towers & support buildings'],
      ['COAL',    'Flame Tower ammo & Power Plants'],
      ['CRYSTAL', 'Tier-3 towers & research'],
      ['POWER',   'Consumed per shot by Tesla & Laser'],
    ];
    const legendColors = ['#aaaaaa', '#cc6600', '#888888', '#00cccc', '#ffee44'];
    legend.forEach(([name, desc], i) => {
      const y = 276 + i * 30;
      this.add.text(cx - 220, y, name, {
        fontSize: '17px', fontFamily: MONO, color: legendColors[i], fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.add.text(cx - 130, y, desc, {
        fontSize: '16px', fontFamily: MONO, color: '#7a8a9a',
      }).setOrigin(0, 0.5);
    });

    // START button
    const btn = this.add.rectangle(cx, 460, 280, 62, 0x1a3a1a)
      .setStrokeStyle(3, 0x44ff44).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(cx, 460, '▶  START GAME', {
      fontSize: '26px', fontFamily: MONO, color: '#44ff44', fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.fillColor = 0x2a5a2a);
    btn.on('pointerout',  () => btn.fillColor = 0x1a3a1a);
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start('Game');
        this.scene.launch('UI');
      });
    });

    this.tweens.add({
      targets: btnTxt, alpha: { from: 1, to: 0.55 }, yoyo: true, duration: 900, repeat: -1,
    });

    // Controls
    this.add.text(cx, 544, 'Left-click to place   ·   Right-click to sell (50% refund)', {
      fontSize: '16px', fontFamily: MONO, color: '#4a5e70',
    }).setOrigin(0.5);
    this.add.text(cx, 568, 'R = rotate conveyor   ·   ESC = deselect tool', {
      fontSize: '16px', fontFamily: MONO, color: '#4a5e70',
    }).setOrigin(0.5);
    this.add.text(cx, 600, 'Defend the Core across 20 waves to win', {
      fontSize: '17px', fontFamily: MONO, color: '#667788',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(400);
  }
}
