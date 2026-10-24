import test from 'node:test'
import assert from 'node:assert/strict'
import { scoreTree, stepHold, HOLD_MS } from './treeScore.js'

function body() {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.1 }))
  const put = (index, x, y) => {
    landmarks[index] = { x, y, visibility: 0.95 }
  }
  put(0, 0.5, 0.16)
  put(11, 0.42, 0.32)
  put(12, 0.58, 0.32)
  put(13, 0.44, 0.2)
  put(14, 0.56, 0.2)
  put(15, 0.47, 0.06)
  put(16, 0.53, 0.06)
  put(23, 0.46, 0.55)
  put(24, 0.54, 0.55)
  put(25, 0.46, 0.72)
  put(26, 0.72, 0.6)
  put(27, 0.46, 0.9)
  put(28, 0.48, 0.7)
  return landmarks
}

test('a clear tree pose matches', () => {
  const result = scoreTree(body())
  assert.equal(result.visible, true)
  assert.equal(result.matched, true)
})

test('arms down are not the tree', () => {
  const landmarks = body()
  landmarks[15] = { x: 0.38, y: 0.48, visibility: 0.95 }
  landmarks[16] = { x: 0.62, y: 0.48, visibility: 0.95 }
  landmarks[13] = { x: 0.4, y: 0.4, visibility: 0.95 }
  landmarks[14] = { x: 0.6, y: 0.4, visibility: 0.95 }
  assert.equal(scoreTree(landmarks).matched, false)
})

test('two straight legs are not the tree', () => {
  const landmarks = body()
  landmarks[26] = { x: 0.54, y: 0.72, visibility: 0.95 }
  landmarks[28] = { x: 0.54, y: 0.9, visibility: 0.95 }
  assert.equal(scoreTree(landmarks).matched, false)
})

test('the hold counts only while the pose stays matched', () => {
  let state = stepHold(0, 0, true, 1000)
  assert.equal(state.holdMs, 1000)
  state = stepHold(state.holdMs, state.missMs, false, 200)
  assert.equal(state.holdMs, 1000)
  state = stepHold(state.holdMs, state.missMs, false, 300)
  assert.equal(state.holdMs, 0)
  state = stepHold(8000, 0, true, 3000)
  assert.equal(state.done, true)
  assert.equal(state.holdMs, HOLD_MS)
  state = stepHold(4000, 0, true, 2000, 20000)
  assert.equal(state.done, false)
  assert.equal(state.holdMs, 6000)
})
