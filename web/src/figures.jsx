function pose(points) {
  return points
}

export const FIGURES = {
  pranamasana: pose({
    head: [50, 16],
    shoulderL: [38, 36], shoulderR: [62, 36],
    elbowL: [44, 52], elbowR: [56, 52],
    wristL: [48, 60], wristR: [52, 60],
    hipL: [42, 78], hipR: [58, 78],
    kneeL: [40, 104], kneeR: [60, 104],
    ankleL: [38, 130], ankleR: [62, 130],
  }),
  hasta_uttanasana: pose({
    head: [50, 28],
    shoulderL: [38, 48], shoulderR: [62, 48],
    elbowL: [34, 30], elbowR: [66, 30],
    wristL: [30, 12], wristR: [70, 12],
    hipL: [42, 82], hipR: [58, 82],
    kneeL: [40, 106], kneeR: [60, 106],
    ankleL: [38, 130], ankleR: [62, 130],
  }),
  padahastasana: pose({
    head: [50, 96],
    shoulderL: [40, 84], shoulderR: [60, 84],
    elbowL: [42, 102], elbowR: [58, 102],
    wristL: [46, 122], wristR: [54, 122],
    hipL: [42, 52], hipR: [58, 52],
    kneeL: [40, 90], kneeR: [60, 90],
    ankleL: [38, 130], ankleR: [62, 130],
  }),
  ashwa_sanchalanasana: pose({
    head: [58, 28],
    shoulderL: [48, 46], shoulderR: [68, 44],
    elbowL: [42, 64], elbowR: [78, 62],
    wristL: [36, 82], wristR: [86, 80],
    hipL: [46, 78], hipR: [62, 76],
    kneeL: [34, 96], kneeR: [78, 108],
    ankleL: [24, 128], ankleR: [92, 128],
  }),
  kumbhakasana: pose({
    head: [22, 58],
    shoulderL: [30, 62], shoulderR: [30, 50],
    elbowL: [18, 74], elbowR: [18, 42],
    wristL: [8, 86], wristR: [8, 34],
    hipL: [62, 64], hipR: [62, 50],
    kneeL: [92, 66], kneeR: [92, 50],
    ankleL: [118, 68], ankleR: [118, 48],
  }),
  ashtanga_namaskara: pose({
    head: [24, 78],
    shoulderL: [36, 80], shoulderR: [36, 68],
    elbowL: [28, 92], elbowR: [28, 58],
    wristL: [16, 100], wristR: [16, 50],
    hipL: [62, 62], hipR: [62, 50],
    kneeL: [84, 88], kneeR: [84, 72],
    ankleL: [108, 96], ankleR: [108, 78],
  }),
  bhujangasana: pose({
    head: [28, 42],
    shoulderL: [40, 58], shoulderR: [40, 46],
    elbowL: [28, 78], elbowR: [28, 36],
    wristL: [16, 90], wristR: [16, 28],
    hipL: [72, 78], hipR: [72, 66],
    kneeL: [98, 82], kneeR: [98, 68],
    ankleL: [120, 84], ankleR: [120, 66],
  }),
  adho_mukha_svanasana: pose({
    head: [18, 70],
    shoulderL: [28, 78], shoulderR: [28, 62],
    elbowL: [16, 96], elbowR: [16, 48],
    wristL: [6, 112], wristR: [6, 36],
    hipL: [62, 28], hipR: [74, 22],
    kneeL: [90, 62], kneeR: [102, 52],
    ankleL: [118, 96], ankleR: [128, 82],
  }),
  tree: pose({
    head: [50, 16],
    shoulderL: [38, 36], shoulderR: [62, 36],
    elbowL: [46, 50], elbowR: [54, 50],
    wristL: [48, 62], wristR: [52, 62],
    hipL: [42, 78], hipR: [58, 78],
    kneeL: [40, 104], kneeR: [62, 86],
    ankleL: [38, 130], ankleR: [50, 96],
  }),
  chair: pose({
    head: [46, 22],
    shoulderL: [36, 42], shoulderR: [58, 40],
    elbowL: [30, 24], elbowR: [66, 22],
    wristL: [26, 8], wristR: [72, 8],
    hipL: [40, 78], hipR: [62, 76],
    kneeL: [28, 100], kneeR: [74, 98],
    ankleL: [24, 130], ankleR: [78, 130],
  }),
  warrior: pose({
    head: [48, 24],
    shoulderL: [36, 42], shoulderR: [64, 42],
    elbowL: [16, 42], elbowR: [84, 42],
    wristL: [4, 42], wristR: [98, 42],
    hipL: [40, 76], hipR: [62, 76],
    kneeL: [28, 98], kneeR: [82, 100],
    ankleL: [18, 128], ankleR: [96, 128],
  }),
  shoulderstand: pose({
    head: [50, 118],
    shoulderL: [38, 104], shoulderR: [62, 104],
    elbowL: [30, 92], elbowR: [70, 92],
    wristL: [36, 78], wristR: [64, 78],
    hipL: [42, 62], hipR: [58, 62],
    kneeL: [40, 36], kneeR: [60, 36],
    ankleL: [38, 12], ankleR: [62, 12],
  }),
  triangle: pose({
    head: [42, 48],
    shoulderL: [30, 58], shoulderR: [58, 46],
    elbowL: [22, 78], elbowR: [74, 28],
    wristL: [16, 98], wristR: [88, 12],
    hipL: [36, 86], hipR: [64, 84],
    kneeL: [24, 112], kneeR: [86, 112],
    ankleL: [12, 132], ankleR: [98, 132],
  }),
}

function point(value) {
  if (Array.isArray(value)) return { x: value[0], y: value[1] }
  return value
}

export function blendFigures(from, to, amount) {
  const next = to || from
  const t = Math.min(1, Math.max(0, amount))
  const blended = {}
  Object.keys(from).forEach((name) => {
    const start = point(from[name])
    const end = point(next[name])
    blended[name] = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    }
  })
  return blended
}

function Limb({ points, start, end, width, color }) {
  const a = points[start]
  const b = points[end]
  return (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
    />
  )
}

export function StickFigure({ figure, next, progress = 0, label = 'Sample pose' }) {
  const points = blendFigures(FIGURES[figure], next ? FIGURES[next] : null, progress)
  const spots = Object.values(points)
  const minX = Math.min(...spots.map((spot) => spot.x))
  const maxX = Math.max(...spots.map((spot) => spot.x))
  const minY = Math.min(...spots.map((spot) => spot.y))
  const maxY = Math.max(...spots.map((spot) => spot.y))
  const pad = 16
  const viewBox = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`
  const head = points.head
  const torso = [points.shoulderL, points.shoulderR, points.hipR, points.hipL]
    .map((spot) => `${spot.x},${spot.y}`)
    .join(' ')

  return (
    <svg className="figure" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
      <Limb points={points} start="hipL" end="kneeL" width="11" color="#6d3f86" />
      <Limb points={points} start="kneeL" end="ankleL" width="10" color="#6d3f86" />
      <Limb points={points} start="hipR" end="kneeR" width="11" color="#7a4b96" />
      <Limb points={points} start="kneeR" end="ankleR" width="10" color="#7a4b96" />
      <polygon points={torso} fill="#e58aa0" />
      <Limb points={points} start="shoulderL" end="elbowL" width="7" color="#f0c3a6" />
      <Limb points={points} start="elbowL" end="wristL" width="6.5" color="#f0c3a6" />
      <Limb points={points} start="shoulderR" end="elbowR" width="7" color="#f0c3a6" />
      <Limb points={points} start="elbowR" end="wristR" width="6.5" color="#f0c3a6" />
      <circle cx={head.x} cy={head.y - 8} r="4.5" fill="#2b2146" />
      <circle cx={head.x} cy={head.y - 1} r="8.2" fill="#2b2146" />
      <circle cx={head.x} cy={head.y + 1.5} r="6.2" fill="#f3c7ad" />
    </svg>
  )
}
