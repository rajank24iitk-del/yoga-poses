const SRC = `${import.meta.env.BASE_URL}tanpura-c-sharp.mp3`
const FADE = 2.5
const VOLUME = 0.85

function monoAt(buffer, targetRate) {
  const factor = Math.max(1, Math.floor(buffer.sampleRate / targetRate))
  const length = Math.floor(buffer.length / factor)
  const out = new Float32Array(length)
  const channels = []
  for (let c = 0; c < buffer.numberOfChannels; c += 1) channels.push(buffer.getChannelData(c))
  for (let i = 0; i < length; i += 1) {
    let sum = 0
    const base = i * factor
    for (let k = 0; k < factor; k += 1) {
      for (let c = 0; c < channels.length; c += 1) sum += channels[c][base + k]
    }
    out[i] = sum / (factor * channels.length)
  }
  return { data: out, rate: buffer.sampleRate / factor }
}

function correlation(x, a, b, width) {
  let dot = 0
  let ea = 0
  let eb = 0
  for (let i = 0; i < width; i += 1) {
    const p = x[a + i]
    const q = x[b + i]
    dot += p * q
    ea += p * p
    eb += q * q
  }
  const denom = Math.sqrt(ea * eb)
  return denom < 1e-9 ? 0 : dot / denom
}

export function loopScore(buffer, start, lag, fade) {
  const { data, rate } = monoAt(buffer, 4000)
  const a = Math.round(start * rate)
  const b = Math.round((start + lag) * rate)
  const width = Math.round(fade * rate)
  if (b + width > data.length) return 0
  return correlation(data, a, b, width)
}

// Finds where the recording best repeats itself, so the end can melt into the start.
export function findLoop(buffer, fade = FADE) {
  const total = buffer.duration
  const safeFade = Math.min(fade, total / 4)
  const fallback = { start: 0, lag: Math.max(1, total - safeFade - 0.05), fade: safeFade, score: 0 }
  if (total < safeFade * 3 + 1) return fallback

  const coarse = monoAt(buffer, 1000)
  const x = coarse.data
  const rate = coarse.rate
  const width = Math.round(safeFade * rate)
  const minLag = Math.round(Math.max(total * 0.5, safeFade * 2) * rate)
  let best = { score: -2, start: 0, lag: 0 }

  for (let s = 0; s <= 2.0; s += 0.5) {
    const a = Math.round(s * rate)
    const maxLag = x.length - width - a - 1
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      const score = correlation(x, a, a + lag, width)
      if (score > best.score) best = { score, start: s, lag: lag / rate }
    }
  }
  if (best.score < 0.05) return fallback

  const fine = monoAt(buffer, 8000)
  const fx = fine.data
  const frate = fine.rate
  const fwidth = Math.round(safeFade * frate)
  const a = Math.round(best.start * frate)
  const centre = Math.round(best.lag * frate)
  let refined = { score: -2, lag: best.lag }
  for (let lag = centre - 24; lag <= centre + 24; lag += 1) {
    if (a + lag + fwidth > fx.length) continue
    const score = correlation(fx, a, a + lag, fwidth)
    if (score > refined.score) refined = { score, lag: lag / frate }
  }
  return { start: best.start, lag: refined.lag, fade: safeFade, score: refined.score }
}

function curves(points = 96) {
  const fadeIn = new Float32Array(points)
  const fadeOut = new Float32Array(points)
  for (let i = 0; i < points; i += 1) {
    const t = i / (points - 1)
    fadeIn[i] = Math.sin((t * Math.PI) / 2)
    fadeOut[i] = Math.cos((t * Math.PI) / 2)
  }
  return { fadeIn, fadeOut }
}

export function createTanpura() {
  let ctx = null
  let master = null
  let buffer = null
  let loop = null
  let timer = null
  let nextAt = 0
  let on = false
  let token = 0
  let sources = []
  const shape = curves()

  function launch(at, first) {
    const src = ctx.createBufferSource()
    const gain = ctx.createGain()
    src.buffer = buffer
    src.connect(gain)
    gain.connect(master)
    const length = loop.lag + loop.fade
    const rise = first ? 0.5 : loop.fade
    gain.gain.setValueAtTime(0, at)
    gain.gain.setValueCurveAtTime(shape.fadeIn, at, rise)
    gain.gain.setValueCurveAtTime(shape.fadeOut, at + length - loop.fade, loop.fade)
    src.start(at, loop.start, length)
    src.stop(at + length + 0.05)
    const entry = { src, gain }
    sources.push(entry)
    src.onended = () => {
      sources = sources.filter((item) => item !== entry)
      gain.disconnect()
    }
  }

  function pump() {
    if (!on) return
    while (nextAt - ctx.currentTime < 4) {
      launch(nextAt, false)
      nextAt += loop.lag
    }
  }

  async function load() {
    if (buffer) return
    const response = await fetch(SRC)
    const bytes = await response.arrayBuffer()
    buffer = await new Promise((resolve, reject) => {
      ctx.decodeAudioData(bytes, resolve, reject)
    })
    loop = findLoop(buffer)
  }

  return {
    get playing() {
      return on
    },
    async start() {
      if (on) return
      const mine = ++token
      if (typeof navigator !== 'undefined' && navigator.audioSession) {
        try {
          navigator.audioSession.type = 'playback'
        } catch {
          // older Safari: nothing to set
        }
      }
      if (!ctx) {
        const Context = window.AudioContext || window.webkitAudioContext
        ctx = new Context()
        master = ctx.createGain()
        master.connect(ctx.destination)
      }
      const resumed = ctx.resume()
      await load()
      await resumed
      if (mine !== token) return
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setValueAtTime(VOLUME, ctx.currentTime)
      on = true
      nextAt = ctx.currentTime + 0.05
      launch(nextAt, true)
      nextAt += loop.lag
      pump()
      timer = setInterval(pump, 500)
    },
    async stop() {
      token += 1
      on = false
      clearInterval(timer)
      timer = null
      if (!ctx || !master) return
      const now = ctx.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(0, now + 0.25)
      const old = sources
      sources = []
      setTimeout(() => {
        old.forEach(({ src }) => {
          try {
            src.stop()
          } catch {
            // already finished
          }
        })
      }, 320)
    },
  }
}
