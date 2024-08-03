import {Apu} from "./apu.js";
import {CpuBus} from "./cpu-bus.js";
import {Cpu} from "./cpu.js";
import {CpuRam} from "./cpu-ram.js";
import {Ctl} from "./ctl.js";
import {SpriteCopier} from "./sprite-copier.js";
import {VpuBus} from "./vpu-bus.js";
import {Vpu} from "./vpu.js";
import {VpuRam} from "./vpu-ram.js";

class Nes {
  constructor() {
    this._apu = new Apu();
    this._cpuBus = new CpuBus(this);
    this._cpu = new Cpu(this._cpuBus);
    this._cpuRam = new CpuRam();
    this._ctl = new Ctl();
    this._cyclesPerFrame = 30000;
    this._rom = null;
    this._spriteCopier = new SpriteCopier(this);
    this._vpuBus = new VpuBus(this);
    this._vpu = new Vpu(this._vpuBus);
    this._vpuRam = new VpuRam();
  }

  setRom(rom) {
    this._rom = rom;
  }

  power() {
    this._apu.power();
    this._cpu.power();
    this._vpu.power();
  }

  holdButton(button) {
    this._ctl.holdButton(button);
  }

  releaseButton(button) {
    this._ctl.releaseButton(button);
  }

  playFrame() {
    for (let i = 0; i < this._cyclesPerFrame; i++) {
      this._apu.cycle();
      this._cpu.cycle();
      this._vpu.cycle();
    }

    return {audioOutput: this._apu.getOutput(), videoOutput: this._vpu.getOutput()};
  }
}

export {Nes};