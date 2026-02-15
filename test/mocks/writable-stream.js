import stream from 'node:stream'

export default class WritableStream extends stream.Writable {
  constructor () {
    super()
    this.forceError = false

    this.once('finish', () => {
      this.close()
    })
  }

  _write (data, encoding, cb) {
    if (this.forceError) this.emit('error', new Error('Fake error'))
    cb(this.forceError || null)
  }

  close (cb) {
    this.emit('close')
    if (cb) cb()
  }

  forceErrorOnWrite () {
    this.forceError = true
    return this
  }
}
