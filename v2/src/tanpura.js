const VIDEO_ID = 'e66mCMLj7yI'

function loadApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (window.__tanpuraApi) return window.__tanpuraApi
  window.__tanpuraApi = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous()
      resolve(window.YT)
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return window.__tanpuraApi
}

export function createTanpura(elementId) {
  let player = null
  let playing = false
  let ready = null

  function ensure() {
    if (ready) return ready
    ready = loadApi().then((YT) => new Promise((resolve) => {
      player = new YT.Player(elementId, {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 0,
          loop: 1,
          playlist: VIDEO_ID,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => resolve(player),
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) player.playVideo()
            playing = event.data === YT.PlayerState.PLAYING
          },
        },
      })
    }))
    return ready
  }

  return {
    get playing() {
      return playing
    },
    mount() {
      return ensure()
    },
    async start() {
      const active = await ensure()
      active.unMute?.()
      active.setVolume?.(80)
      active.playVideo()
      playing = true
    },
    async stop() {
      player?.pauseVideo()
      playing = false
    },
  }
}
