class CpuRam {
  constructor() {
    this._data = new Uint8Array(0x800);
  }

  readCpuAddress(address) {
    return this._data[address];
  }

  writeToCpuAddress(address, data) {
    this._data[address] = data;
  }
}

export {CpuRam};