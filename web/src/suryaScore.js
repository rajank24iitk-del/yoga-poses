export const KEYPOINT_NAMES = [
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

export const MATCH_AT = 0.75

export const SURYA_POSES = [
  { id: 'pranamasana', hi: 'प्रणामासन', en: 'Prayer', hint: 'हाथ छाती पर जोड़ें', hintEn: 'Join the hands at the chest' },
  { id: 'hasta_uttanasana', hi: 'हस्त उत्तानासन', en: 'Raised Arms', hint: 'हाथ ऊपर उठाएँ', hintEn: 'Raise the arms overhead' },
  { id: 'padahastasana', hi: 'पादहस्तासन', en: 'Forward Fold', hint: 'आगे झुककर हाथ नीचे ले जाएँ', hintEn: 'Fold forward and reach down' },
  { id: 'ashwa_sanchalanasana', hi: 'अश्व संचालनासन', en: 'Lunge', hint: 'एक पैर आगे, एक पैर पीछे', hintEn: 'One leg forward, one leg back' },
  { id: 'kumbhakasana', hi: 'कुंभकासन', en: 'Plank', hint: 'शरीर एक सीधी रेखा में', hintEn: 'Keep the body in one line' },
  { id: 'ashtanga_namaskara', hi: 'अष्टांग नमस्कार', en: 'Eight Limbs', hint: 'घुटने और छाती नीचे', hintEn: 'Knees and chest down' },
  { id: 'bhujangasana', hi: 'भुजंगासन', en: 'Cobra', hint: 'छाती ऊपर उठाएँ', hintEn: 'Lift the chest' },
  { id: 'adho_mukha_svanasana', hi: 'अधोमुख श्वानासन', en: 'Downward Dog', hint: 'कूल्हे सबसे ऊपर', hintEn: 'Hips are the highest point' },
]

export const SURYA_SEQUENCE = [
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
]

const POSE_BY_ID = Object.fromEntries(SURYA_POSES.map((pose) => [pose.id, pose]))

export function suryaPose(id) {
  return POSE_BY_ID[id]
}

function byName(keypoints) {
  const map = {}
  keypoints.forEach((point, index) => {
    map[point.name || KEYPOINT_NAMES[index]] = point
  })
  return map
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

function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function seen(points) {
  return points.every((point) => point && point.score >= 0.3)
}

function ratio(results) {
  if (results.length === 0) return 0
  return results.filter(Boolean).length / results.length
}

export function scoreSuryaPose(id, keypoints) {
  if (!keypoints || keypoints.length < 17) return 0
  const p = byName(keypoints)
  const body = [
    p.left_shoulder,
    p.right_shoulder,
    p.left_elbow,
    p.right_elbow,
    p.left_wrist,
    p.right_wrist,
    p.left_hip,
    p.right_hip,
    p.left_knee,
    p.right_knee,
    p.left_ankle,
    p.right_ankle,
  ]
  if (!seen(body)) return 0

  const shoulders = mid(p.left_shoulder, p.right_shoulder)
  const hips = mid(p.left_hip, p.right_hip)
  const ankles = mid(p.left_ankle, p.right_ankle)
  const torso = Math.max(30, Math.hypot(shoulders.x - hips.x, shoulders.y - hips.y))
  const leftKnee = angle(p.left_hip, p.left_knee, p.left_ankle)
  const rightKnee = angle(p.right_hip, p.right_knee, p.right_ankle)
  const leftElbow = angle(p.left_shoulder, p.left_elbow, p.left_wrist)
  const rightElbow = angle(p.right_shoulder, p.right_elbow, p.right_wrist)
  const wrists = mid(p.left_wrist, p.right_wrist)
  const wristGap = Math.hypot(p.left_wrist.x - p.right_wrist.x, p.left_wrist.y - p.right_wrist.y)
  const bentKnee = Math.min(leftKnee, rightKnee)
  const straightKnee = Math.max(leftKnee, rightKnee)

  if (id === 'pranamasana') {
    return ratio([
      leftKnee > 150 && rightKnee > 150,
      wristGap < torso * 0.55,
      wrists.y > shoulders.y && wrists.y < hips.y + torso * 0.2,
      leftElbow < 140 && rightElbow < 140,
    ])
  }

  if (id === 'hasta_uttanasana') {
    return ratio([
      leftKnee > 150 && rightKnee > 150,
      p.left_wrist.y < shoulders.y && p.right_wrist.y < shoulders.y,
      leftElbow > 140 && rightElbow > 140,
    ])
  }

  if (id === 'padahastasana') {
    return ratio([
      leftKnee > 140 && rightKnee > 140,
      shoulders.y > hips.y + torso * 0.2,
      wrists.y > hips.y + torso * 0.35,
    ])
  }

  if (id === 'ashwa_sanchalanasana') {
    return ratio([
      bentKnee > 55 && bentKnee < 135,
      straightKnee > 145,
      shoulders.y < hips.y,
    ])
  }

  if (id === 'kumbhakasana') {
    return ratio([
      leftElbow > 140 && rightElbow > 140,
      Math.abs(shoulders.y - hips.y) < torso * 0.55,
      wrists.y > shoulders.y - torso * 0.15,
      leftKnee > 145 && rightKnee > 145,
    ])
  }

  if (id === 'ashtanga_namaskara') {
    return ratio([
      leftKnee < 145 && rightKnee < 145,
      hips.y + torso * 0.15 < shoulders.y,
      leftElbow < 160 && rightElbow < 160,
    ])
  }

  if (id === 'bhujangasana') {
    return ratio([
      shoulders.y + torso * 0.2 < hips.y,
      leftElbow < 155 && rightElbow < 155,
      leftKnee > 140 && rightKnee > 140,
    ])
  }

  if (id === 'adho_mukha_svanasana') {
    return ratio([
      hips.y + torso * 0.25 < shoulders.y,
      hips.y + torso * 0.25 < ankles.y,
      leftKnee > 140 && rightKnee > 140,
    ])
  }

  return 0
}

export function matchesSuryaPose(id, keypoints) {
  return scoreSuryaPose(id, keypoints) >= MATCH_AT
}

export function bodyIsVisible(keypoints) {
  if (!keypoints || keypoints.length < 17) return false
  const weak = keypoints.filter((point) => (point.score ?? 0) < 0.3).length
  return weak <= 4
}
