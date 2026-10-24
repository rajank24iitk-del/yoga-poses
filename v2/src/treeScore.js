export const HOLD_MS = 15000
export const GRACE_MS = 400

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

const NEEDED = [
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

function point(landmarks, index) {
  return landmarks[index]
}

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

function standingFold(standingHip, standingKnee, standingAnkle, raisedHip, raisedKnee, raisedAnkle, hips, torso) {
  const straight = angle(standingHip, standingKnee, standingAnkle) > 155
  const bent = angle(raisedHip, raisedKnee, raisedAnkle)
  const bentOk = bent > 35 && bent < 130
  const onThigh = dist(raisedAnkle, standingKnee) < torso * 0.7
    && dist(raisedAnkle, standingKnee) < dist(raisedAnkle, standingAnkle)
  const lifted = raisedAnkle.y < standingAnkle.y - torso * 0.12
  const kneeOut = Math.abs(raisedKnee.x - hips.x) > Math.abs(standingKnee.x - hips.x) + torso * 0.04
  return straight && bentOk && onThigh && lifted && kneeOut
}

export function scoreTree(landmarks) {
  if (!landmarks || landmarks.length < 33) {
    return { matched: false, score: 0, visible: false }
  }
  const spots = NEEDED.map((index) => point(landmarks, index))
  if (!spots.every(seen)) {
    return { matched: false, score: 0, visible: false }
  }

  const shoulders = mid(point(landmarks, LEFT_SHOULDER), point(landmarks, RIGHT_SHOULDER))
  const hips = mid(point(landmarks, LEFT_HIP), point(landmarks, RIGHT_HIP))
  const torso = Math.max(0.05, dist(shoulders, hips))
  const upright = shoulders.y < hips.y - torso * 0.2
    && Math.abs(shoulders.x - hips.x) < torso * 0.65

  const leftStands = standingFold(
    point(landmarks, LEFT_HIP),
    point(landmarks, LEFT_KNEE),
    point(landmarks, LEFT_ANKLE),
    point(landmarks, RIGHT_HIP),
    point(landmarks, RIGHT_KNEE),
    point(landmarks, RIGHT_ANKLE),
    hips,
    torso,
  )
  const rightStands = standingFold(
    point(landmarks, RIGHT_HIP),
    point(landmarks, RIGHT_KNEE),
    point(landmarks, RIGHT_ANKLE),
    point(landmarks, LEFT_HIP),
    point(landmarks, LEFT_KNEE),
    point(landmarks, LEFT_ANKLE),
    hips,
    torso,
  )

  const nose = point(landmarks, NOSE)
  const leftWrist = point(landmarks, LEFT_WRIST)
  const rightWrist = point(landmarks, RIGHT_WRIST)
  const armsUp = leftWrist.y < nose.y && rightWrist.y < nose.y
  const handsClose = dist(leftWrist, rightWrist) < torso * 0.75
  const elbowsStraight = angle(
    point(landmarks, LEFT_SHOULDER),
    point(landmarks, LEFT_ELBOW),
    leftWrist,
  ) > 140 && angle(
    point(landmarks, RIGHT_SHOULDER),
    point(landmarks, RIGHT_ELBOW),
    rightWrist,
  ) > 140
  const arms = armsUp && handsClose && elbowsStraight
  const legs = leftStands || rightStands
  const checks = [upright, legs, arms]
  const score = checks.filter(Boolean).length / checks.length
  return {
    matched: checks.every(Boolean),
    score,
    visible: true,
  }
}

export function stepHold(holdMs, missMs, matched, dt) {
  if (matched) {
    const next = Math.min(HOLD_MS, holdMs + dt)
    return { holdMs: next, missMs: 0, matched: true, done: next >= HOLD_MS }
  }
  const miss = missMs + dt
  if (holdMs > 0 && miss < GRACE_MS) {
    return { holdMs, missMs: miss, matched: true, done: holdMs >= HOLD_MS }
  }
  return { holdMs: 0, missMs: 0, matched: false, done: false }
}
