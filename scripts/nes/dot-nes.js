import {Rom} from "./rom.js";

class DotNes {
  constructor(data) {
    const prgBegin = 0x10;
    const prgEnd = prgBegin + 0x4000 * data[4];
    
    this._prg = data.slice(prgBegin, prgEnd);

    const chrBegin = prgEnd;
    const chrEnd = chrBegin + 0x2000 * data[5];

    this._chr = data.slice(chrBegin, chrEnd);
  }

  toRom() {
    return new Rom({cpuRom: this._prg, vpuRom: this._chr});
  }
}

export {DotNes};