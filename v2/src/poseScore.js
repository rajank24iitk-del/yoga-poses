import { scoreTree } from './treeScore.js'

const NOSE = 0
const LEFT_SHOULDER = 11
const RIGHT_SHOULDER = 12
const LEFT_ELBOW = 13
const RIGHT_ELBOW = 14
const LEFT_WRIST = 15
const RIGHT_WRIST = 16
const LEFT_HIP = 23
const RIGHT_HIP = 24
const LEFT_KNEE = 25
const RIGHT_KNEE = 26
const LEFT_ANKLE = 27
const RIGHT_ANKLE = 28

const BODY = [
  NOSE,
  LEFT_SHOULDER,
  RIGHT_SHOULDER,
  LEFT_ELBOW,
  RIGHT_ELBOW,
  LEFT_WRIST,
  RIGHT_WRIST,
  LEFT_HIP,
  RIGHT_HIP,
  LEFT_KNEE,
  RIGHT_KNEE,
  LEFT_ANKLE,
  RIGHT_ANKLE,
]

function seen(spot) {
  if (!spot) return false
  const score = spot.visibility ?? spot.score ?? 0
  return score >= 0.5 && Number.isFinite(spot.x) && Number.isFinite(spot.y)
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function angle(a, b, c) {
  const v1x = a.x - b.x
  const v1y = a.y - b.y
  const v2x = c.x - b.x
  const v2y = c.y - b.y
  const denom = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y)
  if (denom < 1e-4) return 0
  const cos = Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / denom))
  return (Math.acos(cos) * 180) / Math.PI
}

function finish(checks) {
  const score = checks.filter(Boolean).length / checks.length
  return { matched: checks.every(Boolean), score, visible: true }
}

function hidden() {
  return { matched: false, score: 0, visible: false }
}

function read(landmarks) {
  if (!landmarks || landmarks.length < 33) return null
  if (!BODY.every((index) => seen(landmarks[index]))) return null
  const at = (index) => landmarks[index]
  const shoulders = mid(at(LEFT_SHOULDER), at(RIGHT_SHOULDER))
  const hips = mid(at(LEFT_HIP), at(RIGHT_HIP))
  return {
    at,
    nose: at(NOSE),
    shoulders,
    hips,
    torso: Math.max(0.05, dist(shoulders, hips)),
    leftKnee: angle(at(LEFT_HIP), at(LEFT_KNEE), at(LEFT_ANKLE)),
    rightKnee: angle(at(RIGHT_HIP), at(RIGHT_KNEE), at(RIGHT_ANKLE)),
    leftElbow: angle(at(LEFT_SHOULDER), at(LEFT_ELBOW), at(LEFT_WRIST)),
    rightElbow: angle(at(RIGHT_SHOULDER), at(RIGHT_ELBOW), at(RIGHT_WRIST)),
  }
}

function scoreChair(frame) {
  const { at, nose, shoulders, hips, torso, leftKnee, rightKnee, leftElbow, rightElbow } = frame
  const kneesBent = leftKnee > 70 && leftKnee < 140 && rightKnee > 70 && rightKnee < 140
  const feetDown = at(LEFT_ANKLE).y > at(LEFT_KNEE).y + torso * 0.08
    && at(RIGHT_ANKLE).y > at(RIGHT_KNEE).y + torso * 0.08
  const feetLevel = Math.abs(at(LEFT_ANKLE).y - at(RIGHT_ANKLE).y) < torso * 0.45
  const upright = shoulders.y < hips.y - torso * 0.12
  const armsUp = at(LEFT_WRIST).y < nose.y && at(RIGHT_WRIST).y < nose.y
  const armsStraight = leftElbow > 130 && rightElbow > 130
  return finish([kneesBent, feetDown, feetLevel, upright, armsUp, armsStraight])
}

function scoreCobra(frame) {
  const { at, shoulders, hips, torso, leftKnee, rightKnee, leftElbow, rightElbow } = frame
  const chestUp = shoulders.y < hips.y - torso * 0.12
  const legsBack = at(LEFT_ANKLE).y > hips.y + torso * 0.2
    && at(RIGHT_ANKLE).y > hips.y + torso * 0.2
  const legsStraight = leftKnee > 140 && rightKnee > 140
  const handsDown = at(LEFT_WRIST).y > shoulders.y - torso * 0.08
    && at(RIGHT_WRIST).y > shoulders.y - torso * 0.08
  const armsSupport = leftElbow > 80 && rightElbow > 80
  return finish([chestUp, legsBack, legsStraight, handsDown, armsSupport])
}

function scoreDog(frame) {
  const { at, shoulders, hips, torso, leftKnee, rightKnee, leftElbow, rightElbow } = frame
  const hipsHigh = hips.y < shoulders.y - torso * 0.18 && hips.y < at(LEFT_ANKLE).y - torso * 0.12
    && hips.y < at(RIGHT_ANKLE).y - torso * 0.12
  const legsStraight = leftKnee > 135 && rightKnee > 135
  const armsStraight = leftElbow > 140 && rightElbow > 140
  const handsDown = at(LEFT_WRIST).y > shoulders.y && at(RIGHT_WRIST).y > shoulders.y
  return finish([hipsHigh, legsStraight, armsStraight, handsDown])
}

function warriorSide(standHip, standKnee, standAnkle, freeHip, freeKnee, freeAnkle, shoulders, torso, kneeStand, kneeFree) {
  const planted = kneeStand > 150 && standAnkle.y > standHip.y + torso * 0.4
  const lifted = kneeFree > 145
    && Math.abs(freeAnkle.y - freeHip.y) < torso * 0.6
    && freeAnkle.y < standAnkle.y - torso * 0.35
  const folded = shoulders.y > standHip.y - torso * 0.4
  return planted && lifted && folded
}

function scoreWarrior(frame) {
  const { at, shoulders, torso, leftKnee, rightKnee, leftElbow, rightElbow } = frame
  const leftStands = warriorSide(
    at(LEFT_HIP), at(LEFT_KNEE), at(LEFT_ANKLE),
    at(RIGHT_HIP), at(RIGHT_KNEE), at(RIGHT_ANKLE),
    shoulders, torso, leftKnee, rightKnee,
  )
  const rightStands = warriorSide(
    at(RIGHT_HIP), at(RIGHT_KNEE), at(RIGHT_ANKLE),
    at(LEFT_HIP), at(LEFT_KNEE), at(LEFT_ANKLE),
    shoulders, torso, rightKnee, leftKnee,
  )
  const wrists = mid(at(LEFT_WRIST), at(RIGHT_WRIST))
  const armsForward = wrists.y < frame.hips.y
    && Math.abs(wrists.y - shoulders.y) < torso * 0.75
    && leftElbow > 140 && rightElbow > 140
  return finish([leftStands || rightStands, armsForward])
}

function scoreShoulderstand(frame) {
  const { at, shoulders, hips, torso, leftKnee, rightKnee, leftElbow, rightElbow } = frame
  const legsUp = at(LEFT_ANKLE).y < hips.y - torso * 0.25
    && at(RIGHT_ANKLE).y < hips.y - torso * 0.25
  const hipsUp = hips.y < shoulders.y - torso * 0.15
  const legsStraight = leftKnee > 140 && rightKnee > 140
  const armsBent = leftElbow < 160 && rightElbow < 160
  const handsSupport = at(LEFT_WRIST).y > hips.y - torso * 0.15
    && at(RIGHT_WRIST).y > hips.y - torso * 0.15
    && at(LEFT_WRIST).y < shoulders.y + torso * 0.2
    && at(RIGHT_WRIST).y < shoulders.y + torso * 0.2
  return finish([legsUp, hipsUp, legsStraight, armsBent, handsSupport])
}

function scoreTriangle(frame) {
  const { at, shoulders, hips, torso, leftKnee, rightKnee } = frame
  const legsStraight = leftKnee > 150 && rightKnee > 150
  const wide = dist(at(LEFT_ANKLE), at(RIGHT_ANKLE)) > torso * 1.15
  const feetDown = at(LEFT_ANKLE).y > hips.y && at(RIGHT_ANKLE).y > hips.y
  const low = at(LEFT_WRIST).y > at(RIGHT_WRIST).y ? at(LEFT_WRIST) : at(RIGHT_WRIST)
  const high = low === at(LEFT_WRIST) ? at(RIGHT_WRIST) : at(LEFT_WRIST)
  const oneDown = low.y > hips.y - torso * 0.05
  const oneUp = high.y < Math.min(at(LEFT_SHOULDER).y, at(RIGHT_SHOULDER).y)
  const sideBend = Math.abs(at(LEFT_SHOULDER).y - at(RIGHT_SHOULDER).y) > torso * 0.1
  return finish([legsStraight, wide, feetDown, oneDown, oneUp, sideBend])
}

function scorePrayer(frame) {
  const { at, shoulders, hips, torso, leftKnee, rightKnee, leftElbow, rightElbow } = frame
  const wrists = mid(at(LEFT_WRIST), at(RIGHT_WRIST))
  const standing = leftKnee > 150 && rightKnee > 150
  const upright = shoulders.y < hips.y - torso * 0.5
  const joined = dist(at(LEFT_WRIST), at(RIGHT_WRIST)) < torso * 0.5
  const atChest = wrists.y > shoulders.y - torso * 0.1 && wrists.y < hips.y
  const bent = leftElbow < 140 && rightElbow < 140
  return finish([standing, upright, joined, atChest, bent])
}

function scoreRaisedArms(frame) {
  const { at, nose, shoulders, hips, torso, leftKnee, rightKnee, leftElbow, rightElbow } = frame
  const standing = leftKnee > 150 && rightKnee > 150
  const upright = shoulders.y < hips.y - torso * 0.5
  const armsUp = at(LEFT_WRIST).y < nose.y && at(RIGHT_WRIST).y < nose.y
  const straight = leftElbow > 140 && rightElbow > 140
  const feetTogether = dist(at(LEFT_ANKLE), at(RIGHT_ANKLE)) < torso * 0.9
  return finish([standing, upright, armsUp, straight, feetTogether])
}

function scoreForwardFold(frame) {
  const { at, shoulders, hips, torso, leftKnee, rightKnee } = frame
  const legsStraight = leftKnee > 140 && rightKnee > 140
  const folded = shoulders.y > hips.y + torso * 0.2
  const handsLow = at(LEFT_WRIST).y > hips.y + torso * 0.35 && at(RIGHT_WRIST).y > hips.y + torso * 0.35
  return finish([legsStraight, folded, handsLow])
}

function scoreLunge(frame) {
  const { at, shoulders, hips, torso, leftKnee, rightKnee } = frame
  const bent = Math.min(leftKnee, rightKnee)
  const straight = Math.max(leftKnee, rightKnee)
  const oneBent = bent > 55 && bent < 135
  const oneStraight = straight > 145
  const split = Math.abs(at(LEFT_ANKLE).x - at(RIGHT_ANKLE).x) > torso * 0.9
  const chestUp = shoulders.y < hips.y
  const handsDown = at(LEFT_WRIST).y > hips.y && at(RIGHT_WRIST).y > hips.y
  return finish([oneBent, oneStraight, split, chestUp, handsDown])
}

function scorePlank(frame) {
  const { at, shoulders, hips, torso, leftKnee, rightKnee, leftElbow, rightElbow } = frame
  const armsStraight = leftElbow > 140 && rightElbow > 140
  const level = Math.abs(shoulders.y - hips.y) < torso * 0.55
  const handsDown = at(LEFT_WRIST).y > shoulders.y + torso * 0.3
    && at(RIGHT_WRIST).y > shoulders.y + torso * 0.3
  const legsStraight = leftKnee > 145 && rightKnee > 145
  const long = Math.abs(shoulders.x - hips.x) > torso * 0.6
  return finish([armsStraight, level, handsDown, legsStraight, long])
}

function scoreEightLimbs(frame) {
  const { at, shoulders, hips, torso, leftKnee, rightKnee, leftElbow, rightElbow } = frame
  const kneesBent = leftKnee < 135 && rightKnee < 135
  const hipsUp = hips.y + torso * 0.15 < shoulders.y
  const elbowsBent = leftElbow < 120 && rightElbow < 120
  const handsDown = at(LEFT_WRIST).y > shoulders.y - torso * 0.1
    && at(RIGHT_WRIST).y > shoulders.y - torso * 0.1
  return finish([kneesBent, hipsUp, elbowsBent, handsDown])
}

const SCORERS = {
  pranamasana: scorePrayer,
  hasta_uttanasana: scoreRaisedArms,
  padahastasana: scoreForwardFold,
  ashwa_sanchalanasana: scoreLunge,
  kumbhakasana: scorePlank,
  ashtanga_namaskara: scoreEightLimbs,
  tree: scoreTree,
  chair: scoreChair,
  cobra: scoreCobra,
  warrior: scoreWarrior,
  dog: scoreDog,
  shoulderstand: scoreShoulderstand,
  triangle: scoreTriangle,
}

export function scoreAsana(id, landmarks) {
  const score = SCORERS[id]
  if (!score) return hidden()
  if (id === 'tree') return scoreTree(landmarks)
  const frame = read(landmarks)
  if (!frame) return hidden()
  return score(frame)
}
