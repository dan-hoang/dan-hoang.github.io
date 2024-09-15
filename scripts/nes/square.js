class Square {
  constructor() {
    this._output = 0;
    this._period = 0;
    this._time = 0;
    this._volume = 0;
  }

  cycle() {
    if (this._period === 0) {
      this._time = 0;
    } else {
      this._time = (this._time + 1) % (this._period + 1);
    }
  
    if (this._time === 0) {
      this._output = (this._output + 1) % 2;
    }
  }

  getOutput() {
    return this._output * this._volume;
  }

  getPeriod() {
    return this._period;
  }

  setPeriod(period) {
    this._period = period;
  }

  setVolume(volume) {
    this._volume = volume;
  }
}

export {Square};