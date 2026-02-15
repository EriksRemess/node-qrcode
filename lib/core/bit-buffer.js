function BitBuffer () {
  this.buffer = []
  this.length = 0
}

BitBuffer.prototype = {

  get: function (index) {
    const bufIndex = index >> 3
    return ((this.buffer[bufIndex] >>> (7 - (index & 7))) & 1) === 1
  },

  put: function (num, length) {
    for (let i = length - 1; i >= 0; i--) {
      this.putBit(((num >>> i) & 1) === 1)
    }
  },

  getLengthInBits: function () {
    return this.length
  },

  putBit: function (bit) {
    const bufIndex = this.length >> 3
    if ((this.length & 7) === 0) {
      this.buffer.push(0)
    }

    if (bit) {
      this.buffer[bufIndex] |= (0x80 >>> (this.length & 7))
    }

    this.length++
  }
}

export default BitBuffer;
