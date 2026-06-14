import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'Boot' }); }

  create(): void {
    this.generateTextures();
    this.scene.start('Menu');
  }

  private generateTextures(): void {
    const g = this.make.graphics({}, false);

    const mk = (key: string, fn: (g: Phaser.GameObjects.Graphics) => void, w = 32, h = 32) => {
      g.clear();
      fn(g);
      g.generateTexture(key, w, h);
    };

    // Ground tile
    mk('ground', g => {
      g.fillStyle(0x2a3d2a);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x253523, 0.6);
      g.fillRect(0, 0, 1, 32);
      g.fillRect(0, 0, 32, 1);
    });

    // Resource patches
    const patchColors: Record<string, number> = {
      iron: 0x888888, copper: 0xcc6600, coal: 0x282828, crystal: 0x00bbcc
    };
    for (const [type, color] of Object.entries(patchColors)) {
      mk(`patch-${type}`, g => {
        g.fillStyle(0x2a3d2a);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(color, 0.85);
        g.fillRoundedRect(4, 4, 24, 24, 4);
        g.fillStyle(0xffffff, 0.2);
        g.fillRoundedRect(6, 6, 8, 8, 2);
      });
    }

    // Walls
    mk('wall', g => {
      g.fillStyle(0x666666);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x888888);
      g.fillRect(2, 2, 28, 28);
      g.fillStyle(0xaaaaaa, 0.3);
      g.fillRect(4, 4, 24, 4);
    });
    mk('reinforcedWall', g => {
      g.fillStyle(0x777777);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xaaaaaa);
      g.fillRect(2, 2, 28, 28);
      g.fillStyle(0xcc9900, 0.5);
      g.fillRect(4, 4, 24, 4);
      g.fillRect(4, 24, 24, 4);
      g.fillRect(4, 14, 24, 4);
    });

    // Core
    mk('core', g => {
      g.fillStyle(0x111122);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xffdd00);
      g.fillCircle(16, 16, 12);
      g.fillStyle(0xff8800);
      g.fillCircle(16, 16, 7);
      g.fillStyle(0xffff88);
      g.fillCircle(16, 16, 3);
    });

    // Towers
    mk('turret', g => {
      g.fillStyle(0x1a2255);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x3344bb);
      g.fillRect(4, 4, 24, 24);
      g.fillStyle(0x6677dd);
      g.fillRect(13, 2, 6, 18);
    });
    mk('cannon', g => {
      g.fillStyle(0x443300);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x885500);
      g.fillCircle(16, 16, 12);
      g.fillStyle(0x553300);
      g.fillRect(13, 2, 6, 20);
    });
    mk('tesla', g => {
      g.fillStyle(0x220033);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x9900cc);
      g.fillRect(4, 4, 24, 24);
      g.fillStyle(0xcc88ff);
      g.fillRect(12, 2, 8, 12);
      g.fillRect(10, 8, 12, 4);
    });
    mk('flameTower', g => {
      g.fillStyle(0x220000);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xcc3300);
      g.fillRect(4, 4, 24, 24);
      g.fillStyle(0xff6600, 0.8);
      g.fillTriangle(16, 2, 8, 16, 24, 16);
    });
    mk('crystalSniper', g => {
      g.fillStyle(0x002233);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x00aaaa);
      g.fillRect(4, 8, 24, 16);
      g.fillStyle(0x44ffff);
      g.fillRect(14, 2, 4, 28);
    });
    mk('laser', g => {
      g.fillStyle(0x001111);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x004444);
      g.fillRect(4, 4, 24, 24);
      g.fillStyle(0x00ff88);
      g.fillRect(14, 0, 4, 32);
    });

    // Miners
    mk('drill', g => {
      g.fillStyle(0x333300);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xcccc00);
      g.fillRect(6, 6, 20, 20);
      g.fillStyle(0xffff44);
      g.fillTriangle(16, 4, 10, 20, 22, 20);
    });
    mk('pumpDrill', g => {
      g.fillStyle(0x334400);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xaacc00);
      g.fillRect(4, 4, 24, 24);
      g.fillStyle(0xddff44);
      g.fillTriangle(16, 2, 8, 18, 24, 18);
      g.fillStyle(0x88aa00);
      g.fillRect(14, 18, 4, 10);
    });
    mk('deepMiner', g => {
      g.fillStyle(0x334400);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x88dd00);
      g.fillRect(4, 4, 24, 24);
      g.fillStyle(0xccff44);
      g.fillTriangle(16, 2, 6, 22, 26, 22);
      g.fillStyle(0x445500);
      g.fillRect(13, 14, 6, 14);
    });

    // Support buildings
    mk('conveyor', g => {
      g.fillStyle(0x332200);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x885500);
      g.fillRect(4, 12, 24, 8);
      g.fillStyle(0xaa6600);
      g.fillTriangle(20, 16, 12, 10, 12, 22);
    });
    mk('ammoCache', g => {
      g.fillStyle(0x222233);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x556677);
      g.fillRect(4, 4, 24, 24);
      g.fillStyle(0x8899aa);
      g.fillRect(8, 8, 6, 16);
      g.fillRect(18, 8, 6, 16);
    });
    mk('coalPowerPlant', g => {
      g.fillStyle(0x221100);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xff7700);
      g.fillRect(4, 8, 24, 20);
      g.fillStyle(0x442200);
      g.fillRect(10, 2, 8, 8);
      g.fillStyle(0xff4400, 0.8);
      g.fillCircle(14, 2, 3);
    });
    mk('solarPanel', g => {
      g.fillStyle(0x001133);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x3366ff);
      g.fillRect(2, 8, 28, 16);
      g.fillStyle(0x6699ff, 0.5);
      g.fillRect(2, 8, 28, 4);
      for (let i = 0; i < 4; i++) {
        g.fillStyle(0x1144aa);
        g.fillRect(2 + i * 7, 8, 1, 16);
      }
    });
    mk('researchLab', g => {
      g.fillStyle(0x110022);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x993399);
      g.fillRect(4, 4, 24, 24);
      g.fillStyle(0xdd66dd);
      g.fillCircle(16, 14, 6);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(13, 11, 2);
    });

    // Enemies
    mk('crawler', g => {
      g.fillStyle(0xff3333);
      g.fillCircle(16, 16, 10);
      g.fillStyle(0xdd0000);
      g.fillCircle(16, 16, 6);
      g.fillStyle(0xff7777);
      g.fillCircle(11, 11, 3);
    });
    mk('brute', g => {
      g.fillStyle(0x880000);
      g.fillRect(4, 4, 24, 24);
      g.fillStyle(0xaa1111);
      g.fillRect(6, 6, 20, 20);
      g.fillStyle(0xdd3333, 0.5);
      g.fillRect(8, 8, 8, 4);
      g.fillRect(16, 20, 8, 4);
    });
    mk('burster', g => {
      g.fillStyle(0xff8800);
      g.fillCircle(16, 16, 11);
      g.fillStyle(0xffcc00, 0.6);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.fillRect(16 + Math.cos(a) * 7 - 2, 16 + Math.sin(a) * 7 - 2, 4, 4);
      }
    });
    mk('flyer', g => {
      g.fillStyle(0xff44ff);
      g.fillTriangle(16, 4, 4, 28, 28, 28);
      g.fillStyle(0xdd00dd, 0.7);
      g.fillTriangle(16, 8, 8, 24, 24, 24);
      g.fillStyle(0xffaaff, 0.4);
      g.fillTriangle(16, 12, 12, 20, 20, 20);
    });
    mk('burrower', g => {
      g.fillStyle(0x552200);
      g.fillRect(4, 12, 24, 16);
      g.fillStyle(0x884400);
      g.fillRect(6, 14, 20, 12);
      g.fillStyle(0xaa6600, 0.5);
      for (let i = 0; i < 4; i++) {
        g.fillRect(6 + i * 5, 10, 4, 8);
      }
    });
    mk('armoredTank', g => {
      g.fillStyle(0x333333);
      g.fillRect(2, 6, 28, 20);
      g.fillStyle(0x555555);
      g.fillRect(4, 8, 24, 16);
      g.fillStyle(0x888888);
      g.fillRect(8, 10, 12, 12);
      g.fillStyle(0x444444);
      g.fillRect(20, 14, 10, 4);
    });
    mk('swarmQueen', g => {
      g.fillStyle(0x440044);
      g.fillCircle(16, 16, 13);
      g.fillStyle(0x880088);
      g.fillCircle(16, 16, 9);
      g.fillStyle(0xcc44cc);
      g.fillCircle(16, 16, 5);
      g.fillStyle(0x440044, 0.7);
      g.fillRect(4, 10, 6, 4);
      g.fillRect(22, 10, 6, 4);
    });

    // Toolbar button backgrounds
    mk('btn', g => {
      g.fillStyle(0x1a1a2e);
      g.fillRect(0, 0, 56, 56);
      g.lineStyle(2, 0x334477);
      g.strokeRect(1, 1, 54, 54);
    }, 56, 56);
    mk('btn-sel', g => {
      g.fillStyle(0x1a2a1a);
      g.fillRect(0, 0, 56, 56);
      g.lineStyle(2, 0x44ff44);
      g.strokeRect(1, 1, 54, 54);
    }, 56, 56);
    mk('btn-hover', g => {
      g.fillStyle(0x222244);
      g.fillRect(0, 0, 56, 56);
      g.lineStyle(2, 0x6688dd);
      g.strokeRect(1, 1, 54, 54);
    }, 56, 56);

    g.destroy();
  }
}
