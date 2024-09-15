import {Button} from "./button.js";

class Ctl {
  constructor() {
    this._ctl = [0, 0];
    this._holding = {};
    this._polling = true;
  }

  cycle() {
    if (this._polling) {
      this._poll();
    }
  }

  hold(button) {
    this._holding[button] = true;
  }

  release(button) {
    this._holding[button] = false;
  }

  read(address) {
    const data = this._ctl[address] & 1;

    this._ctl[address] >>= 1;
    
    return data;
  }

  setPolling(polling) {
    this._polling = polling;
  }

  _poll() {
    const _ = this._holding;
    
    this._ctl[0] = _[Button.A_1] << 0 | _[Button.B_1] << 1 | _[Button.SELECT_1] << 2 | _[Button.START_1] << 3 | _[Button.UP_1] << 4 | _[Button.DOWN_1] << 5 | _[Button.LEFT_1] << 6 | this._holding[Button.RIGHT_1] << 7;
    this._ctl[1] = _[Button.A_2] << 0 | _[Button.B_2] << 1 | _[Button.SELECT_2] << 2 | _[Button.START_2] << 3 | _[Button.UP_2] << 4 | _[Button.DOWN_2] << 5 | _[Button.LEFT_2] << 6 | this._holding[Button.RIGHT_2] << 7;
  }
}

export {Ctl};