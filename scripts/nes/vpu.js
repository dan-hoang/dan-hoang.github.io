import {Patterns} from "./patterns.js";
import {Background} from "./background.js";
import {Foreground} from "./foreground.js";

class Vpu {
  constructor(vpuBus) {
    this._ate = false;
    this._vpuBus = vpuBus;
    this._patterns = new Patterns(this._vpuBus);
    this._output = new Uint8ClampedArray(0x3c000);
    this._background = new Background({output: this._output, patterns: this._patterns, vpuBus: this._vpuBus});
    this._cyclesPerFrame = 30000;
    this._foreground = new Foreground({output: this._output, patterns: this._patterns, vpuBus: this._vpuBus});
    this._nmi = false;
    this._time = 0;
  }

  getCyclesPerFrame() {
    return this._cyclesPerFrame;
  }

  hasNmi() {
    return this._nmi;
  }

  read(address) {
    switch (address) {
      case 2:
        this._ate = false;

        return 1 << 7;

      case 7:
        return this._background.read();
    }

    return 0;
  }

  write(address, data) {
    switch (address) {
      case 3:
        this._foreground.setAddress(data);
        break;

      case 4:
        this._foreground.write(data);
        break;
      
      case 5:
        if (this._ate) {
          this._background.setScrollY(data);
        }

        this._ate = !this._ate;
        break;

      case 6:
        this._background.setAddress(this._ate ? this._background.getAddress() & 0xff00 | data : this._background.getAddress() & 0xff | (data << 8));
        this._ate = !this._ate;
        break;

      case 7:
        this._background.write(data);
        break;
    }
  }

  cycle() {
    if (this._time === 0) {
      this._setOutput();
    }

    this._nmi = this._time === 20000;
    this._time = (this._time + 1) % this._cyclesPerFrame;
  }

  getOutput() {
    return this._output;
  }

  _setOutput() {
    this._background.setOutput();
    this._foreground.setOutput();
  }
}

export {Vpu};