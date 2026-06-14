# Trojan Force

A Phaser 3 tower defense game where you mine resources, build supply chains, and hold off 20 waves of enemies.

---

## Getting Started

```bash
# 1. Clone and enter the repo
git clone https://github.com/ReadableCode/Trojan-Force.git
cd Trojan-Force

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

The game opens at **http://localhost:3000**.

---

## Play on Other Devices (Local Network)

To let phones, tablets, or other laptops on the same Wi-Fi join the game:

```bash
npm run dev -- --host
```

Vite will print two URLs:

```
  Local:   http://localhost:3000/
  Network: http://192.168.x.x:3000/
```

Any device on the same network can open the **Network URL** in a browser — no install needed. If other devices can't connect, check that your firewall allows inbound connections on port 3000.

This is the only multi-device hosting option covered here. There is no cloud or online deployment — you run the server on your machine.

---

## How to Play

### Core Loop

Each round has two phases that repeat for 20 waves:

1. **Build Phase (45 seconds)** — Place miners on resource patches to gather Iron, Copper, Coal, and Crystal. Spend resources on towers, walls, and support buildings to fortify your defenses.
2. **Wave Phase** — Enemies spawn and advance along paths toward your Core. Towers fire automatically. Destroyed enemies drop resources. Survive all 20 waves to win; if the Core reaches 0 HP you lose.

### Controls

| Action | Input |
|---|---|
| Place selected building | Left-click on grid |
| Sell building (50% refund) | Right-click on placed building |
| Rotate conveyor | R |
| Deselect / cancel | Esc |

### Resources

| Resource | Primary Use |
|---|---|
| Iron | Towers, walls, drills, ammo |
| Copper | Tesla, Laser, support buildings |
| Coal | Flame Tower ammo, Power Plants |
| Crystal | Crystal Sniper, Laser, Research Lab |
| Power | Consumed per shot by Tesla and Laser towers |

### Towers

| Tower | Cost | Range | Notes |
|---|---|---|---|
| Turret | 30 Iron | 4 tiles | Fast, cheap, general purpose |
| Cannon | 50 Iron + 20 Copper | 5 tiles | Slow heavy shot, 1.5-tile splash; consumes Iron ammo |
| Tesla | 60 Copper | 3 tiles | Chains to 3 targets; consumes Power per shot |
| Flame Tower | 40 Iron + 30 Coal | 2 tiles | Rapid fire + burn DOT; consumes Coal ammo |
| Crystal Sniper | 20 Iron + 40 Crystal | 9 tiles | Very high single-shot damage, slow fire rate |
| Laser | 50 Copper + 30 Crystal | 6 tiles | Pierces armor; consumes Power per shot |

### Enemies

| Enemy | Notes |
|---|---|
| Crawler | Fast, low HP, basic attacker |
| Brute | Slow, high HP, 20% armor |
| Burster | Explodes on death, area damage |
| Flyer | Fastest unit; ignores ground obstacles |
| Burrower | Tunnels (ignores walls), 10% armor |
| Armored Tank | Very high HP, 50% armor, heavy damage |
| Swarm Queen | Spawns 4 Crawlers on death |

---

## Project Layout

```
src/
├── main.ts              Entry point — creates the Phaser game and registers scenes
├── constants.ts         Tile size, canvas dimensions, core HP, build-phase timer
├── EventBus.ts          Global Phaser EventEmitter shared between scenes
├── Pathfinder.ts        BFS grid pathfinder for enemy routing
├── ResourceManager.ts   Resource store: balances, rates, add/spend helpers
├── data/
│   ├── enemies.ts       Stat definitions for all enemy types
│   ├── towers.ts        Stat definitions for all tower types
│   ├── buildings.ts     Definitions for walls, miners, and support buildings
│   ├── waves.ts         Per-wave enemy spawn lists
│   ├── mapData.ts       Tile map layout and resource-patch positions
│   └── research.ts      Research tree node definitions and unlock effects
├── entities/
│   ├── Enemy.ts         Enemy sprite: movement, pathfinding, damage, death
│   ├── Tower.ts         Tower sprite: targeting, shooting, ammo consumption
│   ├── Building.ts      Placeable building sprite (walls, miners, support)
│   └── Projectile.ts    Projectile sprite: travel, hit detection, splash
└── scenes/
    ├── BootScene.ts     Preloads assets, bootstraps the game
    ├── MenuScene.ts     Main menu
    ├── GameScene.ts     Core gameplay: grid, entities, waves, build/fight phases
    └── UIScene.ts       HUD overlay: resource bars, toolbar, wave counter
```

---

## Development

**Type-check without building:**

```bash
npx tsc --noEmit
```

**Production build:**

```bash
npm run build
```

Output goes to `dist/`. The result is a folder of static files that can be served by any web server or opened directly with a local file server (e.g. `npx serve dist`).

**Preview the production build locally:**

```bash
npm run preview
```
