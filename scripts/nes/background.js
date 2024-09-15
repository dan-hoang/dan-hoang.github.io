import {Palette} from "./palette.js";

class Background {
  constructor({output, patterns, vpuBus}) {
    this._address = 0;
    this._data = 0;
    this._output = output;
    this._patterns = patterns;
    this._scrollY = 0;
    this._vpuBus = vpuBus;
  }

  getAddress() {
    return this._address;
  }

  setAddress(address) {
    this._address = address;
  }

  read() {
    const data = this._data;

    this._data = this._vpuBus.read(this._address++);

    return data;
  }

  write(data) {
    this._vpuBus.write(this._address++, data);
  }

  getScrollY() {
    return this._scrollY;
  }

  setScrollY(scrollY) {
    this._scrollY = scrollY;
  }

  setOutput() {
    for (let i = 0; i < 30; i++) {
      for (let j = 0; j < 32; j++) {
        const address = 0x2000 + 32 * i + j;
        const patternPage = 1;
        const patternIndex = this._vpuBus.read(address);
        const pattern = this._patterns.get(patternPage, patternIndex);
        const leftX = 8 * j;
        const topY = 8 * i;

        for (let patternX = 0; patternX < 8; patternX++) {
          const x = leftX + patternX;

          if (x < 0 || x > 255) {
            continue;
          }
          
          for (let patternY = 0; patternY < 8; patternY++) {
            const y = topY + this._scrollY + patternY;

            if (y < 0 || y > 239) {
              continue;
            }

            const outputIndex = 4 * (x + 256 * y);
            const colorIndex = pattern[patternX + 8 * patternY];

            const palette = this._getPalette(i, j);
            const color = palette[colorIndex];

            this._output.set(color, outputIndex);
          }
        }
      }
    }
  }

  _getPalette(i, j) {
    // This function assumes we are playing Mario Bros.

    const patternIndex = this._vpuBus.read(0x2000 + 8 * i + j);

    if (patternIndex === 0x97 || (patternIndex >= 0xe8 && patternIndex <= 0xf9)) {
      // ice

      return Palette.BLUE;
    }

    return Palette.RED;
  }
}

export {Background};