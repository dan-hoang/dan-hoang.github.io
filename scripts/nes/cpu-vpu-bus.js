class CpuVpuBus {
  constructor(vpu) {
    this._cpuBus = null;
    this._vpu = vpu;
  }

  setCpuBus(cpuBus) {
    this._cpuBus = cpuBus;
  }

  read(address) {
    if (address >= 0x2000 && address <= 0x2007) {
      return this._vpu.read(address - 0x2000);
    }
  }

  write(address, data) {
    if (address >= 0x2000 && address <= 0x2007) {
      this._vpu.write(address - 0x2000, data);
    } else if (address === 0x4014) {
      const page = data;

      for (let i = 0; i < 256; i++) {
        const spriteData = this._cpuBus.read(i | page << 8);
        this._vpu.write(4, spriteData);
      }
    }
  }
}

export {CpuVpuBus};