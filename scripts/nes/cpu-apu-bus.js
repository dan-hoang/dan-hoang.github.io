class CpuApuBus {
  constructor(apu) {
    this._apu = apu;
  }

  read(address) {
    
  }

  write(address, data) {
    switch (address) {
      case 0x4000:
        this._apu.getSquare1().setVolume(0.005 * (data & 0x0f));
        break;
      
      case 0x4002:
        this._apu.getSquare1().setPeriod(8 * ((this._apu.getSquare1().getPeriod() / 8) & 0x0700 | data));
        break;
      
      case 0x4003:
        this._apu.getSquare1().setPeriod(8 * ((this._apu.getSquare1().getPeriod() / 8) & 0xff | ((data & 0x07) << 8)));
        break;
      
      case 0x4004:
        this._apu.getSquare2().setVolume(0.005 * (data & 0x0f));
        break;
      
      case 0x4006:
        this._apu.getSquare2().setPeriod(8 * ((this._apu.getSquare2().getPeriod() / 8) & 0x0700 | data));
        break;
      
      case 0x4007:
        this._apu.getSquare2().setPeriod(8 * ((this._apu.getSquare2().getPeriod() / 8) & 0xff | ((data & 0x07) << 8)));
        break;

      case 0x4008:
        // This case assumes we are playing Mario Bros.
        // Basically, the triangle wave is disabled for most music.

        if (data >> 3 === 1 || data >> 3 === 3) {
          this._apu.getSquare2().setVolume(0);
          this._apu.getTriangle().setCountdown(data & 0x7f);
        } else {
          if (data >> 3 !== 7) {
            this._apu.getTriangle().setCountdown(0);
          }
        }

        break;
    
      case 0x400a:
        this._apu.getTriangle().setPeriod(16 * ((this._apu.getTriangle().getPeriod() / 16) & 0b011100000000 | data));
        break;
      
      case 0x400b:
        this._apu.getTriangle().setPeriod(16 * ((this._apu.getTriangle().getPeriod() / 16) & 0b11111111 | ((data & 0b0111) << 8)));
        break;
    }
  }
}

export {CpuApuBus};