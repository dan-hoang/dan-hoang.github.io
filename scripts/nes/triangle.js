class Triangle {
  constructor() {
    this.countdown = 0;
    this.output = 0;
    this.period = 0;
    this.time = 0;
    this.volume = 0;
  }

  cycle() {
    if (this.period < 1024) {
      this.period *= 2;
    }

    if (this._time === 0 && this.countdown > 0) {
      this.countdown--;
    }

    if (this.countdown === 0) {
      this.volume = 0;
    } else {
      this.volume = 0.005 * 15 * (1 - Math.abs(this.period / 2 - this.time) / (this.period / 2));
    }

    if (this.period === 0) {
      this.time = 0;
    } else {
      this.time = (this.time + 1) % (this.period + 1);
    }
  }

  getOutput() {
    return this.volume;
  }

  setCountdown(countdown) {
    this.countdown = countdown;
  }

  getPeriod() {
    return this.period;
  }

  setPeriod(period) {
    this.period = period;
  }
}

export {Triangle};