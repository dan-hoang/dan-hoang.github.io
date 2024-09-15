class CpuCtlBus {
  constructor(ctl) {
    this._ctl = ctl;
  }

  read(address) {
    if (address === 0x4016) {
      return this._ctl.read(0);
    }
    
    if (address === 0x4017) {
      return this._ctl.read(1);
    }
  }

  write(address, data) {
    if (address === 0x4016) {
      this._ctl.setPolling(data);
    }
  }
}

export {CpuCtlBus};