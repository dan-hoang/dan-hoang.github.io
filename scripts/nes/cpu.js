class Cpu {
  constructor(cpuBus) {
    this._cpuBus = cpuBus;
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
      case 0:
        this._brk();
        break;
        
      case 1:
        this._ora(this._indx());
        break;

      case 5:
        this._ora(this._zpg());
        break;

      case 6:
        this._asl(this._zpg());
        break;

      case 8:
        this._php();
        break;

      case 9:
        this._ora(this._imm());
        break;

      case 0xa:
        this._asla();
        break;

      case 0xd:
        this._ora(this._abs());
        break;

      case 0xe:
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
    return this._cpuBus.read(address);
  }

  _write(address, data) {
    this._cpuBus.write(address, data);
  }

  _hasNmi() {
    return this._cpuBus.hasNmi();
  }

  _hasIrq() {
    return this._cpuBus.hasIrq();
  }

  _interrupt() {
    this._push(this._pcr >> 8);
    this._push(this._pcr & 0xff);
    this._push(this._getFlags());
    this._i = 1;
    this._pcr = this._hasNmi() ? this._read(0xfffa) | this._read(0xfffb) << 8 : this._read(0xfffe) | this._read(0xffff) << 8;
  }

  _push(data) {
    this._write(0x100 | this._s--, data);
  }

  _pull() {
    return this._read(0x100 | ++this._s);
  }

  _getFlags() {
    return this._c | this._z << 1 | this._i << 2 | this._d << 3 | this._b << 4 | this._v << 6 | this._n << 7;
  }

  _setFlags(data) {
    this._c = data & 1;
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
    m = c << 7 | m >> 1;
    this._write(operandAddress, m);
    this._z = m === 0;
    this._n = m >> 7;
  }

  _rora() {
    const c = this._c;

    this._c = this._a & 1;
    this._a = this._a >> 1 | c << 7;
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

    return this._read(operandPointerAddress) | this._read(operandPointerAddress + 1 & 0xff) << 8;
  }

  _indy() {
    const operandPointerAddress = this._zpg();

    return (this._read(operandPointerAddress) | this._read(operandPointerAddress + 1 & 0xff) << 8) + this._y;
  }
}

export {Cpu};