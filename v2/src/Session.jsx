import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { scoreAsana } from './poseScore'
import { stepHold } from './treeScore'

const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'

const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 29], [27, 31], [28, 30], [28, 32], [29, 31], [30, 32],
]

function drawScene(ctx, video, landmarks, matched) {
  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) return
  if (ctx.canvas.width !== width) ctx.canvas.width = width
  if (ctx.canvas.height !== height) ctx.canvas.height = height

  ctx.save()
  ctx.translate(width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(video, 0, 0, width, height)
  ctx.restore()

  if (!landmarks) return

  const grad = ctx.createLinearGradient(0, 0, 0, height)
  if (matched) {
    grad.addColorStop(0, '#e8fff2')
    grad.addColorStop(0.45, '#5ef29e')
    grad.addColorStop(1, '#1fa85c')
  } else {
    grad.addColorStop(0, '#fff9e6')
    grad.addColorStop(0.45, '#ffd470')
    grad.addColorStop(1, '#c97e1a')
  }

  const xOf = (spot) => width - spot.x * width
  const yOf = (spot) => spot.y * height
  ctx.save()
  ctx.lineWidth = Math.max(3.5, width / 170)
  ctx.lineCap = 'round'
  ctx.strokeStyle = grad
  ctx.fillStyle = grad
  ctx.shadowColor = matched ? 'rgba(72, 240, 146, 0.85)' : 'rgba(255, 196, 76, 0.85)'
  ctx.shadowBlur = 12

  BONES.forEach(([start, end]) => {
    const a = landmarks[start]
    const b = landmarks[end]
    if (!a || !b || (a.visibility ?? 0) < 0.4 || (b.visibility ?? 0) < 0.4) return
    ctx.beginPath()
    ctx.moveTo(xOf(a), yOf(a))
    ctx.lineTo(xOf(b), yOf(b))
    ctx.stroke()
  })

  landmarks.forEach((spot, index) => {
    if (!spot || index < 11 || (spot.visibility ?? 0) < 0.4) return
    ctx.beginPath()
    ctx.arc(xOf(spot), yOf(spot), Math.max(4.5, width / 140), 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

export default function Session({ pose, step = 0, position, onComplete, music, onToggleMusic, onExit, onOpenSettings, holdMs, dotColor, onHeldChange }) {
  const wasHeldRef = useRef(false)
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const holdRef = useRef({ holdMs: 0, missMs: 0 })
  const limitRef = useRef(holdMs)
  const dotRef = useRef(dotColor)
  const heldChangeRef = useRef(onHeldChange)
  const poseRef = useRef(pose)
  limitRef.current = holdMs
  dotRef.current = dotColor
  heldChangeRef.current = onHeldChange
  poseRef.current = pose
  const [status, setStatus] = useState('loading')
  const [detail, setDetail] = useState('')
  const [view, setView] = useState({
    holdMs: 0,
    matched: false,
    visible: false,
    done: false,
  })

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let stopped = false
    let busy = false
    let landmarker
    let stream
    let last = performance.now()
    let clock = 0
    wasHeldRef.current = false
    holdRef.current = { holdMs: 0, missMs: 0 }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        video.srcObject = stream
        await video.play()
        const vision = await FilesetResolver.forVisionTasks(WASM)
        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
          })
        } catch {
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
          })
        }
        if (stopped) return
        setStatus('')
        last = performance.now()
        requestAnimationFrame(loop)
      } catch (error) {
        console.error(error)
        if (!stopped) {
          setDetail(error?.message || 'Unknown error')
          setStatus('error')
        }
      }
    }

    function loop(now) {
      if (stopped) return
      const dt = Math.min(250, now - last)
      last = now
      if (!busy && video.readyState >= 2) {
        busy = true
        try {
          clock = Math.max(clock + 1, now)
          const found = landmarker.detectForVideo(video, clock)
          const landmarks = found?.landmarks?.[0] || null
          const scored = scoreAsana(poseRef.current.id, landmarks)
          const next = stepHold(holdRef.current.holdMs, holdRef.current.missMs, scored.matched, dt, limitRef.current)
          holdRef.current = { holdMs: next.holdMs, missMs: next.missMs }
          if (next.matched !== wasHeldRef.current) {
            wasHeldRef.current = next.matched
            heldChangeRef.current?.(next.matched)
          }
          drawScene(ctx, video, landmarks, next.matched, dotRef.current)
          setView({
            holdMs: next.holdMs,
            matched: next.matched,
            visible: scored.visible,
            done: next.done,
          })
        } finally {
          busy = false
        }
      }
      requestAnimationFrame(loop)
    }

    start()
    return () => {
      stopped = true
      stream?.getTracks().forEach((track) => track.stop())
      landmarker?.close()
    }
  }, [])

  useEffect(() => {
    holdRef.current = { holdMs: 0, missMs: 0 }
    setView({ holdMs: 0, matched: false, visible: false, done: false })
    wasHeldRef.current = false
    heldChangeRef.current?.(false)
  }, [pose.id, step])

  useEffect(() => {
    if (!view.done || !completeRef.current) return undefined
    const timer = setTimeout(() => completeRef.current?.(), 1400)
    return () => clearTimeout(timer)
  }, [view.done, pose.id, step])

  const total = Math.max(1, Math.round(holdMs / 1000))
  const seconds = (view.holdMs / 1000).toFixed(1)
  const progress = Math.min(100, (view.holdMs / holdMs) * 100)
  const message = view.done
    ? 'Held in metallic emerald.'
    : view.matched
      ? 'Stay steady. The metallic emerald count is running.'
      : view.visible
        ? 'Match the picture. The studio turns metallic green when aligned.'
        : 'Bring your whole body into the camera.'

  return (
    <main className="practice">
      <header className="practice-top">
        <button className="text-button" type="button" onClick={onExit}>Back</button>
        <div className="practice-heading">
          <p className="sanskrit small">{pose.hi}</p>
          <h1 className="metallic-heading">{pose.name}</h1>
          <p className="subtitle">
            {position ? `${pose.en} • ${position.index} of ${position.total}` : pose.en}
          </p>
        </div>
        <div className="header-actions">
          <button className="text-button" type="button" onClick={onToggleMusic}>
            {music ? 'Tanpura playing' : 'Play tanpura'}
          </button>
          <button className="icon-button" type="button" aria-label="Settings" onClick={onOpenSettings}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.51.4 1.05.71 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
            </svg>
          </button>
        </div>
      </header>

      {status === 'loading' && <p className="status">Opening the camera and the 33-point model.</p>}
      {status === 'error' && <p className="status">The camera or the pose model could not start. {detail}</p>}

      <div className="stage">
        <div className="camera-wrap">
          <video ref={videoRef} className="camera-source" playsInline muted />
          <canvas ref={canvasRef} className="camera" />
        </div>
        <figure className="portrait practice-portrait">
          <img src={`${import.meta.env.BASE_URL}${pose.image}`} alt={`Reference for ${pose.name}`} />
          <figcaption>Copy this pose</figcaption>
        </figure>
      </div>

      <section
        className={`meter ${view.matched ? 'good' : ''}`}
        role="meter"
        aria-label="Hold"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Number(seconds)}
      >
        <div className="meter-row">
          <span>{view.done ? 'Complete' : 'Hold'}</span>
          <strong className="metallic-heading">{seconds} / {total}</strong>
        </div>
        <div className="track">
          <div className="fill" style={{ width: `${progress}%` }} />
        </div>
        <p>{message}</p>
      </section>
    </main>
  )
}
