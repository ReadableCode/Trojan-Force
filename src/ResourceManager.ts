import { EventBus } from './EventBus';

export type ResourceKey = 'iron' | 'copper' | 'coal' | 'crystal' | 'power';

export interface Inventory {
  iron: number;
  copper: number;
  coal: number;
  crystal: number;
  power: number;
  maxPower: number;
}

export class ResourceManager {
  private inv: Inventory = {
    iron: 150,
    copper: 50,
    coal: 30,
    crystal: 0,
    power: 0,
    maxPower: 0,
  };

  getAll(): Readonly<Inventory> {
    return { ...this.inv };
  }

  get(key: ResourceKey | 'maxPower'): number {
    return this.inv[key];
  }

  canAfford(costs: Partial<Record<string, number>>): boolean {
    for (const [k, v] of Object.entries(costs)) {
      if ((this.inv[k as ResourceKey] ?? 0) < (v ?? 0)) return false;
    }
    return true;
  }

  spend(costs: Partial<Record<string, number>>): boolean {
    if (!this.canAfford(costs)) return false;
    for (const [k, v] of Object.entries(costs)) {
      (this.inv as unknown as Record<string, number>)[k] -= v ?? 0;
    }
    this.changed();
    return true;
  }

  add(key: ResourceKey, amount: number): void {
    if (key === 'power') {
      this.inv.power = Math.min(this.inv.maxPower, this.inv.power + amount);
    } else {
      (this.inv as unknown as Record<string, number>)[key] += amount;
    }
    this.changed();
  }

  addPowerCapacity(amount: number): void {
    this.inv.maxPower += amount;
    this.changed();
  }

  refund(costs: Partial<Record<string, number>>, pct = 0.5): void {
    for (const [k, v] of Object.entries(costs)) {
      (this.inv as unknown as Record<string, number>)[k] += Math.floor((v ?? 0) * pct);
    }
    this.changed();
  }

  private changed(): void {
    EventBus.emit('resources-changed', this.getAll());
  }
}
