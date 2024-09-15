class Bus {
  constructor(buses) {
    this._buses = buses;
  }

  read(address) {
    return this._buses.reduce((data, bus) => data !== undefined ? data : bus.read(address), undefined) || 0;
  }

  write(address, data) {
    this._buses.forEach(bus => bus.write(address, data));
  }
}

export {Bus};