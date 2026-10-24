import { useEffect, useRef, useState } from 'react'
import * as poseDetection from '@tensorflow-models/pose-detection'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import { scoreClassicPose } from './embed'
import { TRANSITION_MS, startFlow, stepFlow, stepHold } from './flow'
import { StickFigure } from './figures'
import { LanguageToggle, poseLabel, useLanguage } from './language'
import { CLASSIC_MATCH_AT } from './poses'
import {
  MATCH_AT,
  SURYA_SEQUENCE,
  bodyIsVisible,
  scoreSuryaPose,
  suryaPose,
} from './suryaScore'
import { formatNumber } from './text'

const BONES = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['nose', 'left_shoulder'],
  ['nose', 'right_shoulder'],
]

const GRACE_MS = 400

function drawScene(ctx, video, keypoints, matched) {
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

  const color = matched ? '#1f8a4c' : '#f7f4ee'
  const byName = {}
  keypoints.forEach((point, index) => {
    byName[point.name || index] = point
  })

  ctx.lineWidth = Math.max(3, width / 180)
  ctx.lineCap = 'round'
  ctx.strokeStyle = color
  ctx.fillStyle = color
  BONES.forEach(([start, end]) => {
    const a = byName[start]
    const b = byName[end]
    if (!a || !b || a.score < 0.3 || b.score < 0.3) return
    ctx.beginPath()
    ctx.moveTo(width - a.x, a.y)
    ctx.lineTo(width - b.x, b.y)
    ctx.stroke()
  })
  keypoints.forEach((point) => {
    if (!point || point.score < 0.3 || point.name?.includes('eye')) return
    ctx.beginPath()
    ctx.arc(width - point.x, point.y, Math.max(4, width / 140), 0, Math.PI * 2)
    ctx.fill()
  })
}

export default function Session({ mode, pose, onExit }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const flowRef = useRef(startFlow(SURYA_SEQUENCE.length))
  const holdRef = useRef(0)
  const missRef = useRef(0)
  const [facingMode, setFacingMode] = useState('user')
  const [status, setStatus] = useState('loading')
  const [view, setView] = useState({
    phase: 'pose',
    index: 0,
    holdMs: 0,
    transitionMs: 0,
    done: false,
    score: 0,
    matched: false,
    visible: false,
  })

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let stopped = false
    let busy = false
    let detector
    let classicModel
    let stream
    let frame = 0
    let last = performance.now()
    flowRef.current = startFlow(SURYA_SEQUENCE.length)
    holdRef.current = 0
    missRef.current = 0

    async function start() {
      try {
        await tf.setBackend('webgl')
        await tf.ready()
        detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
        })
        if (mode === 'classic') {
          classicModel = await tf.loadLayersModel(`${import.meta.env.BASE_URL}models/classic/model.json`)
        }
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        video.srcObject = stream
        video.playsInline = true
        video.muted = true
        await video.play()
        setStatus('')
        frame = requestAnimationFrame(loop)
      } catch (error) {
        console.error(error)
        setStatus('error')
      }
    }

    async function loop(now) {
      if (stopped) return
      if (!busy && video.readyState >= 2) {
        const dt = Math.min(250, now - last)
        last = now
        busy = true
        try {
          const poses = await detector.estimatePoses(video, { flipHorizontal: false })
          const keypoints = poses[0]?.keypoints || []
          const visible = bodyIsVisible(keypoints)
          let rawScore = 0
          let rawMatched = false

          if (mode === 'surya') {
            const current = flowRef.current
            if (!current.done && current.phase === 'pose') {
              const poseId = SURYA_SEQUENCE[current.index]
              rawScore = scoreSuryaPose(poseId, keypoints)
              rawMatched = visible && rawScore >= MATCH_AT
            }
          } else if (classicModel && visible) {
            const scores = await scoreClassicPose(classicModel, keypoints)
            rawScore = scores[pose.index] || 0
            rawMatched = rawScore >= CLASSIC_MATCH_AT
          }

          if (rawMatched) missRef.current = 0
          else missRef.current += dt
          const holding = mode === 'surya' ? flowRef.current.holdMs : holdRef.current
          const matched = rawMatched || (holding > 0 && missRef.current < GRACE_MS)

          if (mode === 'surya') {
            flowRef.current = stepFlow(flowRef.current, matched && flowRef.current.phase === 'pose', dt)
          } else {
            holdRef.current = stepHold(holdRef.current, matched, dt)
          }

          drawScene(ctx, video, keypoints, rawMatched)
          const nextView = mode === 'surya'
            ? {
              ...flowRef.current,
              score: rawScore,
              matched: rawMatched,
              visible,
            }
            : {
              phase: 'pose',
              index: 0,
              holdMs: holdRef.current,
              transitionMs: 0,
              done: false,
              score: rawScore,
              matched: rawMatched,
              visible,
            }
          setView((current) => {
            const sameHold = Math.floor(current.holdMs / 100) === Math.floor(nextView.holdMs / 100)
            const sameTransition = Math.floor(current.transitionMs / 100) === Math.floor(nextView.transitionMs / 100)
            if (
              sameHold &&
              sameTransition &&
              current.phase === nextView.phase &&
              current.index === nextView.index &&
              current.done === nextView.done &&
              current.matched === nextView.matched &&
              current.visible === nextView.visible &&
              Math.abs(current.score - nextView.score) < 0.05
            ) {
              return current
            }
            return nextView
          })
        } catch (error) {
          console.error(error)
        } finally {
          busy = false
        }
      }
      frame = requestAnimationFrame(loop)
    }

    start()
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((track) => track.stop())
      detector?.dispose?.()
      classicModel?.dispose?.()
    }
  }, [facingMode, mode, pose])

  const { t, lang } = useLanguage()
  const suryaIndex = Math.min(view.index, SURYA_SEQUENCE.length - 1)
  const currentId = mode === 'surya' ? SURYA_SEQUENCE[suryaIndex] : pose.figure
  const nextId = mode === 'surya' ? SURYA_SEQUENCE[view.index + 1] : null
  const current = poseLabel(mode === 'surya' ? suryaPose(currentId) : pose, lang)
  const progress = view.phase === 'transition' ? view.transitionMs / TRANSITION_MS : 0
  const seconds = formatNumber((view.holdMs / 1000).toFixed(1), lang)
  const countLabel = `${formatNumber(Math.min(view.index + 1, SURYA_SEQUENCE.length), lang)} / ${formatNumber(SURYA_SEQUENCE.length, lang)}`

  let message = current.hint
  if (status === 'loading') message = t.loading
  else if (status === 'error') message = t.failed
  else if (view.done) message = t.complete
  else if (!view.visible) message = t.fullBody
  else if (view.phase === 'transition') message = t.next
  else if (view.matched) message = t.hold
  else message = current.hint

  return (
    <main className="session">
      <header className="topbar">
        <button className="text-button" type="button" onClick={onExit}>{t.back}</button>
        <div className="title">
          <p className="eyebrow">{mode === 'surya' ? `${t.surya} · ${countLabel}` : t.pose}</p>
          <h1>{view.done ? t.done : current.name}</h1>
        </div>
        <div className="top-actions">
          <LanguageToggle />
          <button
            className="text-button"
            type="button"
            onClick={() => setFacingMode((value) => (value === 'user' ? 'environment' : 'user'))}
          >
            {t.camera}
          </button>
        </div>
      </header>

      <section className="stage">
        <div className="guide">
          <p className="sample-label">{t.sample}</p>
          <StickFigure
            figure={currentId}
            next={view.phase === 'transition' ? nextId : null}
            progress={progress}
            label={current.name}
          />
          <p className="sample-name">{view.done ? t.done : current.name}</p>
          <p>{message}</p>
        </div>
        <div className="camera-wrap">
          <video ref={videoRef} className="camera-source" playsInline muted />
          <canvas ref={canvasRef} className="camera" />
        </div>
      </section>

      <footer className="meter">
        <div className="meter-row">
          <span>{view.phase === 'transition' ? t.changing : `${seconds} / ${t.holdLimit}`}</span>
          <span>{view.visible ? `${t.match} ${formatNumber(Math.round(view.score * 100), lang)}` : ''}</span>
        </div>
        <div className="track">
          <div
            className={view.matched ? 'fill good' : 'fill'}
            style={{ width: `${Math.min(100, (view.holdMs / 4000) * 100)}%` }}
          />
        </div>
      </footer>
    </main>
  )
}
