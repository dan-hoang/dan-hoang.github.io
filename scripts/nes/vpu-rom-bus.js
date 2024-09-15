class VpuRomBus {
  constructor(vpuRom) {
    this._vpuRom = vpuRom;
  }

  read(address) {
    if (address >= 0 && address <= 0x1fff) {
      return this._vpuRom[address];
    }
  }

  write(address, data) {
    
  }
}

export {VpuRomBus};