import { GRID_COLS, GRID_ROWS } from './constants';

interface Node {
  x: number; y: number;
  g: number; h: number; f: number;
  parent: Node | null;
}

export class Pathfinder {
  private blocked = new Set<string>();

  setBlocked(gx: number, gy: number, val: boolean): void {
    const k = `${gx},${gy}`;
    if (val) this.blocked.add(k);
    else this.blocked.delete(k);
  }

  isBlocked(gx: number, gy: number): boolean {
    return this.blocked.has(`${gx},${gy}`);
  }

  findPath(
    sx: number, sy: number,
    tx: number, ty: number,
    ignoreWalls = false,
  ): Array<{ x: number; y: number }> {
    if (sx === tx && sy === ty) return [{ x: tx, y: ty }];

    const open: Node[] = [];
    const closed = new Set<string>();
    const h = (x: number, y: number) => Math.abs(x - tx) + Math.abs(y - ty);

    open.push({ x: sx, y: sy, g: 0, h: h(sx, sy), f: h(sx, sy), parent: null });

    while (open.length > 0) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) {
        if (open[i].f < open[bi].f) bi = i;
      }
      const cur = open.splice(bi, 1)[0];

      if (cur.x === tx && cur.y === ty) {
        const path: Array<{ x: number; y: number }> = [];
        let n: Node | null = cur;
        while (n) { path.unshift({ x: n.x, y: n.y }); n = n.parent; }
        return path;
      }

      closed.add(`${cur.x},${cur.y}`);

      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;
        if (closed.has(`${nx},${ny}`)) continue;
        if (!ignoreWalls && this.isBlocked(nx, ny) && !(nx === tx && ny === ty)) continue;

        const g = cur.g + 1;
        const existing = open.find(n => n.x === nx && n.y === ny);
        if (existing) {
          if (g < existing.g) {
            existing.g = g; existing.f = g + existing.h; existing.parent = cur;
          }
        } else {
          const hv = h(nx, ny);
          open.push({ x: nx, y: ny, g, h: hv, f: g + hv, parent: cur });
        }
      }
    }
    return [];
  }
}
