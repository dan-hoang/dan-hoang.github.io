class Vpu {
  // Video is 256x240, divided into 32x30 8x8 tiles.

  constructor(bus) {
    this._address = null;
    this._ate = null;
    this._bus = bus;
    this._cyclesPerFrame = 30000;
    this._data = null;
    this._nmi = null;
    this._nmiTime = 20000;
    this._scrollX = null;
    this._scrollY = null;
    this._spriteAddress = null;
    this._spriteData = new Uint8Array(256);
    this._time = null;
    this._videoOutput = new Uint8ClampedArray(4 * 256 * 240);
  }

  power() {
    this._address = 0;
    this._ate = false;
    this._data = 0;
    this._nmi = false;
    this._scrollX = 0;
    this._scrollY = 0;
    this._spriteAddress = 0;
    this._time = 0;
  }

  cycle() {
    if (this._time === this._nmiTime) {
      this._nmi = true;
      this._setOutput();
    } else {
      this._nmi = false;
    }

    this._time = (this._time + 1) % this._cyclesPerFrame;
  }

  getOutput() {
    return this._videoOutput;
  }

  readCpuAddress(address) {
    switch (address) {
      case 0x2002:
        this._ate = false;
        return 1 << 7;

      case 0x2007:
        const data = this._data;
        
        this._data = this._read(this._address++);
        return data;
    }

    return 0;
  }

  writeToCpuAddress(address, data) {
    switch (address) {
      case 0x2003:
        this._spriteAddress = data;
        break;

      case 0x2004:
        this._spriteData[this._spriteAddress++] = data;
        break;

      case 0x2005:
        if (this._ate) {
          this._scrollY = data;
        } else {
          this._scrollX = data;
        }

        this._ate = !this._ate;
        break;

      case 0x2006:
        if (this._ate) {
          this._address = (this._address & 0xff00) | data;
        } else {
          this._address = (this._address & 0xff) | (data << 8);
        }

        this._ate = !this._ate;
        break;

      case 0x2007:
        this._write(this._address++, data);
        break;
    }
  }

  hasNmi() {
    return this._nmi;
  }

  _setOutput() {
    for (let pixelX = 0; pixelX < 256; pixelX++) {
      for (let pixelY = 0; pixelY < 240; pixelY++) {
        this._videoOutput.set(Color.BLACK, 4 * (pixelX + 256 * pixelY));
      }
    }

    this._drawTiles();
    this._drawSprites();
  }

  _drawTiles() {
    for (let tileX = 0; tileX < 32; tileX++) {
      for (let tileY = 0; tileY < 30; tileY++) {
        this._drawTile(tileX, tileY);
      }
    }
  }

  _drawTile(tileX, tileY) {
    const pattern = this._getTilePattern(tileX, tileY);
    const palette = this._getTilePalette(tileX, tileY);
    const destinationX = 8 * tileX + this._scrollX;
    const destinationY = 8 * tileY + this._scrollY;

    this._drawPattern({pattern, palette, destinationX, destinationY});
  }

  _getTilePattern(tileX, tileY) {
    const patternIndex = this._read(0x2000 + tileX + 32 * tileY);

    return this._getPattern(1, patternIndex);
  }

  _getPattern(patternPage, patternIndex) {
    const pattern = new Uint8Array(64);

    for (let dPixelY = 0; dPixelY < 8; dPixelY++) {
      const rowColorIndicesLowBits = this._read(0x1000 * patternPage + (patternIndex << 4 | dPixelY));
      const rowColorIndicesHighBits = this._read(0x1000 * patternPage + (patternIndex << 4 | (dPixelY + 8)));

      for (let dPixelX = 0; dPixelX < 8; dPixelX++) {
        const colorIndexLowBit = rowColorIndicesLowBits >> (7 - dPixelX) & 1;
        const colorIndexHighBit = rowColorIndicesHighBits >> (7 - dPixelX) & 1;
        const colorIndex = colorIndexLowBit | colorIndexHighBit << 1;
        pattern[dPixelX + 8 * dPixelY] = colorIndex;
      }
    }

    return pattern;
  }

  _getTilePalette(tileX, tileY) {
    // This function assumes we are playing Mario Bros.

    const patternIndex = this._read(0x2000 + tileX + 8 * tileY);

    if (patternIndex === 0x97 || (patternIndex >= 0xe8 && patternIndex <= 0xf9)) {
      // ice
      return Palette.BLUE;
    }

    return Palette.RED;
  }

  _drawPattern({pattern, palette, destinationX, destinationY, patternIsBehindBackground, patternIsFlippedHorizontally}) {
    for (let dPixelX = 0; dPixelX < 8; dPixelX++) {
      const pixelX = destinationX + (patternIsFlippedHorizontally ? (7 - dPixelX) : dPixelX);

      if (pixelX < 0 || pixelX > 255) {
        // out of bounds
        continue;
      }

      for (let dPixelY = 0; dPixelY < 8; dPixelY++) {
        const pixelY = destinationY + dPixelY;

        if (pixelY < 0 || pixelY > 239) {
          // out of bounds
          continue;
        }

        const pixelIndex = 4 * (pixelX + 256 * pixelY);

        if (patternIsBehindBackground) {
          const backgroundRed = this._videoOutput[pixelIndex];
          const backgroundGreen = this._videoOutput[pixelIndex + 1];
          const backgroundBlue = this._videoOutput[pixelIndex + 2];

          if (backgroundRed || backgroundGreen || backgroundBlue) {
            continue;
          }
        }
        
        const colorIndex = pattern[dPixelX + 8 * dPixelY];

        if (colorIndex === 0) {
          // transparent
          continue;
        }

        const color = palette[colorIndex];

        this._videoOutput.set(color, pixelIndex);
      }
    }
  }

  _drawSprites() {
    for (let spriteIndex = 0; spriteIndex < 64; spriteIndex++) {
      this._drawSprite(spriteIndex);
    }
  }

  _drawSprite(spriteIndex) {
    const pattern = this._getSpritePattern(spriteIndex);
    const palette = this._getSpritePalette(spriteIndex);
    const spriteAddress = 4 * spriteIndex;
    const destinationX = this._spriteData[spriteAddress + 3];
    const destinationY = this._spriteData[spriteAddress] + 1;
    const patternIsBehindBackground = this._spriteData[spriteAddress + 2] >> 5 & 1;
    const patternIsFlippedHorizontally = this._spriteData[spriteAddress + 2] >> 6 & 1;

    this._drawPattern({pattern, palette, destinationX, destinationY, patternIsBehindBackground, patternIsFlippedHorizontally});
  }

  _getSpritePattern(spriteIndex) {
    const spriteAddress = 4 * spriteIndex;
    const patternIndex = this._spriteData[spriteAddress + 1];

    return this._getPattern(0, patternIndex);
  }

  _getSpritePalette(spriteIndex) {
    // This function assumes we are playing Mario Bros.

    const spriteAddress = 4 * spriteIndex;
    const patternIndex = this._spriteData[spriteAddress + 1];
    const paletteIndex = this._spriteData[spriteAddress + 2] & 0b11;

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

  _read(address) {
    return this._bus.readVpuAddress(address);
  }

  _write(address, data) {
    this._bus.writeToVpuAddress(address, data);
  }
}

const Color = {
  BLACK: [0x00, 0x00, 0x00, 0xff],
  WHITE: [0xff, 0xff, 0xff, 0xff],
  RED: [0xb5, 0x31, 0x20, 0xff],
  ORANGE: [0xea, 0x9e, 0x22, 0xff],
  GREEN: [0x38, 0x87, 0x00, 0xff],
  LIGHT_BLUE: [0x48, 0xcd, 0xde, 0xff],
  BLUE: [0x42, 0x40, 0xff, 0xff]
};

const Palette = {
  RED: [Color.BLACK, Color.WHITE, Color.ORANGE, Color.RED],
  MONOCHROME_ORANGE: [Color.BLACK, Color.ORANGE, Color.ORANGE, Color.ORANGE],
  GREEN: [Color.BLACK, Color.WHITE, Color.ORANGE, Color.GREEN],
  BLUE: [Color.BLACK, Color.WHITE, Color.LIGHT_BLUE, Color.BLUE]
};

export {Vpu};