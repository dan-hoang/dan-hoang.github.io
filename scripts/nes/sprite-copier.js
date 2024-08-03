class SpriteCopier {
  constructor(nes) {
    this._nes = nes;
  }

  readCpuAddress(address) {
    return 0;
  }

  writeToCpuAddress(address, data) {
    const page = data;

    this._nes._vpu.writeToCpuAddress(0x2003, 0);

    for (let i = 0; i < 256; i++) {
      const spriteData = this._nes._cpuBus.readCpuAddress(page << 8 | i);
      this._nes._vpu.writeToCpuAddress(0x2004, spriteData);
    }
  }
}

export {SpriteCopier};