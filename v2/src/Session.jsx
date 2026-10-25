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

function drawRing(ctx, w, h, progress, matched, total, holdSec) {
  const pad = 8
  const thick = 12
  const r = thick / 2 + 1
  const x0 = pad, y0 = pad, x1 = w - pad, y1 = h - pad
  const rw = x1 - x0, rh = y1 - y0
  const perimeter = 2 * (rw + rh)

  ctx.save()
  ctx.lineWidth = thick
  ctx.lineCap = 'round'

  ctx.strokeStyle = matched ? 'rgba(94, 242, 158, 0.25)' : 'rgba(255, 212, 112, 0.25)'
  ctx.beginPath()
  ctx.roundRect(x0, y0, rw, rh, r)
  ctx.stroke()

  if (progress > 0) {
    const len = perimeter * Math.min(1, progress / 100)
    ctx.strokeStyle = matched ? '#5ef29e' : '#ffd470'
    ctx.shadowColor = matched ? 'rgba(72, 240, 146, 0.7)' : 'rgba(255, 196, 76, 0.7)'
    ctx.shadowBlur = 10
    ctx.setLineDash([len, perimeter])
    ctx.beginPath()
    ctx.roundRect(x0, y0, rw, rh, r)
    ctx.stroke()
    ctx.setLineDash([])
  }

  const ticks = Math.max(1, total)
  const tickLen = 12
  ctx.lineWidth = 3
  ctx.strokeStyle = matched ? 'rgba(94, 242, 158, 0.5)' : 'rgba(255, 212, 112, 0.5)'
  ctx.shadowBlur = 0
  for (let i = 1; i < ticks; i++) {
    const frac = i / ticks
    const pos = frac * perimeter
    let tx, ty, dx, dy
    if (pos < rw) {
      tx = x0 + pos; ty = y0; dx = 0; dy = 1
    } else if (pos < rw + rh) {
      tx = x1; ty = y0 + (pos - rw); dx = -1; dy = 0
    } else if (pos < 2 * rw + rh) {
      tx = x1 - (pos - rw - rh); ty = y1; dx = 0; dy = -1
    } else {
      tx = x0; ty = y1 - (pos - 2 * rw - rh); dx = 1; dy = 0
    }
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.lineTo(tx + dx * tickLen, ty + dy * tickLen)
    ctx.stroke()
  }

  ctx.font = `bold ${Math.max(28, w / 14)}px Outfit, sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillStyle = matched ? '#5ef29e' : '#ffd470'
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 6
  ctx.fillText(`${holdSec} / ${total}`, w - 24, 24)
  ctx.restore()
}

function drawDebug(ctx, w, h, debug, matched) {
  if (!debug || matched) return
  ctx.save()
  const fontSize = Math.max(22, w / 26)
  ctx.font = `${fontSize}px Outfit, sans-serif`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'right'
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 4
  const lines = []
  lines.push(`Torso ${debug.upright ? '✓' : '✗'}`)
  let legLine = `Legs ${debug.legs ? '✓' : '✗'}`
  if (!debug.legs) {
    if (!debug.legStraight) legLine += ' bent'
    if (!debug.footOnThigh) legLine += ' foot off'
    if (!debug.footLifted) legLine += ' low'
    if (!debug.kneeOut) legLine += ' knee in'
  }
  lines.push(legLine)
  let armLine = `Arms ${debug.arms ? '✓' : '✗'}`
  if (!debug.arms) {
    if (!debug.armsUp) armLine += ' low'
    if (!debug.handsClose) armLine += ' apart'
    if (!debug.elbowsStraight) armLine += ` ${debug.leftElbow}°/${debug.rightElbow}°`
  }
  lines.push(armLine)
  const lh = fontSize * 1.35
  const timerFontSize = Math.max(28, w / 14)
  let y = 24 + timerFontSize + 12
  for (let i = 0; i < lines.length; i++) {
    const ok = lines[i].includes('✓')
    ctx.fillStyle = ok ? '#7ef5b2' : '#ff9a6a'
    ctx.fillText(lines[i], w - 24, y)
    y += lh
  }
  ctx.restore()
}

function drawMessage(ctx, w, h, message, matched) {
  ctx.save()
  ctx.font = `${Math.max(24, w / 22)}px Outfit, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = matched ? '#c4f5d4' : '#f5d293'
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 6
  ctx.fillText(message, w / 2, h - 20)
  ctx.restore()
}

function drawScene(ctx, video, landmarks, matched, progress, total, holdSec, message, debug) {
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

  if (landmarks) {
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

  drawRing(ctx, width, height, progress, matched, total, holdSec)
  if (debug && !matched) {
    drawDebug(ctx, width, height, debug, matched)
  } else {
    drawMessage(ctx, width, height, message, matched)
  }
}

function drawIntro(ctx, video, refImg, opacity) {
  const width = video.videoWidth || ctx.canvas.width || 640
  const height = video.videoHeight || ctx.canvas.height || 480
  if (ctx.canvas.width !== width) ctx.canvas.width = width
  if (ctx.canvas.height !== height) ctx.canvas.height = height

  if (video.readyState >= 2) {
    ctx.save()
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, width, height)
    ctx.restore()
  } else {
    ctx.fillStyle = '#190e04'
    ctx.fillRect(0, 0, width, height)
  }

  if (refImg && refImg.complete && refImg.naturalWidth > 0) {
    const scale = Math.max(width / refImg.naturalWidth, height / refImg.naturalHeight)
    const iw = refImg.naturalWidth * scale
    const ih = refImg.naturalHeight * scale
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.drawImage(refImg, (width - iw) / 2, (height - ih) / 2, iw, ih)
    ctx.restore()
  }
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    const error = new Error('no mediaDevices')
    error.name = 'NoMediaDevices'
    throw error
  }
  const tries = [
    { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: { facingMode: 'user' }, audio: false },
    { video: true, audio: false },
  ]
  let lastError
  for (const constraints of tries) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (error) {
      lastError = error
      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') break
    }
  }
  throw lastError
}

function cameraMessage(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'The camera is blocked. On the iPad open Settings, then Safari, then Camera, and choose Ask or Allow. Close the app, open it again, and tap Allow.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device.'
    case 'NotReadableError':
    case 'AbortError':
      return 'The camera is busy. Close other apps or Safari tabs that use the camera, then tap Start camera.'
    case 'NoMediaDevices':
      return 'This page cannot use the camera here. Open it from the https address in Safari.'
    default:
      return `The camera could not start. ${error?.message || ''}`.trim()
  }
}

function modelMessage(error) {
  return `The pose model could not load. It needs the internet the first time. Check the connection and tap Start camera. ${error?.message || ''}`.trim()
}

function playDing(audioCtx) {
  const now = audioCtx.currentTime
  const partials = [
    { freq: 880, gain: 1.0, decay: 0.8 },
    { freq: 1760, gain: 0.6, decay: 0.5 },
    { freq: 2640, gain: 0.25, decay: 0.35 },
    { freq: 4400, gain: 0.12, decay: 0.2 },
  ]
  partials.forEach(({ freq, gain: vol, decay }) => {
    const osc = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    g.gain.setValueAtTime(vol * 0.9, now)
    g.gain.exponentialRampToValueAtTime(0.001, now + decay)
    osc.connect(g)
    g.connect(audioCtx.destination)
    osc.start(now)
    osc.stop(now + decay + 0.05)
  })
}

function speak(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return }
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-IN'
    utt.pitch = 1.1
    utt.rate = 0.9
    const voices = speechSynthesis.getVoices()
    const female = voices.find((v) => /female|samantha|zira|google.*uk.*female|veena|rishi/i.test(v.name) && v.lang.startsWith('en'))
    if (female) utt.voice = female
    utt.onend = resolve
    utt.onerror = resolve
    setTimeout(resolve, 8000)
    speechSynthesis.speak(utt)
  })
}

export default function Session({ pose, step = 0, position, onComplete, tanpuraPlayer, dingOn = true, music, onToggleMusic, onExit, onOpenSettings, holdMs, dotColor, onHeldChange }) {
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
  const dingRef = useRef(dingOn)
  const lastDingRef = useRef(-1)
  const audioCtxRef = useRef(null)
  limitRef.current = holdMs
  dotRef.current = dotColor
  heldChangeRef.current = onHeldChange
  poseRef.current = pose
  dingRef.current = dingOn
  const [status, setStatus] = useState('intro')
  const [detail, setDetail] = useState('')
  const [phase, setPhase] = useState('')
  const startRef = useRef(null)
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
    lastDingRef.current = -1
    holdRef.current = { holdMs: 0, missMs: 0 }

    const refImg = new Image()
    refImg.crossOrigin = 'anonymous'
    refImg.src = `${import.meta.env.BASE_URL}${poseRef.current.image}`

    let introAnim = null
    let introOpacity = 0.85
    let introFading = false

    function drawIntroFrame() {
      if (stopped) return
      drawIntro(ctx, video, refImg, introOpacity)
      if (introFading) {
        introOpacity = Math.max(0, introOpacity - 0.03)
        if (introOpacity <= 0) return
      }
      introAnim = requestAnimationFrame(drawIntroFrame)
    }

    let starting = false
    let running = false

    async function start() {
      if (starting || running || stopped) return
      starting = true
      let step = 'camera'
      setStatus('intro')
      setDetail('')
      setPhase('')
      try {
        stream?.getTracks().forEach((track) => track.stop())
        stream = await openCamera()
        video.muted = true
        video.setAttribute('muted', '')
        video.setAttribute('playsinline', '')
        video.setAttribute('webkit-playsinline', '')
        video.srcObject = stream
        try { await video.play() } catch { /* iPad may refuse */ }
        if (stopped) return

        introAnim = requestAnimationFrame(drawIntroFrame)

        if (tanpuraPlayer) tanpuraPlayer.dip(0.25, 0.5)
        const currentPose = poseRef.current
        await speak(`${currentPose.name}. Let's practice ${currentPose.en}.`)
        if (tanpuraPlayer) tanpuraPlayer.restore(0.8)

        if (stopped) return
        step = 'model'
        setPhase('Loading the pose model.')
        setStatus('loading')
        if (!landmarker) {
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
        }
        if (stopped) return

        introFading = true
        await new Promise((r) => setTimeout(r, 800))
        if (introAnim) cancelAnimationFrame(introAnim)

        setStatus('')
        running = true
        last = performance.now()
        requestAnimationFrame(loop)
      } catch (error) {
        console.error(error)
        if (!stopped) {
          setDetail(step === 'camera' ? cameraMessage(error) : modelMessage(error))
          setStatus('error')
        }
      } finally {
        starting = false
      }
    }
    startRef.current = start

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

          const sec = Math.floor(next.holdMs / 1000)
          if (dingRef.current && next.matched && sec > lastDingRef.current && sec > 0) {
            if (!audioCtxRef.current) {
              const Ctx = window.AudioContext || window.webkitAudioContext
              audioCtxRef.current = new Ctx()
            }
            playDing(audioCtxRef.current)
          }
          lastDingRef.current = next.matched ? sec : -1

          const total = Math.max(1, Math.round(limitRef.current / 1000))
          const holdSec = (next.holdMs / 1000).toFixed(1)
          const progress = Math.min(100, (next.holdMs / limitRef.current) * 100)
          const message = next.done
            ? 'Complete!'
            : next.matched
              ? 'Stay steady.'
              : scored.visible
                ? 'Match the picture.'
                : 'Bring your whole body into the camera.'

          drawScene(ctx, video, landmarks, next.matched, progress, total, holdSec, message, scored.debug || null)
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
      if (introAnim) cancelAnimationFrame(introAnim)
      stream?.getTracks().forEach((track) => track.stop())
      landmarker?.close()
    }
  }, [])

  useEffect(() => {
    holdRef.current = { holdMs: 0, missMs: 0 }
    lastDingRef.current = -1
    setView({ holdMs: 0, matched: false, visible: false, done: false })
    wasHeldRef.current = false
    heldChangeRef.current?.(false)
  }, [pose.id, step])

  useEffect(() => {
    if (!view.done || !completeRef.current) return undefined
    const timer = setTimeout(() => completeRef.current?.(), 1400)
    return () => clearTimeout(timer)
  }, [view.done, pose.id, step])

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

      {status === 'loading' && <p className="status">{phase}</p>}
      {status === 'error' && (
        <div className="status">
          <p>{detail}</p>
          <button className="text-button retry" type="button" onClick={() => startRef.current?.()}>
            Start camera
          </button>
        </div>
      )}

      <div className="stage">
        <div className="camera-wrap">
          <video ref={videoRef} className="camera-source" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="camera" />
        </div>
        <figure className="portrait practice-portrait">
          <img src={`${import.meta.env.BASE_URL}${pose.image}`} alt={`Reference for ${pose.name}`} />
          <figcaption>Copy this pose</figcaption>
        </figure>
      </div>
    </main>
  )
}
