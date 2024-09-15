import {Palette} from "./palette.js";

class Foreground {
  constructor({output, patterns, vpuBus}) {
    this._address = 0;
    this._data = new Uint8Array(256);
    this._output = output;
    this._patterns = patterns;
    this._vpuBus = vpuBus;
  }

  setAddress(address) {
    this._address = address;
  }

  read() {
    return this._data[this._address];
  }

  write(data) {
    this._data[this._address++] = data;
  }

  setOutput() {
    for (let i = 0; i < 64; i++) {
      const address = 4 * i;
      const patternPage = 0;
      const patternIndex = this._data[address + 1];
      const pattern = this._patterns.get(patternPage, patternIndex);
      const leftX = this._data[address + 3];
      const topY = this._data[address] + 1;
      const z = -(this._data[address + 2] >> 5 & 1);
      const patternIsToFlipHorizontally = this._data[address + 2] >> 6 & 1;

      for (let patternX = 0; patternX < 8; patternX++) {
        const x = leftX + (patternIsToFlipHorizontally ? (7 - patternX) : patternX);

        if (x < 0 || x > 255) {
          continue;
        }
        
        for (let patternY = 0; patternY < 8; patternY++) {
          const y = topY + patternY;

          if (y < 0 || y > 239) {
            continue;
          }

          const outputIndex = 4 * (x + 256 * y);

          if (z < 0 && this._output[outputIndex + 3] !== 0) {
            continue;
          }

          const colorIndex = pattern[patternX + 8 * patternY];

          if (colorIndex === 0) {
            continue;
          }

          const palette = this._getPalette(i);
          const color = palette[colorIndex];

          this._output.set(color, outputIndex);
        }
      }
    }
  }

  _getPalette(i) {
    // This function assumes we are playing Mario Bros.

    const address = 4 * i;
    const patternIndex = this._data[address + 1];
    const paletteIndex = this._data[address + 2] & 0b11;

    if (patternIndex === 0xee) {
      // asterisk on the title sequence

      return Palette.MONOCHROME_ORANGE;
    }

    if (paletteIndex === 1 && (patternIndex >= 0x00 && patternIndex <= 0x3d || patternIndex === 0xdf)) {
      // Luigi

      return Palette.GREEN;
    }

    if ((patternIndex >= 0x8a && patternIndex <= 0x91) || (patternIndex >= 0xe8 && patternIndex <= 0xf2) || (patternIndex >= 0x68 && patternIndex <= 0x6b)) {
      // ice

      return Palette.BLUE;
    }

    return Palette.RED;
  }
}

export {Foreground};