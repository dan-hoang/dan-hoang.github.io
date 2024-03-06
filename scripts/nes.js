class Nes {
  constructor() {
    this._apu = new Apu();
    this._cpuBus = new CpuBus(this);
    this._cpu = new Cpu(this._cpuBus);
    this._cpuRam = new CpuRam();
    this._ctl = new Ctl();
    this._cyclesPerFrame = 30000;
    this._rom = null;
    this._spriteCopier = new SpriteCopier(this);
    this._vpuBus = new VpuBus(this);
    this._vpu = new Vpu(this._vpuBus);
    this._vpuRam = new VpuRam();
  }

  setRom(rom) {
    this._rom = rom;
  }

  power() {
    this._apu.power();
    this._cpu.power();
    this._vpu.power();
  }

  holdButton(button) {
    this._ctl.holdButton(button);
  }

  releaseButton(button) {
    this._ctl.releaseButton(button);
  }

  playFrame() {
    for (let i = 0; i < this._cyclesPerFrame; i++) {
      this._apu.cycle();
      this._cpu.cycle();
      this._vpu.cycle();
    }

    return {
      audioOutput: this._apu.getOutput(),
      videoOutput: this._vpu.getOutput()
    };
  }
}

const Button = {
  LEFT_1: 0,
  UP_1: 1,
  RIGHT_1: 2,
  DOWN_1: 3,
  SELECT_1: 4,
  START_1: 5,
  B_1: 6,
  A_1: 7,
  LEFT_2: 8,
  UP_2: 9,
  RIGHT_2: 10,
  DOWN_2: 11,
  SELECT_2: 12,
  START_2: 13,
  B_2: 14,
  A_2: 15
};

function parseRom(data) {
  const prg = data.slice(0x0010, 0x4010);
  const chr = data.slice(0x4010, 0x6010);
  return new Rom(chr, prg);
}

class Av {
  constructor(audioContext, nes, videoContext) {
    this._audioContext = audioContext;
    this._numberOfChannels = 1;
    this._samplesPerSecond = this._audioContext.sampleRate;
    this._framesPerSecond = 60;
    this._samplesPerFrame = Math.floor(this._samplesPerSecond / this._framesPerSecond);
    this._audioBuffer = this._createAudioBuffer();

    this._audioBufferIndex = 0;
    this._audioQueue = new AudioQueue(this._audioContext);

    this._nes = nes;
    this._videoContext = videoContext;
    this._lastUpdateTime = performance.now();
  }

  play() {
    requestAnimationFrame(() => this.play());

    const now = performance.now();
    const deltaTime = now - this._lastUpdateTime;
    const interval = 1000 / this._framesPerSecond;

    // Lock to 60 fps.
    if (deltaTime > interval) {
      this._lastUpdateTime = now - (deltaTime % interval);
      this._audioContext.resume();

      let {audioOutput, videoOutput} = this._nes.playFrame();
      this._playAudio(audioOutput);
      this._playVideo(videoOutput);
    }
  }

  _createAudioBuffer() {
    return this._audioContext.createBuffer(this._numberOfChannels, 10 * this._samplesPerFrame, this._samplesPerSecond);
  }

  _playAudio(audioOutput) {
    const data = this._audioBuffer.getChannelData(0);
    const windowSize = audioOutput.length / this._samplesPerFrame;

    // Downsample.
    for (let i = 0; i < this._samplesPerFrame; i++) {
      data[this._audioBufferIndex] = audioOutput[Math.round(i * windowSize)];
      this._audioBufferIndex = (this._audioBufferIndex + 1) % data.length;

      if (this._audioBufferIndex === 0) {
        this._audioQueue.queue(this._audioBuffer);
        this._audioBuffer = this._createAudioBuffer();
      }
    }
  }

  _playVideo(videoOutput) {
    this._videoContext.putImageData(new ImageData(videoOutput, 256, 240), 0, 0);
  }
}

class AudioQueue {
  constructor(audioContext) {
    this._audioContext = audioContext;
    this._nextPlayTime = 0;
  }

  queue(audioBuffer) {
    const audioBufferSourceNode = this._audioContext.createBufferSource();
    audioBufferSourceNode.buffer = audioBuffer;
    audioBufferSourceNode.connect(this._audioContext.destination);

    if (this._nextPlayTime < this._audioContext.currentTime) {
      this._nextPlayTime = this._audioContext.currentTime + 2/60;
    }
    
    audioBufferSourceNode.start(this._nextPlayTime);
    this._nextPlayTime = this._nextPlayTime + audioBuffer.duration;
  }
}

class Apu {
  constructor() {
    this._cyclesPerFrame = 30000;
    this._audioOutput = new Float32Array(this._cyclesPerFrame);
    this._square1 = null;
    this._square2 = null;
    this._time = 0;
    this._triangle = null;
  }

  power() {
    this._square1 = {
      output: 0,
      period: 0,
      time: 0,
      volume: 0
    };

    this._square2 = {
      output: 0,
      period: 0,
      time: 0,
      volume: 0
    };

    this._time = 0;

    this._triangle = {
      countdown: 0,
      output: 1,
      period: 0,
      time: 0,
      volume: 0
    };
  }
  
  cycle() {
    this._audioOutput[this._time] = (this._square1.output * this._square1.volume
      + this._square2.output * this._square2.volume
      + this._triangle.output * this._triangle.volume);
    
    this._generateSquare1();
    this._generateSquare2();
    this._generateTriangle();
    this._time = (this._time + 1) % this._cyclesPerFrame;    
  }

  getOutput() {
    return this._audioOutput;
  }

  readCpuAddress(address) {
    return 0;
  }

  writeToCpuAddress(address, data) {
    switch (address) {
      case 0x4000:
        this._square1.volume = 0.005 * (data & 0b1111);
        break;
      
      case 0x4002:
        this._square1.period = 8 * ((this._square1.period / 8) & 0b011100000000 | data);
        break;
      
      case 0x4003:
        this._square1.period = 8 * ((this._square1.period / 8) & 0b11111111 | ((data & 0b0111) << 8));
        break;
      
      case 0x4004:
        this._square2.volume = 0.005 * (data & 0b1111);
        break;
      
      case 0x4006:
        this._square2.period = 8 * ((this._square2.period / 8) & 0b011100000000 | data);
        break;
      
      case 0x4007:
        this._square2.period = 8 * ((this._square2.period / 8) & 0b11111111 | ((data & 0b0111) << 8));
        break;
      
      case 0x4008:
        // This case assumes we are playing Mario Bros.
        // Basically, the triangle wave is disabled for most music.
        if (data >> 3 === 1 || data >> 3 === 3) {
          this._square2.volume = 0;
          this._triangle.countdown = 60;
        } else {
          if (data >> 3 !== 7) {
            this._triangle.countdown = 0;
          }
        }
  
        break;
  
      case 0x400a:
        this._triangle.period = 16 * ((this._triangle.period / 16) & 0b011100000000 | data);
        break;
      
      case 0x400b:
        this._triangle.period = 16 * ((this._triangle.period / 16) & 0b11111111 | ((data & 0b0111) << 8));
        break;
    }
  }

  _generateSquare1() {
    if (this._square1.period === 0) {
      this._square1.time = 0;
    } else {
      this._square1.time = (this._square1.time + 1) % (this._square1.period + 1);
    }
  
    if (this._square1.time === 0) {
      this._square1.output = (this._square1.output + 1) % 2;
    }
  }

  _generateSquare2() {
    if (this._square2.period === 0) {
      this._square2.time = 0;
    } else {
      this._square2.time = (this._square2.time + 1) % (this._square2.period + 1);
    }

    if (this._square2.time === 0) {
      this._square2.output = (this._square2.output + 1) % 2;
    }
  }

  _generateTriangle() {
    if (this._triangle.period < 1024) {
      this._triangle.period *= 2;
    }

    if (this._time === 0 && this._triangle.countdown > 0) {
      this._triangle.countdown--;
    }

    if (this._triangle.countdown === 0) {
      this._triangle.volume = 0;
    } else {
      this._triangle.volume = 0.005 * 15 * (1 - Math.abs(this._triangle.period / 2 - this._triangle.time) / (this._triangle.period / 2));
    }

    if (this._triangle.period === 0) {
      this._triangle.time = 0;
    } else {
      this._triangle.time = (this._triangle.time + 1) % (this._triangle.period + 1);
    }
  }
}

class CpuBus {
  constructor(nes) {
    this._dummy = new DummyCpuDevice();
    this._nes = nes;
  }

  readCpuAddress(address) {
    return this._getDevice(address).readCpuAddress(address);
  }

  writeToCpuAddress(address, data) {
    this._getDevice(address).writeToCpuAddress(address, data);
  }

  hasNmi() {
    return this._nes._vpu.hasNmi();
  }

  hasIrq() {
    return false;
  }

  _getDevice(address) {
    if (address >= 0x0000 && address <= 0x07ff) {
      return this._nes._cpuRam;
    }

    if (address >= 0x2000 && address <= 0x2007) {
      return this._nes._vpu;
    }

    if (address >= 0x4000 && address <= 0x400b) {
      return this._nes._apu;
    }

    if (address === 0x4014) {
      return this._nes._spriteCopier;
    }

    if (address >= 0x4016 && address <= 0x4017) {
      return this._nes._ctl;
    }

    if (address >= 0xc000 && address <= 0xffff) {
      return this._nes._rom;
    }
    
    return this._dummy;
  }
}

class DummyCpuDevice {
  readCpuAddress(address) {
    return 0;
  }

  writeToCpuAddress(address, data) {

  }
}

class SpriteCopier {
  constructor(nes) {
    this._nes = nes;
  }

  readCpuAddress(address) {
    return 0;
  }

  writeToCpuAddress(address, data) {
    const page = data;

    for (let i = 0; i < 256; i++) {
      const spriteData = this._nes._cpuBus.readCpuAddress(page << 8 | i);
      this._nes._vpu.writeToCpuAddress(0x2004, spriteData);
    }
  }
}

class Cpu {
  constructor(bus) {
    this._bus = bus;
    this._a = null;
    this._pcr = null;
    this._s = null;
    this._x = null;
    this._y = null;
    this._c = null;
    this._z = null;
    this._i = null;
    this._d = null;
    this._b = null;
    this._v = null;
    this._n = null;
  }

  power() {
    this._a = 0;
    this._pcr = this._read(0xfffc) | this._read(0xfffd) << 8;
    this._s = 0xfd;
    this._x = 0;
    this._y = 0;
    this._c = 0;
    this._z = 0;
    this._i = 0;
    this._d = 0;
    this._b = 0;
    this._v = 0;
    this._n = 0;
  }

  cycle() {
    if (this._hasNmi() || (!this._i && this._hasIrq())) {
      this._b = 0x10;
      this._interrupt();
    }

    const instruction = this._read(this._pcr++);

    switch (instruction) {
      case 0x00:
        this._brk();
        break;
        
      case 0x01:
        this._ora(this._indx());
        break;

      case 0x05:
        this._ora(this._zpg());
        break;

      case 0x06:
        this._asl(this._zpg());
        break;

      case 0x08:
        this._php();
        break;

      case 0x09:
        this._ora(this._imm());
        break;

      case 0x0a:
        this._asla();
        break;

      case 0x0d:
        this._ora(this._abs());
        break;

      case 0x0e:
        this._asl(this._abs());
        break;

      case 0x10:
        this._bpl(this._rel());
        break;

      case 0x11:
        this._ora(this._indy());
        break;

      case 0x15:
        this._ora(this._zpgx());
        break;

      case 0x16:
        this._asl(this._zpgx());
        break;

      case 0x18:
        this._clc();
        break;

      case 0x19:
        this._ora(this._absy());
        break;

      case 0x1d:
        this._ora(this._absx());
        break;

      case 0x1e:
        this._asl(this._absx());
        break;

      case 0x20:
        this._jsr();
        break;

      case 0x21:
        this._and(this._indx());
        break;

      case 0x24:
        this._bit(this._zpg());
        break;

      case 0x25:
        this._and(this._zpg());
        break;

      case 0x26:
        this._rol(this._zpg());
        break;

      case 0x28:
        this._plp();
        break;

      case 0x29:
        this._and(this._imm());
        break;

      case 0x2a:
        this._rola();
        break;

      case 0x2c:
        this._bit(this._abs());
        break;

      case 0x2d:
        this._and(this._abs());
        break;

      case 0x2e:
        this._rol(this._abs());
        break;

      case 0x30:
        this._bmi(this._rel());
        break;

      case 0x31:
        this._and(this._indy());
        break;

      case 0x35:
        this._and(this._zpgx());
        break;

      case 0x36:
        this._rol(this._zpgx());
        break;

      case 0x38:
        this._sec();
        break;

      case 0x39:
        this._and(this._absy());
        break;

      case 0x3d:
        this._and(this._absx());
        break;

      case 0x3e:
        this._rol(this._absx());
        break;

      case 0x40:
        this._rti();
        break;

      case 0x41:
        this._eor(this._indx());
        break;

      case 0x45:
        this._eor(this._zpg());
        break;

      case 0x46:
        this._lsr(this._zpg());
        break;

      case 0x48:
        this._pha();
        break;

      case 0x49:
        this._eor(this._imm());
        break;

      case 0x4a:
        this._lsra();
        break;

      case 0x4c:
        this._jmp();
        break;

      case 0x4d:
        this._eor(this._abs());
        break;

      case 0x4e:
        this._lsr(this._abs());
        break;

      case 0x50:
        this._bvc(this._rel());
        break;

      case 0x51:
        this._eor(this._indy());
        break;

      case 0x55:
        this._eor(this._zpgx());
        break;

      case 0x56:
        this._lsr(this._zpgx());
        break;

      case 0x58:
        this._cli();
        break;

      case 0x59:
        this._eor(this._absy());
        break;

      case 0x5d:
        this._eor(this._absx());
        break;

      case 0x5e:
        this._lsr(this._absx());
        break;

      case 0x60:
        this._rts();
        break;

      case 0x61:
        this._adc(this._indx());
        break;

      case 0x65:
        this._adc(this._zpg());
        break;

      case 0x66:
        this._ror(this._zpg());
        break;

      case 0x68:
        this._pla();
        break;

      case 0x69:
        this._adc(this._imm());
        break;

      case 0x6a:
        this._rora();
        break;

      case 0x6c:
        this._jmpi();
        break;

      case 0x6d:
        this._adc(this._abs());
        break;

      case 0x6e:
        this._ror(this._abs());
        break;

      case 0x70:
        this._bvs(this._rel());
        break;

      case 0x71:
        this._adc(this._indy());
        break;

      case 0x75:
        this._adc(this._zpgx());
        break;

      case 0x76:
        this._ror(this._zpgx());
        break;

      case 0x78:
        this._sei();
        break;

      case 0x79:
        this._adc(this._absy());
        break;

      case 0x7d:
        this._adc(this._absx());
        break;

      case 0x7e:
        this._ror(this._absx());
        break;

      case 0x81:
        this._sta(this._indx());
        break;

      case 0x84:
        this._sty(this._zpg());
        break;

      case 0x85:
        this._sta(this._zpg());
        break;

      case 0x86:
        this._stx(this._zpg());
        break;

      case 0x88:
        this._dey();
        break;

      case 0x8a:
        this._txa();
        break;

      case 0x8c:
        this._sty(this._abs());
        break;

      case 0x8d:
        this._sta(this._abs());
        break;

      case 0x8e:
        this._stx(this._abs());
        break;

      case 0x90:
        this._bcc(this._rel());
        break;

      case 0x91:
        this._sta(this._indy());
        break;

      case 0x94:
        this._sty(this._zpgx());
        break;

      case 0x95:
        this._sta(this._zpgx());
        break;

      case 0x96:
        this._stx(this._zpgy());
        break;

      case 0x98:
        this._tya();
        break;

      case 0x99:
        this._sta(this._absy());
        break;

      case 0x9a:
        this._txs();
        break;

      case 0x9d:
        this._sta(this._absx());
        break;

      case 0xa0:
        this._ldy(this._imm());
        break;

      case 0xa1:
        this._lda(this._indx());
        break;

      case 0xa2:
        this._ldx(this._imm());
        break;

      case 0xa4:
        this._ldy(this._zpg());
        break;

      case 0xa5:
        this._lda(this._zpg());
        break;

      case 0xa6:
        this._ldx(this._zpg());
        break;

      case 0xa8:
        this._tay();
        break;

      case 0xa9:
        this._lda(this._imm());
        break;

      case 0xaa:
        this._tax();
        break;

      case 0xac:
        this._ldy(this._abs());
        break;

      case 0xad:
        this._lda(this._abs());
        break;

      case 0xae:
        this._ldx(this._abs());
        break;

      case 0xb0:
        this._bcs(this._rel());
        break;

      case 0xb1:
        this._lda(this._indy());
        break;

      case 0xb4:
        this._ldy(this._zpgx());
        break;

      case 0xb5:
        this._lda(this._zpgx());
        break;

      case 0xb6:
        this._ldx(this._zpgy());
        break;

      case 0xb8:
        this._clv();
        break;

      case 0xb9:
        this._lda(this._absy());
        break;

      case 0xba:
        this._tsx();
        break;

      case 0xbc:
        this._ldy(this._absx());
        break;

      case 0xbd:
        this._lda(this._absx());
        break;

      case 0xbe:
        this._ldx(this._absy());
        break;

      case 0xc0:
        this._cpy(this._imm());
        break;

      case 0xc1:
        this._cmp(this._indx());
        break;

      case 0xc4:
        this._cpy(this._zpg());
        break;

      case 0xc5:
        this._cmp(this._zpg());
        break;

      case 0xc6:
        this._dec(this._zpg());
        break;

      case 0xc8:
        this._iny();
        break;

      case 0xc9:
        this._cmp(this._imm());
        break;

      case 0xca:
        this._dex();
        break;

      case 0xcc:
        this._cpy(this._abs());
        break;

      case 0xcd:
        this._cmp(this._abs());
        break;

      case 0xce:
        this._dec(this._abs());
        break;

      case 0xd0:
        this._bne(this._rel());
        break;

      case 0xd1:
        this._cmp(this._indy());
        break;

      case 0xd5:
        this._cmp(this._zpgx());
        break;

      case 0xd6:
        this._dec(this._zpgx());
        break;

      case 0xd8:
        this._cld();
        break;

      case 0xd9:
        this._cmp(this._absy());
        break;

      case 0xdd:
        this._cmp(this._absx());
        break;

      case 0xde:
        this._dec(this._absx());
        break;

      case 0xe0:
        this._cpx(this._imm());
        break;

      case 0xe1:
        this._sbc(this._indx());
        break;

      case 0xe4:
        this._cpx(this._zpg());
        break;

      case 0xe5:
        this._sbc(this._zpg());
        break;

      case 0xe6:
        this._inc(this._zpg());
        break;

      case 0xe8:
        this._inx();
        break;

      case 0xe9:
        this._sbc(this._imm());
        break;

      case 0xea:
        this._nop();
        break;

      case 0xec:
        this._cpx(this._abs());
        break;

      case 0xed:
        this._sbc(this._abs());
        break;
      
      case 0xee:
        this._inc(this._abs());
        break;

      case 0xf0:
        this._beq(this._rel());
        break;

      case 0xf1:
        this._sbc(this._indy());
        break;

      case 0xf5:
        this._sbc(this._zpgx());
        break;

      case 0xf6:
        this._inc(this._zpgx());
        break;

      case 0xf8:
        this._sed();
        break;

      case 0xf9:
        this._sbc(this._absy());
        break;

      case 0xfd:
        this._sbc(this._absx());
        break;

      case 0xfe:
        this._inc(this._absx());
        break;
    }
  }

  _read(address) {
    return this._bus.readCpuAddress(address);
  }

  _write(address, data) {
    this._bus.writeToCpuAddress(address, data);
  }

  _hasNmi() {
    return this._bus.hasNmi();
  }

  _hasIrq() {
    return this._bus.hasIrq();
  }

  _interrupt() {
    this._push(this._pcr >> 8);
    this._push(this._pcr & 0xff);
    this._push(this._getFlags());
    this._i = 1;
    this._pcr = this._read(0xfffa) | this._read(0xfffb) << 8;
  }

  _push(data) {
    this._write(0x100 | this._s--, data);
  }

  _pull() {
    return this._read(0x100 | ++this._s);
  }

  _getFlags() {
    return this._c << 0 | this._z << 1 | this._i << 2 | this._d << 3 | this._b << 4 | this._v << 6 | this._n << 7;
  }

  _setFlags(data) {
    this._c = data >> 0 & 1;
    this._z = data >> 1 & 1;
    this._i = data >> 2 & 1;
    this._d = data >> 3 & 1;
    this._b = data >> 4 & 1;
    this._v = data >> 6 & 1;
    this._n = data >> 7 & 1;
  }

  _adc(operandAddress) {
    const a = this._a;
    const m = this._read(operandAddress);
    const c = this._c;
    const r = a + m + c;
    this._a = r & 0xff;
    this._c = r > 0xff;
    this._z = this._a === 0;
    this._v = a >> 7 === m >> 7 && a >> 7 !== (r >> 7 & 1);
    this._n = this._a >> 7;
  }

  _and(operandAddress) {
    const m = this._read(operandAddress);
    this._a &= m;
    this._z = this._a === 0;
    this._n = this._a >> 7;
  }

  _asl(operandAddress) {
    let m = this._read(operandAddress);
    this._c = m >> 7;
    m = m << 1 & 0xff;
    this._write(operandAddress, m);
    this._z = m === 0;
    this._n = m >> 7;
  }

  _asla() {
    this._c = this._a >> 7;
    this._a = this._a << 1 & 0xff;
    this._z = this._a === 0;
    this._n = this._a >> 7;
  }

  _bcc(branchOffset) {
    if (!this._c) {
      this._pcr += branchOffset;
    }
  }

  _bcs(branchOffset) {
    if (this._c) {
      this._pcr += branchOffset;
    }
  }

  _beq(branchOffset) {
    if (this._z) {
      this._pcr += branchOffset;
    }
  }

  _bit(operandAddress) {
    const m = this._read(operandAddress);
    this._z = (this._a & m) === 0;
    this._v = (m >> 6) & 1;
    this._n = m >> 7;
  }

  _bmi(branchOffset) {
    if (this._n) {
      this._pcr += branchOffset;
    }
  }

  _bne(branchOffset) {
    if (!this._z) {
      this._pcr += branchOffset;
    }
  }

  _bpl(branchOffset) {
    if (!this._n) {
      this._pcr += branchOffset;
    }
  }

  _brk() {
    this._b = 11;
    this._interrupt();
  }
  
  _bvc(branchOffset) {
    if (!this._v) {
      this._pcr += branchOffset;
    }
  }

  _bvs(branchOffset) {
    if (this._v) {
      this._pcr += branchOffset;
    }
  }

  _clc() {
    this._c = 0;
  }

  _cld() {
    this._d = 0;
  }

  _cli() {
    this._i = 0;
  }

  _clv() {
    this._v = 0;
  }

  _cmp(operandAddress) {
    const a = this._a;
    const v = this._v;
    this._c = 1;
    this._sbc(operandAddress);
    this._a = a;
    this._v = v;
  }

  _cpx(operandAddress) {
    const a = this._a;
    const v = this._v;
    this._a = this._x;
    this._c = 1;
    this._sbc(operandAddress);
    this._a = a;
    this._v = v;
  }

  _cpy(operandAddress) {
    const a = this._a;
    const v = this._v;
    this._a = this._y;
    this._c = 1;
    this._sbc(operandAddress);
    this._a = a;
    this._v = v;
  }

  _dec(operandAddress) {
    let m = this._read(operandAddress);
    m = (0x100 + m - 1) % 0x100;
    this._write(operandAddress, m);
    this._z = m === 0;
    this._n = m >> 7;
  }

  _dex() {
    this._x = (0x100 + this._x - 1) % 0x100;
    this._z = this._x === 0;
    this._n = this._x >> 7;
  }

  _dey() {
    this._y = (0x100 + this._y - 1) % 0x100;
    this._z = this._y === 0;
    this._n = this._y >> 7;
  }

  _eor(operandAddress) {
    const m = this._read(operandAddress);
    this._a ^= m;
    this._z = this._a === 0;
    this._n = this._a >> 7;
  }

  _inc(operandAddress) {
    let m = this._read(operandAddress);
    m = (m + 1) & 0xff;
    this._write(operandAddress, m);
    this._z = m === 0;
    this._n = m >> 7;
  }

  _inx() {
    this._x = (this._x + 1) & 0xff;
    this._z = this._x === 0;
    this._n = this._x >> 7;
  }

  _iny() {
    this._y = (this._y + 1) & 0xff;
    this._z = this._y === 0;
    this._n = this._y >> 7;
  }

  _jmp() {
    const destination = this._read(this._pcr++) | this._read(this._pcr++) << 8;
    this._pcr = destination;
  }

  _jmpi() {
    const destinationPointerAddress = this._read(this._pcr++) | this._read(this._pcr++) << 8;
    const destination = this._read(destinationPointerAddress) | this._read(destinationPointerAddress + 1) << 8;
    this._pcr = destination;
  }

  _jsr() {
    const destination = this._read(this._pcr++) | this._read(this._pcr++) << 8;
    this._push((0x10000 + this._pcr - 1) % 0x10000 >> 8);
    this._push((0x10000 + this._pcr - 1) % 0x10000 & 0xff);
    this._pcr = destination;
  }

  _lda(operandAddress) {
    const m = this._read(operandAddress);
    this._a = m;
    this._z = this._a === 0;
    this._n = this._a >> 7;
  }

  _ldx(operandAddress) {
    const m = this._read(operandAddress);
    this._x = m;
    this._z = this._x === 0;
    this._n = this._x >> 7;
  }

  _ldy(operandAddress) {
    const m = this._read(operandAddress);
    this._y = m;
    this._z = this._y === 0;
    this._n = this._y >> 7;
  }

  _lsr(operandAddress) {
    let m = this._read(operandAddress);
    this._c = m & 1;
    m >>= 1;
    this._write(operandAddress, m);
    this._z = m === 0;
    this._n = 0;
  }

  _lsra() {
    this._c = this._a & 1;
    this._a >>= 1;
    this._z = this._a === 0;
    this._n = 0;
  }

  _nop() {

  }

  _ora(operandAddress) {
    const m = this._read(operandAddress);
    this._a |= m;
    this._z = this._a === 0;
    this._n = this._a >> 7;
  }

  _pha() {
    this._push(this._a);
  }

  _php() {
    this._b = 0x11;
    this._push(this._getFlags());
  }

  _pla() {
    this._a = this._pull();
    this._z = this._a === 0;
    this._n = this._a >> 7;
  }

  _plp() {
    this._setFlags(this._pull());
  }

  _rol(operandAddress) {
    let m = this._read(operandAddress);
    const c = this._c;
    this._c = m >> 7;
    m = c | m << 1;
    this._write(operandAddress, m);
    this._z = m === 0;
    this._n = m >> 7;
  }

  _rola() {
    const c = this._c;
    this._c = this._a >> 7;
    this._a = c | this._a << 1;
    this._z = this._a === 0;
    this._n = this._a >> 7;
  }

  _ror(operandAddress) {
    let m = this._read(operandAddress);
    const c = this._c;
    this._c = m & 1;
    m = (c << 7) | (m >> 1);
    this._write(operandAddress, m);
    this._z = m === 0;
    this._n = m >> 7;
  }

  _rora() {
    const c = this._c;
    this._c = this._a & 1;
    this._a = (this._a >> 1) | (c << 7);
    this._z = this._a === 0;
    this._n = this._a >> 7;
  }
  
  _rti() {
    this._setFlags(this._pull());
    const destination = this._pull() | this._pull() << 8;
    this._pcr = destination;
  }

  _rts() {
    const destination = this._pull() | this._pull() << 8;
    this._pcr = destination + 1;
  }

  _sbc(operandAddress) {
    // Does adc but negates the operand.
    const a = this._a;
    const m = this._read(operandAddress) ^ 0xff;
    const c = this._c;
    const r = a + m + c;
    this._a = r & 0xff;
    this._c = r > 0xff;
    this._z = this._a === 0;
    this._v = a >> 7 === m >> 7 && a >> 7 !== (r >> 7 & 1);
    this._n = this._a >> 7;
  }

  _sec() {
    this._c = 1;
  }

  _sed() {
    this._d = 1;
  }

  _sei() {
    this._i = 1;
  }

  _sta(operandAddress) {
    this._write(operandAddress, this._a);
  }

  _stx(operandAddress) {
    this._write(operandAddress, this._x);
  }

  _sty(operandAddress) {
    this._write(operandAddress, this._y);
  }

  _tax() {
    this._x = this._a;
    this._z = this._x === 0;
    this._n = this._x >> 7;
  }

  _tay() {
    this._y = this._a;
    this._z = this._y === 0;
    this._n = this._y >> 7;
  }

  _tsx() {
    this._x = this._s;
    this._z = this._x === 0;
    this._n = this._x >> 7;
  }

  _txa() {
    this._a = this._x;
    this._z = this._a === 0;
    this._n = this._a >> 7;
  }

  _txs() {
    this._s = this._x;
  }

  _tya() {
    this._a = this._y;
    this._z = this._a === 0;
    this._n = this._a >> 7;
  }

  _imm() {
    return this._pcr++;
  }

  _abs() {
    return this._read(this._pcr++) | this._read(this._pcr++) << 8;
  }

  _absx() {
    return this._abs() + this._x;
  }

  _absy() {
    return this._abs() + this._y;
  }

  _zpg() {
    return this._read(this._pcr++);
  }

  _zpgx() {
    return (this._zpg() + this._x) & 0xff;
  }

  _zpgy() {
    return (this._zpg() + this._y) & 0xff;
  }

  _rel() {
    return this._read(this._pcr++) << 24 >> 24;
  }

  _indx() {
    const operandPointerAddress = this._zpgx();
    return this._read(operandPointerAddress) | this._read((operandPointerAddress + 1) & 0xff) << 8;
  }

  _indy() {
    const operandPointerAddress = this._zpg();
    return (this._read(operandPointerAddress) | this._read((operandPointerAddress + 1) & 0xff) << 8) + this._y;
  }
}

class CpuRam {
  constructor() {
    this._data = new Uint8Array(0x800);
  }

  readCpuAddress(address) {
    return this._data[address];
  }

  writeToCpuAddress(address, data) {
    this._data[address] = data;
  }
}

class Ctl {
  constructor() {
    this._ctl1 = 0;
    this._ctl2 = 0;
    this._isBeingHeld = {};
    this._isPolling = true;
  }

  holdButton(button) {
    this._isBeingHeld[button] = true;
  }

  releaseButton(button) {
    this._isBeingHeld[button] = false;
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

    if (address === 0x4017) {
      const data = this._ctl2 & 1;
      this._ctl2 >>= 1;
      return data;
    }
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
    this._ctl1 = (this._isBeingHeld[Button.A_1] << 0
      | this._isBeingHeld[Button.B_1] << 1
      | this._isBeingHeld[Button.SELECT_1] << 2
      | this._isBeingHeld[Button.START_1] << 3
      | this._isBeingHeld[Button.UP_1] << 4
      | this._isBeingHeld[Button.DOWN_1] << 5
      | this._isBeingHeld[Button.LEFT_1] << 6
      | this._isBeingHeld[Button.RIGHT_1] << 7);
    
    
    this._ctl2 = (this._isBeingHeld[Button.A_2] << 0
      | this._isBeingHeld[Button.B_2] << 2
      | this._isBeingHeld[Button.SELECT_2] << 2
      | this._isBeingHeld[Button.START_2] << 3
      | this._isBeingHeld[Button.UP_2] << 4
      | this._isBeingHeld[Button.DOWN_2] << 5
      | this._isBeingHeld[Button.LEFT_2] << 6
      | this._isBeingHeld[Button.RIGHT_2] << 7);
  }
}

class Rom {
  constructor(chr, prg) {
    this._chr = chr;
    this._prg = prg;
  }

  readCpuAddress(address) {
    return this._prg[address - 0xc000];
  }

  writeToCpuAddress(address, data) {

  }

  readVpuAddress(address) {
    return this._chr[address];
  }

  writeToVpuAddress(address, data) {

  }
}

class VpuBus {
  constructor(nes) {
    this._dummy = new DummyVpuDevice();
    this._nes = nes;
  }

  readVpuAddress(address) {
    return this._getDevice(address).readVpuAddress(address);
  }

  writeToVpuAddress(address, data) {
    this._getDevice(address).writeToVpuAddress(address, data);
  }

  _getDevice(address) {
    if (address >= 0x0000 && address <= 0x1fff) {
      return this._nes._rom;
    }

    if (address >= 0x2000 && address <= 0x23ff) {
      return this._nes._vpuRam;
    }

    return this._dummy;
  }
}

class DummyVpuDevice {
  constructor() {

  }

  readVpuAddress(address) {
    return 0;
  }

  writeToVpuAddress(address, data) {

  }
}

class Vpu {
  // Video is 256x240, divided into 32x30 8x8 tiles.

  constructor(bus) {
    this._address = null;
    this._bus = bus;
    this._cyclesPerFrame = 30000;
    this._data = null;
    this._hasAddressHighByteBeenRead = null;
    this._hasScrollXBeenRead = null;
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
    this._data = 0;
    this._hasAddressHighByteBeenRead = false;
    this._hasScrollXBeenRead = false;
    this._nmi = false;
    this._scrollX = 0;
    this._scrollY = 0;
    this._spriteAddress = 0;
    this._time = 0;
  }

  cycle() {
    if (this._time === this._nmiTime) {
      this._nmi = true;
      this._updateOutput();
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
        this._hasAddressHighByteBeenRead = false;
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
        if (this._hasScrollXBeenRead) {
          this._scrollY = data;
          this._hasScrollXBeenRead = false;
        } else {
          this._scrollX = data;
          this._hasScrollXBeenRead = true;
        }

        break;
      
      case 0x2006:
        if (this._hasAddressHighByteBeenRead) {
          this._address = (this._address & 0xff00) | data;
          this._hasAddressHighByteBeenRead = false;
        } else {
          this._address = (this._address & 0xff) | (data << 8);
          this._hasAddressHighByteBeenRead = true;
        }
        
        break;

      case 0x2007:
        this._write(this._address++, data);
        break;
    }
  }

  hasNmi() {
    return this._nmi;
  }

  _updateOutput() {
    for (let tileX = 0; tileX < 32; tileX++) {
      for (let tileY = 0; tileY < 30; tileY++) {
        this._drawTile(tileX, tileY);
      }
    }

    for (let spriteIndex = 0; spriteIndex < 64; spriteIndex++) {
      this._drawSprite(spriteIndex);
    }
  }

  _drawTile(tileX, tileY) {
    const tilePatternIndex = this._read(0x2000 + 32 * tileY + tileX);
    const pattern = this._getTilePattern(tilePatternIndex);
    const palette = this._getTilePalette(tilePatternIndex);

    for (let dPixelX = 0; dPixelX < 8; dPixelX++) {
      for (let dPixelY = 0; dPixelY < 8; dPixelY++) {
        const pixelX = 8 * tileX + dPixelX + this._scrollX;
        const pixelY = 8 * tileY + dPixelY - this._scrollY;
        const colorIndex = pattern[8 * dPixelY + dPixelX];
        const color = palette[colorIndex];

        if (pixelX >= 0 && pixelX < 256 && pixelY >= 0 && pixelY < 240) {
          this._videoOutput.set(color, 4 * (256 * pixelY + pixelX));
        }
      }
    }
  }

  _getTilePattern(tilePatternIndex) {
    return this._getPattern(1, tilePatternIndex);
  }

  _getPattern(page, index) {
    const pattern = new Uint8Array(64);

    for (let dPixelY = 0; dPixelY < 8; dPixelY++) {
      const rowColorIndicesLowBits = this._read(0x1000 * page + (index << 4 | dPixelY));
      const rowColorIndicesHighBits = this._read(0x1000 * page + (index << 4 | (dPixelY + 8)));

      for (let dPixelX = 0; dPixelX < 8; dPixelX++) {
        const colorIndexLowBit = rowColorIndicesLowBits >> (7 - dPixelX) & 1;
        const colorIndexHighBit = rowColorIndicesHighBits >> (7 - dPixelX) & 1;
        const colorIndex = colorIndexLowBit | colorIndexHighBit << 1;
        pattern[8 * dPixelY + dPixelX] = colorIndex;
      }
    }

    return pattern;
  }

  _getTilePalette(tilePatternIndex) {
    // This code assumes we are playing Mario Bros.
    // The blue palette is for ice.
    if (tilePatternIndex === 0x97 || (tilePatternIndex >= 0xe8 && tilePatternIndex <= 0xf9)) {
      return Palette.BLUE;
    }

    return Palette.RED;
  }

  _drawSprite(spriteIndex) {
    const spriteAddress = 4 * spriteIndex;
    const spriteY = this._spriteData[spriteAddress] + 1;
    const spritePatternIndex = this._spriteData[spriteAddress + 1];
    const spritePaletteIndex = this._spriteData[spriteAddress + 2] & 0b11;
    const shouldFlipHorizontally = this._spriteData[spriteAddress + 2] >> 6 & 1;
    const spriteIsBehindBackground = this._spriteData[spriteAddress + 2] >> 5 & 1;
    const spriteX = this._spriteData[spriteAddress + 3];
    const pattern = this._getSpritePattern(spritePatternIndex);
    const palette = this._getSpritePalette(spritePatternIndex, spritePaletteIndex);

    
    for (let dPixelX = 0; dPixelX < 8; dPixelX++) {
      for (let dPixelY = 0; dPixelY < 8; dPixelY++) {
        const colorIndex = pattern[8 * dPixelY + dPixelX];

        if (colorIndex === 0) {
          continue;
        }

        const pixelX = spriteX + (shouldFlipHorizontally ? (7 - dPixelX) : dPixelX);
        const pixelY = spriteY + dPixelY;

        if (spriteIsBehindBackground) {
          const videoOutputIndex = 4 * (256 * pixelY + pixelX);
          const backgroundRed = this._videoOutput[videoOutputIndex];
          const backgroundGreen = this._videoOutput[videoOutputIndex + 1];
          const backgroundBlue = this._videoOutput[videoOutputIndex + 2];
          const backgroundIsNotBlack = backgroundRed !== 0 || backgroundGreen !== 0 || backgroundBlue !== 0;

          if (backgroundIsNotBlack) {
            continue;
          }
        }

        const color = palette[colorIndex];

        if (pixelX < 256 && pixelY < 240) {
          this._videoOutput.set(color, 4 * (256 * pixelY + pixelX));
        }
      }
    }
  }

  _getSpritePattern(spritePatternIndex) {
    return this._getPattern(0, spritePatternIndex);
  }

  _getSpritePalette(spritePatternIndex, spritePaletteIndex) {
    // This function assumes we are playing Mario Bros.
    const pat = spritePatternIndex;
    const pal = spritePaletteIndex;

    if (pat === 0xee) {
      // asterisk on the title sequence
      return Palette.MONOCHROME_ORANGE;
    }

    if ((pal === 1 && (pat >= 0x00 && pat <= 0x3d || pat === 0xdf))) {
      // Luigi
      return Palette.GREEN;
    }

    if ((pat >= 0x8a && pat <= 0x91) || (pat >= 0xe8 && pat <= 0xf2) || (pat >= 0x68 && pat <= 0x6b)) {
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

class VpuRam {
  constructor() {
    this._backgroundData = new Uint8Array(0x400);
  }

  readVpuAddress(address) {
    return this._backgroundData[address - 0x2000];
  }

  writeToVpuAddress(address, data) {
    this._backgroundData[address - 0x2000] = data;
  }
}
