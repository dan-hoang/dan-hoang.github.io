import {DummyCpuDevice} from "./dummy-cpu-device.js";

class CpuBus {
  constructor(nes) {
    this._dummy = new DummyCpuDevice();
    this._nes = nes;
  }

  readCpuAddress(address) {
    return this._getDevice(address).readCpuAddress(address);
  }

  writeToCpuAddress(address, data) {
    this._getDevice(address).writeToCpuAddress(address, data);
  }

  hasNmi() {
    return this._nes._vpu.hasNmi();
  }

  hasIrq() {
    return false;
  }

  _getDevice(address) {
    if (address >= 0x0000 && address <= 0x07ff) {
      return this._nes._cpuRam;
    }

    if (address >= 0x2000 && address <= 0x2007) {
      return this._nes._vpu;
    }

    if (address >= 0x4000 && address <= 0x400b) {
      return this._nes._apu;
    }

    if (address === 0x4014) {
      return this._nes._spriteCopier;
    }

    if (address >= 0x4016 && address <= 0x4017) {
      return this._nes._ctl;
    }

    if (address >= 0x8000 && address <= 0xffff) {
      return this._nes._rom;
    }
    
    return this._dummy;
  }
}

export {CpuBus};