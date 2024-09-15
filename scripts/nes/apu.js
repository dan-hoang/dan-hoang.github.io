import {Square} from "./square.js";
import {Triangle} from "./triangle.js";

class Apu {
  constructor(output) {
    this._output = output;
    this._square1 = new Square();
    this._square2 = new Square();
    this._time = 0;
    this._triangle = new Triangle();
  }
  
  cycle() {
    this._square1.cycle();
    this._square2.cycle();
    this._triangle.cycle();
    this._output[this._time] = this._square1.getOutput() + this._square2.getOutput() + this._triangle.getOutput();
    this._time = (this._time + 1) % this._output.length;
  }

  getOutput() {
    return this._output;
  }

  getSquare1() {
    return this._square1;
  }

  getSquare2() {
    return this._square2;
  }

  getTriangle() {
    return this._triangle;
  }
}

export {Apu};