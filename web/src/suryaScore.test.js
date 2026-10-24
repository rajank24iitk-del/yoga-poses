import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SURYA_SEQUENCE,
  matchesSuryaPose,
  scoreSuryaPose,
} from './suryaScore.js'

const NAMES = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
]

function person(overrides) {
  const points = {
    nose: [200, 70],
    left_eye: [190, 64],
    right_eye: [210, 64],
    left_ear: [176, 72],
    right_ear: [224, 72],
    left_shoulder: [150, 140],
    right_shoulder: [250, 140],
    left_elbow: [140, 210],
    right_elbow: [260, 210],
    left_wrist: [140, 280],
    right_wrist: [260, 280],
    left_hip: [170, 300],
    right_hip: [230, 300],
    left_knee: [165, 400],
    right_knee: [235, 400],
    left_ankle: [160, 500],
    right_ankle: [240, 500],
    ...overrides,
  }
  return NAMES.map((name) => {
    const [x, y] = points[name]
    return { name, x, y, score: 1 }
  })
}

const prayer = person({
  left_elbow: [170, 200],
  right_elbow: [230, 200],
  left_wrist: [194, 230],
  right_wrist: [206, 230],
})

const armsUp = person({
  left_elbow: [145, 70],
  right_elbow: [255, 70],
  left_wrist: [140, 10],
  right_wrist: [260, 10],
})

const fold = person({
  nose: [200, 360],
  left_shoulder: [160, 330],
  right_shoulder: [240, 330],
  left_elbow: [165, 400],
  right_elbow: [235, 400],
  left_wrist: [180, 470],
  right_wrist: [220, 470],
  left_hip: [170, 220],
  right_hip: [230, 220],
  left_knee: [165, 360],
  right_knee: [235, 360],
  left_ankle: [160, 500],
  right_ankle: [240, 500],
})

const lunge = person({
  left_hip: [170, 300],
  left_knee: [120, 420],
  left_ankle: [170, 500],
  right_hip: [230, 300],
  right_knee: [280, 400],
  right_ankle: [330, 500],
})

const dog = person({
  left_shoulder: [120, 300],
  right_shoulder: [180, 300],
  left_elbow: [100, 340],
  right_elbow: [160, 340],
  left_wrist: [80, 390],
  right_wrist: [140, 390],
  left_hip: [230, 120],
  right_hip: [290, 120],
  left_knee: [310, 200],
  right_knee: [370, 200],
  left_ankle: [390, 300],
  right_ankle: [450, 300],
  nose: [100, 280],
})

test('the sun salutation is twelve counts and does not wander', () => {
  assert.deepEqual(SURYA_SEQUENCE, [
    'pranamasana',
    'hasta_uttanasana',
    'padahastasana',
    'ashwa_sanchalanasana',
    'kumbhakasana',
    'ashtanga_namaskara',
    'bhujangasana',
    'adho_mukha_svanasana',
    'ashwa_sanchalanasana',
    'padahastasana',
    'hasta_uttanasana',
    'pranamasana',
  ])
})

test('prayer is not counted as a fold or as arms raised', () => {
  assert.equal(matchesSuryaPose('pranamasana', prayer), true)
  assert.equal(matchesSuryaPose('padahastasana', prayer), false)
  assert.equal(matchesSuryaPose('hasta_uttanasana', prayer), false)
})

test('each clear shape matches only its own step', () => {
  assert.equal(matchesSuryaPose('hasta_uttanasana', armsUp), true)
  assert.equal(matchesSuryaPose('pranamasana', armsUp), false)
  assert.equal(matchesSuryaPose('padahastasana', fold), true)
  assert.equal(matchesSuryaPose('pranamasana', fold), false)
  assert.equal(matchesSuryaPose('ashwa_sanchalanasana', lunge), true)
  assert.equal(matchesSuryaPose('adho_mukha_svanasana', dog), true)
  assert.ok(scoreSuryaPose('pranamasana', dog) < 0.75)
})
