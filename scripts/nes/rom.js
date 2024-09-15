import {CpuRomBus} from "./cpu-rom-bus.js";
import {VpuRomBus} from "./vpu-rom-bus.js";

class Rom {
  constructor({cpuRom, vpuRom}) {
    this._cpuRomBus = new CpuRomBus(cpuRom);
    this._vpuRomBus = new VpuRomBus(vpuRom);
  }

  getCpuRomBus() {
    return this._cpuRomBus;
  }

  getVpuRomBus() {
    return this._vpuRomBus;
  }
}

export {Rom};