class CpuRomBus {
  constructor(cpuRom) {
    this._cpuRom = cpuRom;
  }

  read(address) {
    if (address >= 0xc000 && address <= 0xffff) {
      return this._cpuRom[address - 0xc000];
    }
  }

  write(address, data) {
    
  }
}

export {CpuRomBus};