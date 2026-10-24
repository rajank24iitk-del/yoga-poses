const SA = 138.591315
const PA = SA * 1.5
const SA_HIGH = SA * 2
const GAP = 0.9

function pluck(ctx, master, freq, time, amount) {
  const tone = ctx.createOscillator()
  const shade = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  tone.type = 'sawtooth'
  shade.type = 'triangle'
  tone.frequency.value = freq
  shade.frequency.value = freq * 1.004
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1600, time)
  filter.frequency.exponentialRampToValueAtTime(380, time + 1.8)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(amount, time + 0.018)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.4)
  tone.connect(filter)
  shade.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  tone.start(time)
  shade.start(time)
  tone.stop(time + 2.6)
  shade.stop(time + 2.6)
}

export function createTanpura() {
  let ctx = null
  let timer = 0
  let playing = false

  function cycle(start) {
    pluck(ctx, ctx.master, PA, start, 0.11)
    pluck(ctx, ctx.master, SA, start + GAP, 0.13)
    pluck(ctx, ctx.master, SA, start + GAP * 2, 0.11)
    pluck(ctx, ctx.master, SA_HIGH, start + GAP * 3, 0.09)
  }

  return {
    get playing() {
      return playing
    },
    async start() {
      if (playing) return
      ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = 0.42
      master.connect(ctx.destination)
      ctx.master = master
      if (ctx.state === 'suspended') await ctx.resume()
      playing = true
      const loop = () => {
        if (!playing || !ctx) return
        cycle(ctx.currentTime + 0.05)
        timer = window.setTimeout(loop, GAP * 4 * 1000)
      }
      loop()
    },
    async stop() {
      playing = false
      window.clearTimeout(timer)
      if (ctx) {
        await ctx.close()
        ctx = null
      }
    },
  }
}
