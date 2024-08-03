import {Square} from "./square.js";
import {Triangle} from "./triangle.js";

class Apu {
  constructor() {
    this._cyclesPerFrame = 30000;
    this._audioOutput = new Float32Array(this._cyclesPerFrame);
    this._square1 = new Square();
    this._square2 = new Square();
    this._time = null;
    this._triangle = new Triangle();
  }

  power() {
    this._time = 0;
  }
  
  cycle() {
    this._square1.cycle();
    this._square2.cycle();
    this._triangle.cycle();
    this._audioOutput[this._time] = this._square1.getOutput() + this._square2.getOutput() + this._triangle.getOutput();
    this._time = (this._time + 1) % this._cyclesPerFrame;
  }

  getOutput() {
    return this._audioOutput;
  }

  readCpuAddress(address) {
    return 0;
  }

  writeToCpuAddress(address, data) {
    switch (address) {
      case 0x4000:
        this._square1.setVolume(0.005 * (data & 0x0f));
        break;
      
      case 0x4002:
        this._square1.setPeriod(8 * ((this._square1.getPeriod() / 8) & 0x0700 | data));
        break;
      
      case 0x4003:
        this._square1.setPeriod(8 * ((this._square1.getPeriod() / 8) & 0xff | ((data & 0x07) << 8)));
        break;
      
      case 0x4004:
        this._square2.setVolume(0.005 * (data & 0x0f));
        break;
      
      case 0x4006:
        this._square2.setPeriod(8 * ((this._square2.getPeriod() / 8) & 0x0700 | data));
        break;
      
      case 0x4007:
        this._square2.setPeriod(8 * ((this._square2.getPeriod() / 8) & 0xff | ((data & 0x07) << 8)));
        break;

      case 0x4008:
        // This case assumes we are playing Mario Bros.
        // Basically, the triangle wave is disabled for most music.

        if (data >> 3 === 1 || data >> 3 === 3) {
          this._square2.setVolume(0);
          this._triangle.setCountdown(data & 0x7f);
        } else {
          if (data >> 3 !== 7) {
            this._triangle.setCountdown(0);
          }
        }

        break;
    
      case 0x400a:
        this._triangle.setPeriod(16 * ((this._triangle.getPeriod() / 16) & 0b011100000000 | data));
        break;
      
      case 0x400b:
        this._triangle.setPeriod(16 * ((this._triangle.getPeriod() / 16) & 0b11111111 | ((data & 0b0111) << 8)));
        break;
    }
  }
}

export {Apu};