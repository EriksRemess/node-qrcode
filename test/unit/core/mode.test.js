import { test } from 'node:test'
import assert from 'node:assert/strict'
import Mode from '#lib/core/mode'
test('Mode bits', (t) => {
  const EXPECTED_BITS = {
    numeric: 1,
    alphanumeric: 2,
    byte: 4,
    kanji: 8,
    mixed: -1
  }

  assert.strictEqual(Mode.NUMERIC.bit, EXPECTED_BITS.numeric)
  assert.strictEqual(Mode.ALPHANUMERIC.bit, EXPECTED_BITS.alphanumeric)
  assert.strictEqual(Mode.BYTE.bit, EXPECTED_BITS.byte)
  assert.strictEqual(Mode.KANJI.bit, EXPECTED_BITS.kanji)
  assert.strictEqual(Mode.MIXED.bit, EXPECTED_BITS.mixed)
})

test('Char count bits', (t) => {
  const EXPECTED_BITS = {
    numeric: [10, 12, 14],
    alphanumeric: [9, 11, 13],
    byte: [8, 16, 16],
    kanji: [8, 10, 12]
  }

  let v
  for (v = 1; v < 10; v++) {
    assert.strictEqual(Mode.getCharCountIndicator(Mode.NUMERIC, v), EXPECTED_BITS.numeric[0])
    assert.strictEqual(Mode.getCharCountIndicator(Mode.ALPHANUMERIC, v), EXPECTED_BITS.alphanumeric[0])
    assert.strictEqual(Mode.getCharCountIndicator(Mode.BYTE, v), EXPECTED_BITS.byte[0])
    assert.strictEqual(Mode.getCharCountIndicator(Mode.KANJI, v), EXPECTED_BITS.kanji[0])
  }

  for (v = 10; v < 27; v++) {
    assert.strictEqual(Mode.getCharCountIndicator(Mode.NUMERIC, v), EXPECTED_BITS.numeric[1])
    assert.strictEqual(Mode.getCharCountIndicator(Mode.ALPHANUMERIC, v), EXPECTED_BITS.alphanumeric[1])
    assert.strictEqual(Mode.getCharCountIndicator(Mode.BYTE, v), EXPECTED_BITS.byte[1])
    assert.strictEqual(Mode.getCharCountIndicator(Mode.KANJI, v), EXPECTED_BITS.kanji[1])
  }

  for (v = 27; v <= 40; v++) {
    assert.strictEqual(Mode.getCharCountIndicator(Mode.NUMERIC, v), EXPECTED_BITS.numeric[2])
    assert.strictEqual(Mode.getCharCountIndicator(Mode.ALPHANUMERIC, v), EXPECTED_BITS.alphanumeric[2])
    assert.strictEqual(Mode.getCharCountIndicator(Mode.BYTE, v), EXPECTED_BITS.byte[2])
    assert.strictEqual(Mode.getCharCountIndicator(Mode.KANJI, v), EXPECTED_BITS.kanji[2])
  }

  assert.throws(() => { Mode.getCharCountIndicator({}, 1) },
    'Should throw if mode is invalid')

  assert.throws(() => { Mode.getCharCountIndicator(Mode.BYTE, 0) },
    'Should throw if version is invalid')
})

test('Best mode', (t) => {
  const EXPECTED_MODE = {
    '12345': Mode.NUMERIC,
    'abcde': Mode.BYTE,
    '1234a': Mode.BYTE,
    'ABCDa': Mode.BYTE,
    'ABCDE': Mode.ALPHANUMERIC,
    '12ABC': Mode.ALPHANUMERIC,
    '乂ЁЖぞβ': Mode.KANJI,
    'ΑΒΓψωЮЯабв': Mode.KANJI,
    '皿a晒三': Mode.BYTE
  }

  Object.keys(EXPECTED_MODE).forEach((data) => {
    assert.strictEqual(Mode.getBestModeForData(data), EXPECTED_MODE[data],
      'Should return mode ' + Mode.toString(EXPECTED_MODE[data]) + ' for data: ' + data)
  })
})

test('Is valid', (t) => {
  assert.ok(Mode.isValid(Mode.NUMERIC))
  assert.ok(Mode.isValid(Mode.ALPHANUMERIC))
  assert.ok(Mode.isValid(Mode.BYTE))
  assert.ok(Mode.isValid(Mode.KANJI))

  assert.ok(!Mode.isValid(undefined))
  assert.ok(!Mode.isValid({ bit: 1 }))
  assert.ok(!Mode.isValid({ ccBits: [] }))
})

test('From value', (t) => {
  const modes = [
    { name: 'numeric', mode: Mode.NUMERIC },
    { name: 'alphanumeric', mode: Mode.ALPHANUMERIC },
    { name: 'kanji', mode: Mode.KANJI },
    { name: 'byte', mode: Mode.BYTE }
  ]

  for (let m = 0; m < modes.length; m++) {
    assert.strictEqual(Mode.from(modes[m].name), modes[m].mode)
    assert.strictEqual(Mode.from(modes[m].name.toUpperCase()), modes[m].mode)
    assert.strictEqual(Mode.from(modes[m].mode), modes[m].mode)
  }

  assert.strictEqual(Mode.from('', Mode.NUMERIC), Mode.NUMERIC,
    'Should return default value if mode is invalid')

  assert.strictEqual(Mode.from(null, Mode.NUMERIC), Mode.NUMERIC,
    'Should return default value if mode undefined')
})

test('To string', (t) => {
  assert.strictEqual(Mode.toString(Mode.NUMERIC), 'Numeric')
  assert.strictEqual(Mode.toString(Mode.ALPHANUMERIC), 'Alphanumeric')
  assert.strictEqual(Mode.toString(Mode.BYTE), 'Byte')
  assert.strictEqual(Mode.toString(Mode.KANJI), 'Kanji')

  assert.throws(() => { Mode.toString({}) }, 'Should throw if mode is invalid')
})
