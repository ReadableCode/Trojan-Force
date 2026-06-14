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

    // Title — TROJAN FORCE
    this.add.text(cx, 110, 'TROJAN', {
      fontSize: '80px', fontFamily: MONO, color: '#ffcc00',
      stroke: '#885500', strokeThickness: 5, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 186, 'FORCE', {
      fontSize: '56px', fontFamily: MONO, color: '#ff7700',
      stroke: '#442200', strokeThickness: 4, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Tag line
    this.add.text(cx, 248, 'Build · Mine · Defend · Repeat', {
      fontSize: '22px', fontFamily: MONO, color: '#7799bb',
    }).setOrigin(0.5);

    // Resource legend — bigger and readable
    const legend: Array<[string, string]> = [
      ['⬜ IRON',    'Build towers, walls & conveyors'],
      ['🟠 COPPER',  'Electric upgrades & Cannon ammo'],
      ['⬛ COAL',    'Fuel for Flame Tower & Power Plants'],
      ['🔷 CRYSTAL', 'Tier-3 buildings & research'],
      ['⚡ POWER',   'Required by Tesla & Laser towers'],
    ];
    legend.forEach(([icon, desc], i) => {
      const y = 295 + i * 32;
      this.add.text(cx - 220, y, icon, {
        fontSize: '17px', fontFamily: MONO, color: '#ddeecc',
      }).setOrigin(0, 0.5);
      this.add.text(cx - 140, y, desc, {
        fontSize: '17px', fontFamily: MONO, color: '#889aaa',
      }).setOrigin(0, 0.5);
    });

    // START button
    const btn = this.add.rectangle(cx, 490, 280, 64, 0x1a3a1a)
      .setStrokeStyle(3, 0x44ff44).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(cx, 490, '▶  START GAME', {
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
    this.add.text(cx, 582, 'Left-click to place   ·   Right-click to sell (50% refund)', {
      fontSize: '16px', fontFamily: MONO, color: '#4a5e70',
    }).setOrigin(0.5);
    this.add.text(cx, 606, 'R = rotate conveyor   ·   ESC = deselect tool', {
      fontSize: '16px', fontFamily: MONO, color: '#4a5e70',
    }).setOrigin(0.5);
    this.add.text(cx, 638, 'Defend the Core across 20 waves to win', {
      fontSize: '17px', fontFamily: MONO, color: '#667788',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(400);
  }
}
