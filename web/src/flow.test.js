import assert from 'node:assert/strict'
import test from 'node:test'
import { HOLD_MS, TRANSITION_MS, startFlow, stepFlow, stepHold } from './flow.js'

test('a broken pose resets the hold and stays on the same asana', () => {
  let state = startFlow(12)
  state = stepFlow(state, true, 2000)
  state = stepFlow(state, false, 100)
  assert.equal(state.index, 0)
  assert.equal(state.holdMs, 0)
  assert.equal(state.phase, 'pose')
})

test('four green seconds move only one asana forward', () => {
  let state = startFlow(12)
  state = stepFlow(state, true, HOLD_MS)
  assert.equal(state.phase, 'transition')
  assert.equal(state.index, 0)
  state = stepFlow(state, false, TRANSITION_MS)
  assert.equal(state.index, 1)
  assert.equal(state.holdMs, 0)
  assert.equal(state.phase, 'pose')
})

test('the sequence cannot skip ahead', () => {
  let state = startFlow(3)
  for (let step = 0; step < 3; step += 1) {
    state = stepFlow(state, true, HOLD_MS)
    state = stepFlow(state, true, TRANSITION_MS)
  }
  assert.equal(state.done, true)
  assert.equal(state.index, 3)
  assert.equal(stepFlow(state, true, HOLD_MS).index, 3)
})

test('a single asana hold stops at four seconds and clears when the pose is lost', () => {
  assert.equal(stepHold(0, true, 2500), 2500)
  assert.equal(stepHold(3000, true, 5000), HOLD_MS)
  assert.equal(stepHold(HOLD_MS, false, 100), 0)
})
