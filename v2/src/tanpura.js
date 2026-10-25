const SRC = `${import.meta.env.BASE_URL}tanpura-c-sharp.mp3`

export function createTanpura() {
  let audio = null
  let playing = false

  return {
    get playing() {
      return playing && audio && !audio.paused
    },
    async start() {
      if (!audio) {
        audio = new Audio(SRC)
        audio.loop = true
        audio.preload = 'auto'
        audio.volume = 0.85
      }
      if (!audio.paused) {
        playing = true
        return
      }
      await audio.play()
      playing = true
    },
    async stop() {
      playing = false
      if (!audio) return
      audio.pause()
      audio.currentTime = 0
    },
  }
}
