class Patterns {
  constructor(vpuBus) {
    this._patterns = new Array(512);
    this._vpuBus = vpuBus;
  }

  get(page, index) {
    let pattern = this._patterns[256 * page + index];

    if (pattern !== undefined) {
      return pattern;
    }

    pattern = new Uint8Array(64);

    for (let patternY = 0; patternY < 8; patternY++) {
      const lows = this._vpuBus.read(0x1000 * page + (index << 4 | patternY));
      const highs = this._vpuBus.read(0x1000 * page + (index << 4 | (patternY + 8)));

      for (let patternX = 0; patternX < 8; patternX++) {
        const low = lows >> (7 - patternX) & 1;
        const high = highs >> (7 - patternX) & 1;
        const colorIndex = low | high << 1;
        
        pattern[patternX + 8 * patternY] = colorIndex;
      }
    }

    this._patterns[256 * page + index] = pattern;
    return pattern;
  }
}

export {Patterns};