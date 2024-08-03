class VpuRam {
  constructor() {
    this._backgroundData = new Uint8Array(0x400);
  }

  readVpuAddress(address) {
    return this._backgroundData[address - 0x2000];
  }

  writeToVpuAddress(address, data) {
    this._backgroundData[address - 0x2000] = data;
  }
}

export {VpuRam};