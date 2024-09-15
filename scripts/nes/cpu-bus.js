import {Bus} from "./bus.js";

class CpuBus extends Bus {
  constructor({buses, interrupters}) {
    super(buses);
    this._interrupters = interrupters;
  }

  hasNmi() {
    return this._interrupters.reduce((a, b) => a || b.hasNmi(), false);
  }

  hasIrq() {
    return false;
  }
}

export {CpuBus};