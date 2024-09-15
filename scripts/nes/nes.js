import {VpuRamBus} from "./vpu-ram-bus.js";
import {VpuBus} from "./vpu-bus.js";
import {Vpu} from "./vpu.js";
import {Apu} from "./apu.js";
import {Ctl} from "./ctl.js";
import {CpuApuBus} from "./cpu-apu-bus.js";
import {CpuRamBus} from "./cpu-ram-bus.js";
import {CpuCtlBus} from "./cpu-ctl-bus.js";
import {CpuVpuBus} from "./cpu-vpu-bus.js";
import {CpuBus} from "./cpu-bus.js";
import {Cpu} from "./cpu.js";

class Nes {
  constructor(rom) {
    this._vpuRam = new Uint8Array(0x800);
    this._vpuRamBus = new VpuRamBus(this._vpuRam);
    this._vpuRomBus = rom.getVpuRomBus();
    this._vpuBus = new VpuBus([this._vpuRamBus, this._vpuRomBus]);
    this._vpu = new Vpu(this._vpuBus);
    this._apu = new Apu(new Float32Array(this._vpu.getCyclesPerFrame()));
    this._cpuRam = new Uint8Array(0x800);
    this._ctl = new Ctl();
    this._cpuApuBus = new CpuApuBus(this._apu);
    this._cpuRamBus = new CpuRamBus(this._cpuRam);
    this._cpuCtlBus = new CpuCtlBus(this._ctl);
    this._cpuRomBus = rom.getCpuRomBus();
    this._cpuVpuBus = new CpuVpuBus(this._vpu);
    this._cpuBus = new CpuBus({buses: [this._cpuApuBus, this._cpuRamBus, this._cpuCtlBus, this._cpuRomBus, this._cpuVpuBus], interrupters: [this._vpu]});
    this._cpuVpuBus.setCpuBus(this._cpuBus);
    this._cpu = new Cpu(this._cpuBus);
  }

  hold(button) {
    this._ctl.hold(button);
  }

  release(button) {
    this._ctl.release(button);
  }

  frame() {
    for (let i = 0; i < this._vpu.getCyclesPerFrame(); i++) {
      this._apu.cycle();
      this._cpu.cycle();
      this._ctl.cycle();
      this._vpu.cycle();
    }
  }

  getAudioOutput() {
    return this._apu.getOutput();
  }

  getVideoOutput() {
    return this._vpu.getOutput();
  }
}

export {Nes};