class Rom {
  constructor({chr, h, prg}) {
    this._chr = chr;
    this._prg = prg;
  }

  readCpuAddress(address) {
    return this._prg[address - 0xc000];
  }

  writeToCpuAddress(address, data) {

  }

  readVpuAddress(address) {
    return this._chr[address];
  }

  writeToVpuAddress(address, data) {

  }
}

export {Rom};