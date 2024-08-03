import {DummyVpuDevice} from "./dummy-vpu-device.js";

class VpuBus {
  constructor(nes) {
    this._dummy = new DummyVpuDevice();
    this._nes = nes;
  }

  readVpuAddress(address) {
    return this._getDevice(address).readVpuAddress(address);
  }

  writeToVpuAddress(address, data) {
    this._getDevice(address).writeToVpuAddress(address, data);
  }

  _getDevice(address) {
    if (address >= 0x0000 && address <= 0x1fff) {
      return this._nes._rom;
    }

    if (address >= 0x2000 && address <= 0x23ff) {
      return this._nes._vpuRam;
    }

    return this._dummy;
  }
}

export {VpuBus};