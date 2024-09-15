class CpuRamBus {
  constructor(cpuRam) {
    this._cpuRam = cpuRam;
  }

  read(address) {
    if (address >= 0 && address <= 0x7ff) {
      return this._cpuRam[address];
    }
  }

  write(address, data) {
    if (address >= 0 && address <= 0x7ff) {
      this._cpuRam[address] = data;
    }
  }
}

export {CpuRamBus};