class VpuRamBus {
  constructor(vpuRam) {
    this._vpuRam = vpuRam;
  }

  read(address) {
    if (address >= 0x2000 && address <= 0x23ff) {
      return this._vpuRam[address - 0x2000];
    }
  }

  write(address, data) {
    if (address >= 0x2000 && address <= 0x23ff) {
      this._vpuRam[address - 0x2000] = data;
    }
  }
}

export {VpuRamBus};