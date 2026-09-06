import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Writable } from 'node:stream'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import jsQR from 'jsqr'
import { PNG } from '@eriksremess/pngjs'
import QRCode from '#lib/index'
import toSJIS from '#helper/to-sjis'
import BitBuffer from '#lib/core/bit-buffer'

const execFileAsync = promisify(execFile)

async function decode(data, options) {
  const png = PNG.sync.read(await QRCode.toBuffer(data, options))
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
  assert.ok(result, 'PNG must decode')
  return result
}

test('SVG rejects markup and nonfinite dimensions', async () => {
  const payload = '"><script>alert(1)</script><path d="'
  for (const name of ['margin', 'width', 'scale']) {
    for (const value of [payload, '4', NaN, Infinity, -Infinity, {}, []]) {
      await assert.rejects(QRCode.toString('test', { type: 'svg', [name]: value }),
        new RegExp(name + ' must be a finite number'))
    }
  }
  await assert.rejects(QRCode.toBuffer('test', { scale: -1 }), /scale must be nonnegative/)
})

test('zero scale preserves default PNG and SVG output', async () => {
  assert.deepEqual(await QRCode.toBuffer('test', { scale: 0 }), await QRCode.toBuffer('test'))
  assert.equal(await QRCode.toString('test', { type: 'svg', scale: 0 }),
    await QRCode.toString('test', { type: 'svg' }))
})

test('PNG encoding failures reject buffer and data URL promises', async () => {
  const options = { rendererOpts: { filterType: 99 } }
  await assert.rejects(QRCode.toBuffer('test', options), /filter/i)
  await assert.rejects(QRCode.toDataURL('test', options), /filter/i)
})

test('PNG file output rejects invalid paths', async () => {
  await assert.rejects(QRCode.toFile('invalid\0.png', 'test'), /null bytes/)
})

test('PNG validation and encoding failures preserve existing files', async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qrcode-regression-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const dest = path.join(dir, 'existing.png')
  const original = Buffer.from('original contents')
  await writeFile(dest, original)
  for (const options of [{ shape: 'invalid' }, { color: { dark: 'invalid' } }, { rendererOpts: { filterType: 99 } }]) {
    await assert.rejects(QRCode.toFile(dest, 'test', options))
    // Allow any accidentally opened write stream to finish opening/truncating.
    await new Promise(resolve => setTimeout(resolve, 20))
    assert.deepEqual(await readFile(dest), original)
  }
})

test('stream promise waits for writes and finalization', async () => {
  const chunks = []
  let finalized = false
  const stream = new Writable({
    write(chunk, encoding, cb) {
      chunks.push(chunk)
      setTimeout(cb, 10)
    },
    final(cb) {
      setTimeout(() => { finalized = true; cb() }, 10)
    }
  })
  await QRCode.toFileStream(stream, 'stream completion')
  assert.equal(finalized, true)
  assert.equal(stream.writableFinished, true)
  assert.ok(PNG.sync.read(Buffer.concat(chunks)).width > 0)
})

test('stream promise rejects encoding, write and premature close errors', async () => {
  const encodingSink = new Writable({ write(chunk, encoding, cb) { cb() } })
  await assert.rejects(QRCode.toFileStream(encodingSink, 'test', { rendererOpts: { filterType: 99 } }), /filter/i)
  assert.equal(encodingSink.destroyed, true)
  const writeSink = new Writable({ write(chunk, encoding, cb) { setTimeout(cb, 5, new Error('write failed')) } })
  await assert.rejects(QRCode.toFileStream(writeSink, 'test'), /write failed/)
  const closeSink = new Writable({ write() { this.destroy() } })
  await assert.rejects(QRCode.toFileStream(closeSink, 'test'), /Premature close/)
})

test('stream output rejects invalid and closed destinations', async () => {
  const closed = new Writable({ write(chunk, encoding, cb) { cb() } })
  closed.end()
  for (const stream of [null, {}, 'invalid', closed]) {
    await assert.rejects(QRCode.toFileStream(stream, 'test'), /writable stream is required/)
  }
})

test('binary segments choose byte mode and preserve bytes', async () => {
  for (const data of [Buffer.from('ABC'), Buffer.from('123'), new Uint8ClampedArray([0, 65, 255]), [65, 66, 67]]) {
    const segments = [{ data }]
    assert.equal(QRCode.create(segments).segments[0].mode.id, 'Byte')
    assert.deepEqual((await decode(segments)).binaryData, Array.from(data))
  }
})

test('Kanji mode preserves all Unicode line separators', async () => {
  const text = 'a\u2028b\u2029c\rd\ne'
  assert.equal((await decode(text, { toSJISFunc: toSJIS })).data, text)
})

test('Kanji converters do not leak into later calls, even after failure', () => {
  const expected = QRCode.create('你好').modules.data
  QRCode.create('漢字', { toSJISFunc: toSJIS })
  assert.deepEqual(QRCode.create('你好').modules.data, expected)
  assert.throws(() => QRCode.create('漢', { toSJISFunc() { throw new Error('conversion failed') } }), /conversion failed/)
  assert.deepEqual(QRCode.create('你好').modules.data, expected)
  for (const toSJISFunc of [false, 0, 'invalid', {}]) {
    assert.throws(() => QRCode.create('test', { toSJISFunc }), /not a valid function/)
  }
})

test('Kanji converters survive nested calls and remain bound to returned segments', () => {
  const expected = QRCode.create('漢字', { toSJISFunc: toSJIS })
  let nested = false
  const actual = QRCode.create('漢字', { toSJISFunc(char) {
    if (!nested) {
      nested = true
      QRCode.create('漢', { toSJISFunc: () => toSJIS('字') })
    }
    return toSJIS(char)
  } })
  assert.deepEqual(actual.modules.data, expected.modules.data)
  QRCode.create('漢', { toSJISFunc: () => toSJIS('字') })
  const expectedBits = new BitBuffer()
  const actualBits = new BitBuffer()
  expected.segments[0].write(expectedBits)
  actual.segments[0].write(actualBits)
  assert.deepEqual(actualBits.buffer, expectedBits.buffer)
})

test('all public renderers work without a supported native target', async () => {
  const entry = new URL('../../lib/index.js', import.meta.url).href
  await execFileAsync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict'
    Object.defineProperty(process, 'platform', { value: 'win32' })
    const { default: QRCode } = await import(${JSON.stringify(entry)})
    const { PNG } = await import('@eriksremess/pngjs')
    const { default: jsQR } = await import('jsqr')
    assert.ok(QRCode.create('portable').modules.size > 0)
    assert.match(await QRCode.toString('portable', { type: 'svg' }), /<svg/)
    assert.ok((await QRCode.toString('portable')).length > 0)
    const png = PNG.sync.read(await QRCode.toBuffer('portable'))
    assert.equal(jsQR(new Uint8ClampedArray(png.data), png.width, png.height).data, 'portable')
    await assert.rejects(QRCode.toDataURL('test', { rendererOpts: { filterType: 99 } }))
  `], { cwd: new URL('../..', import.meta.url), timeout: 10000 })
})
