import {Button} from "./button.js";

class Ctl {
  constructor() {
    this._ctl1 = 0;
    this._ctl2 = 0;
    this._isHolding = {};
    this._isPolling = true;
  }

  holdButton(button) {
    this._isHolding[button] = true;
  }

  releaseButton(button) {
    this._isHolding[button] = false;
  }

  readCpuAddress(address) {
    if (this._isPolling) {
      this._poll();
    }

    if (address === 0x4016) {
      const data = this._ctl1 & 1;
      this._ctl1 >>= 1;
      return data;
    }

    const data = this._ctl2 & 1;
    this._ctl2 >>= 1;
    return data;
  }

  writeToCpuAddress(address, data) {
    if (this._isPolling) {
      this._poll();
    }

    if (address === 0x4016) {
      this._isPolling = data & 1;
    }
  }

  _poll() {
    this._ctl1 = 0;
    
    this._ctl1 |= this._isHolding[Button.A_1] << 0;
    this._ctl1 |= this._isHolding[Button.B_1] << 1;
    this._ctl1 |= this._isHolding[Button.SELECT_1] << 2;
    this._ctl1 |= this._isHolding[Button.START_1] << 3;
    this._ctl1 |= this._isHolding[Button.UP_1] << 4;
    this._ctl1 |= this._isHolding[Button.DOWN_1] << 5;
    this._ctl1 |= this._isHolding[Button.LEFT_1] << 6;
    this._ctl1 |= this._isHolding[Button.RIGHT_1] << 7;

    this._ctl2 = 0;
    
    this._ctl2 |= this._isHolding[Button.A_2] << 0;
    this._ctl2 |= this._isHolding[Button.B_2] << 1;
    this._ctl2 |= this._isHolding[Button.SELECT_2] << 2;
    this._ctl2 |= this._isHolding[Button.START_2] << 3;
    this._ctl2 |= this._isHolding[Button.UP_2] << 4;
    this._ctl2 |= this._isHolding[Button.DOWN_2] << 5;
    this._ctl2 |= this._isHolding[Button.LEFT_2] << 6;
    this._ctl2 |= this._isHolding[Button.RIGHT_2] << 7;
  }
}

export {Ctl};