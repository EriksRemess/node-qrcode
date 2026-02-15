import { test } from 'node:test'
import assert from 'node:assert/strict'
import ECLevel from '#lib/core/error-correction-level'
import Version from '#lib/core/version'
import QRCode from '#lib/core/qrcode'
import toSJIS from '#helper/to-sjis'
test('QRCode interface', (t) => {
  assert.strictEqual(typeof QRCode.create, 'function', 'Should have "create" function')
  assert.throws(() => { QRCode.create() }, 'Should throw if no data is provided')
  assert.doesNotThrow(() => { QRCode.create('1234567') }, 'Should not throw')

  let qr = QRCode.create('a123456A', {
    version: 1,
    maskPattern: 1,
    errorCorrectionLevel: 'H'
  })
  assert.strictEqual(qr.modules.size, 21, 'Should return correct modules count')
  assert.strictEqual(qr.maskPattern, 1, 'Should return correct mask pattern')

  const darkModule = qr.modules.get(qr.modules.size - 8, 8)
  assert.ok(darkModule, 'Should have a dark module at coords [size-8][8]')

  assert.throws(() => {
    qr = QRCode.create({})
  }, 'Should throw if invalid data is passed')

  assert.doesNotThrow(() => {
    qr = QRCode.create('AAAAA00000', { version: 5 })
  }, 'Should accept data as string')

  assert.doesNotThrow(() => {
    qr = QRCode.create([
      { data: 'ABCDEFG', mode: 'alphanumeric' },
      { data: 'abcdefg' },
      { data: '晒三', mode: 'kanji' },
      { data: '0123456', mode: 'numeric' }
    ], { toSJISFunc: toSJIS })
  }, 'Should accept data as array of objects')

  assert.doesNotThrow(() => {
    qr = QRCode.create('AAAAA00000', { errorCorrectionLevel: 'quartile' })
    qr = QRCode.create('AAAAA00000', { errorCorrectionLevel: 'q' })
  }, 'Should accept errorCorrectionLevel as string')
})

test('QRCode error correction', (t) => {
  let qr
  const ecValues = [
    { name: ['l', 'low'], level: ECLevel.L },
    { name: ['m', 'medium'], level: ECLevel.M },
    { name: ['q', 'quartile'], level: ECLevel.Q },
    { name: ['h', 'high'], level: ECLevel.H }
  ]

  for (let l = 0; l < ecValues.length; l++) {
    for (let i = 0; i < ecValues[l].name.length; i++) {
      assert.doesNotThrow(() => {
        qr = QRCode.create('ABCDEFG', { errorCorrectionLevel: ecValues[l].name[i] })
      }, 'Should accept errorCorrectionLevel value: ' + ecValues[l].name[i])

      assert.deepStrictEqual(qr.errorCorrectionLevel, ecValues[l].level,
        'Should have correct errorCorrectionLevel value')

      assert.doesNotThrow(() => {
        qr = QRCode.create('ABCDEFG', { errorCorrectionLevel: ecValues[l].name[i].toUpperCase() })
      }, 'Should accept errorCorrectionLevel value: ' + ecValues[l].name[i].toUpperCase())

      assert.deepStrictEqual(qr.errorCorrectionLevel, ecValues[l].level,
        'Should have correct errorCorrectionLevel value')
    }
  }

  qr = QRCode.create('ABCDEFG')
  assert.strictEqual(qr.errorCorrectionLevel, ECLevel.M, 'Should set default EC level to M')
})

test('QRCode version', (t) => {
  let qr = QRCode.create('data', { version: 9, errorCorrectionLevel: ECLevel.M })

  assert.strictEqual(qr.version, 9, 'Should create qrcode with correct version')
  assert.strictEqual(qr.errorCorrectionLevel, ECLevel.M, 'Should set correct EC level')

  assert.throws(() => {
    qr = QRCode.create('a'.repeat(Version.getCapacity(2, ECLevel.H) - 1),
      { version: 1, errorCorrectionLevel: ECLevel.H })
  }, 'Should throw if data cannot be contained with chosen version')

  assert.throws(() => {
    qr = QRCode.create('a'.repeat(Version.getCapacity(40, ECLevel.H) + 1),
      { version: 40, errorCorrectionLevel: ECLevel.H })
  }, 'Should throw if data cannot be contained in a qr code')

  assert.doesNotThrow(() => {
    qr = QRCode.create('abcdefg', { version: 'invalid' })
  }, 'Should use best version if the one provided is invalid')
})

test('QRCode capacity', (t) => {
  let qr

  qr = QRCode.create([{ data: 'abcdefg', mode: 'byte' }])
  assert.strictEqual(qr.version, 1, 'Should contain 7 byte characters')

  qr = QRCode.create([{ data: '12345678901234567', mode: 'numeric' }])
  assert.strictEqual(qr.version, 1, 'Should contain 17 numeric characters')

  qr = QRCode.create([{ data: 'ABCDEFGHIL', mode: 'alphanumeric' }])
  assert.strictEqual(qr.version, 1, 'Should contain 10 alphanumeric characters')

  qr = QRCode.create([{ data: 'ＡＩぐサ', mode: 'kanji' }],
    { toSJISFunc: toSJIS })
  assert.strictEqual(qr.version, 1, 'Should contain 4 kanji characters')
})
