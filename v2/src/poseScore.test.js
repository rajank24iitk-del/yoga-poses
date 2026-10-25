import test from 'node:test'
import assert from 'node:assert/strict'
import { scoreAsana } from './poseScore.js'

function marks(spots) {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.1 }))
  Object.entries(spots).forEach(([index, spot]) => {
    landmarks[index] = { x: spot[0], y: spot[1], visibility: 0.95 }
  })
  return landmarks
}

const chair = marks({
  0: [0.5, 0.14],
  11: [0.42, 0.28], 12: [0.58, 0.28],
  13: [0.44, 0.16], 14: [0.56, 0.16],
  15: [0.46, 0.05], 16: [0.54, 0.05],
  23: [0.46, 0.5], 24: [0.54, 0.5],
  25: [0.32, 0.64], 26: [0.68, 0.64],
  27: [0.46, 0.9], 28: [0.54, 0.9],
})

const cobra = marks({
  0: [0.22, 0.28],
  11: [0.28, 0.42], 12: [0.32, 0.44],
  13: [0.26, 0.58], 14: [0.3, 0.6],
  15: [0.22, 0.7], 16: [0.26, 0.72],
  23: [0.48, 0.62], 24: [0.52, 0.64],
  25: [0.7, 0.68], 26: [0.74, 0.7],
  27: [0.9, 0.72], 28: [0.94, 0.74],
})

const dog = marks({
  0: [0.18, 0.62],
  11: [0.28, 0.58], 12: [0.34, 0.6],
  13: [0.2, 0.68], 14: [0.26, 0.7],
  15: [0.12, 0.78], 16: [0.18, 0.8],
  23: [0.55, 0.3], 24: [0.62, 0.32],
  25: [0.78, 0.55], 26: [0.84, 0.57],
  27: [0.92, 0.78], 28: [0.96, 0.8],
})

const warrior = marks({
  0: [0.1, 0.4],
  11: [0.28, 0.46], 12: [0.32, 0.48],
  13: [0.16, 0.44], 14: [0.18, 0.46],
  15: [0.04, 0.42], 16: [0.06, 0.44],
  23: [0.48, 0.5], 24: [0.52, 0.48],
  25: [0.48, 0.7], 26: [0.74, 0.46],
  27: [0.48, 0.92], 28: [0.92, 0.44],
})

const shoulderstand = marks({
  0: [0.28, 0.78],
  11: [0.4, 0.7], 12: [0.58, 0.72],
  13: [0.36, 0.58], 14: [0.62, 0.6],
  15: [0.46, 0.5], 16: [0.54, 0.52],
  23: [0.46, 0.42], 24: [0.56, 0.44],
  25: [0.48, 0.22], 26: [0.54, 0.24],
  27: [0.48, 0.06], 28: [0.54, 0.08],
})

const triangle = marks({
  0: [0.34, 0.48],
  11: [0.3, 0.62], 12: [0.52, 0.38],
  13: [0.26, 0.74], 14: [0.56, 0.28],
  15: [0.22, 0.82], 16: [0.6, 0.14],
  23: [0.36, 0.55], 24: [0.58, 0.5],
  25: [0.28, 0.72], 26: [0.74, 0.7],
  27: [0.12, 0.9], 28: [0.9, 0.88],
})

test('each asana matches its own picture and not a hidden body', () => {
  for (const [id, body] of [
    ['chair', chair],
    ['cobra', cobra],
    ['warrior', warrior],
    ['dog', dog],
    ['shoulderstand', shoulderstand],
    ['triangle', triangle],
  ]) {
    assert.equal(scoreAsana(id, body).matched, true, id)
    assert.equal(scoreAsana(id, null).visible, false, id)
  }
})

test('the shapes stay distinct', () => {
  assert.equal(scoreAsana('tree', chair).matched, false)
  assert.equal(scoreAsana('dog', cobra).matched, false)
  assert.equal(scoreAsana('cobra', dog).matched, false)
  assert.equal(scoreAsana('chair', warrior).matched, false)
  assert.equal(scoreAsana('triangle', chair).matched, false)
  assert.equal(scoreAsana('shoulderstand', dog).matched, false)
})

const prayer = marks({
  0: [0.5, 0.12],
  11: [0.42, 0.26], 12: [0.58, 0.26],
  13: [0.38, 0.4], 14: [0.62, 0.4],
  15: [0.49, 0.36], 16: [0.51, 0.36],
  23: [0.46, 0.52], 24: [0.54, 0.52],
  25: [0.46, 0.72], 26: [0.54, 0.72],
  27: [0.46, 0.92], 28: [0.54, 0.92],
})

const raised = marks({
  0: [0.5, 0.14],
  11: [0.42, 0.28], 12: [0.58, 0.28],
  13: [0.4, 0.16], 14: [0.6, 0.16],
  15: [0.4, 0.04], 16: [0.6, 0.04],
  23: [0.46, 0.52], 24: [0.54, 0.52],
  25: [0.46, 0.72], 26: [0.54, 0.72],
  27: [0.46, 0.92], 28: [0.54, 0.92],
})

const fold = marks({
  0: [0.3, 0.7],
  11: [0.36, 0.55], 12: [0.4, 0.57],
  13: [0.3, 0.7], 14: [0.34, 0.72],
  15: [0.3, 0.85], 16: [0.34, 0.87],
  23: [0.56, 0.38], 24: [0.6, 0.4],
  25: [0.58, 0.62], 26: [0.62, 0.64],
  27: [0.58, 0.88], 28: [0.62, 0.9],
})

const lunge = marks({
  0: [0.2, 0.42],
  11: [0.3, 0.52], 12: [0.34, 0.54],
  13: [0.24, 0.66], 14: [0.28, 0.68],
  15: [0.2, 0.8], 16: [0.24, 0.82],
  23: [0.45, 0.62], 24: [0.5, 0.64],
  25: [0.28, 0.66], 26: [0.7, 0.76],
  27: [0.26, 0.82], 28: [0.9, 0.82],
})

const plank = marks({
  0: [0.14, 0.52],
  11: [0.24, 0.58], 12: [0.28, 0.6],
  13: [0.22, 0.7], 14: [0.26, 0.72],
  15: [0.2, 0.82], 16: [0.24, 0.84],
  23: [0.52, 0.64], 24: [0.56, 0.66],
  25: [0.72, 0.72], 26: [0.76, 0.74],
  27: [0.92, 0.82], 28: [0.96, 0.84],
})

const eight = marks({
  0: [0.12, 0.7],
  11: [0.22, 0.68], 12: [0.26, 0.7],
  13: [0.26, 0.78], 14: [0.3, 0.8],
  15: [0.28, 0.7], 16: [0.32, 0.72],
  23: [0.5, 0.56], 24: [0.54, 0.58],
  25: [0.64, 0.8], 26: [0.68, 0.82],
  27: [0.86, 0.84], 28: [0.9, 0.86],
})

test('the six Surya Namaskar shapes match their own pictures', () => {
  for (const [id, body] of [
    ['pranamasana', prayer],
    ['hasta_uttanasana', raised],
    ['padahastasana', fold],
    ['ashwa_sanchalanasana', lunge],
    ['kumbhakasana', plank],
    ['ashtanga_namaskara', eight],
  ]) {
    assert.equal(scoreAsana(id, body).matched, true, id)
    assert.equal(scoreAsana(id, null).visible, false, id)
  }
})

test('Surya shapes do not pass for each other', () => {
  assert.equal(scoreAsana('pranamasana', raised).matched, false)
  assert.equal(scoreAsana('hasta_uttanasana', prayer).matched, false)
  assert.equal(scoreAsana('kumbhakasana', eight).matched, false)
  assert.equal(scoreAsana('ashtanga_namaskara', plank).matched, false)
  assert.equal(scoreAsana('padahastasana', prayer).matched, false)
  assert.equal(scoreAsana('ashwa_sanchalanasana', plank).matched, false)
  assert.equal(scoreAsana('kumbhakasana', cobra).matched, false)
})
