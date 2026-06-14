export const TILE_SIZE = 32;
export const GRID_COLS = 32;
export const GRID_ROWS = 16;
export const GRID_OFFSET_X = 0;
export const GRID_OFFSET_Y = 90;

export const CANVAS_W = 1024;
export const CANVAS_H = 770;

export const HUD_H = GRID_OFFSET_Y;
export const GRID_H = GRID_ROWS * TILE_SIZE; // 512
export const TOOLBAR_Y = GRID_OFFSET_Y + GRID_H; // 602
export const TOOLBAR_H = CANVAS_H - TOOLBAR_Y; // 168

export const CORE_HP = 200;
export const BUILD_PHASE_SECS = 45;

export const PROJECTILE_SPEED = 320;

export function tileToWorld(gx: number, gy: number): { x: number; y: number } {
  return {
    x: GRID_OFFSET_X + gx * TILE_SIZE + TILE_SIZE / 2,
    y: GRID_OFFSET_Y + gy * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function worldToTile(wx: number, wy: number): { gx: number; gy: number } {
  return {
    gx: Math.floor((wx - GRID_OFFSET_X) / TILE_SIZE),
    gy: Math.floor((wy - GRID_OFFSET_Y) / TILE_SIZE),
  };
}

export function isValidTile(gx: number, gy: number): boolean {
  return gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS;
}

export function tileKey(gx: number, gy: number): string {
  return `${gx},${gy}`;
}
