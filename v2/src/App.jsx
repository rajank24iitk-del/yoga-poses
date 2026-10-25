import { useEffect, useRef, useState } from 'react'
import Session, { unlockSpeech } from './Session'
import { createTanpura } from './tanpura'
import { ASANAS, MODES, alphabetical, asanaById, sequenceFor } from './asanas'

const STORAGE_KEY = 'vrikshasanam-settings'

export const THEMES = {
  gold: {
    name: 'Metallic Gold',
    paper: '#241506',
    ink: '#fff7e6',
    muted: '#f5d293',
    accent: '#e5a43b',
    buttonInk: '#261203',
    camera: '#190e04',
    track: 'rgba(255, 219, 150, 0.24)',
    dot: '#ffd26a',
    tint: 'rgba(44, 24, 5, 0.26)',
    glow: 'rgba(255, 196, 82, 0.52)',
    border: 'rgba(255, 226, 164, 0.56)',
    surface: 'linear-gradient(135deg, rgba(255, 236, 190, 0.30) 0%, rgba(212, 142, 42, 0.20) 52%, rgba(78, 42, 8, 0.38) 100%)',
    metalText: 'linear-gradient(180deg, #fffef9 0%, #ffe6a8 38%, #d89228 78%, #fff1c2 100%)',
    flute: 'repeating-linear-gradient(90deg, rgba(255, 232, 178, 0.18) 0px, rgba(255, 248, 224, 0.36) 6px, rgba(92, 48, 8, 0.24) 13px, rgba(255, 214, 136, 0.12) 20px)',
  },
  bronze: {
    name: 'Burnished Bronze',
    paper: '#2b1307',
    ink: '#fff4e8',
    muted: '#f4c08e',
    accent: '#df7e26',
    buttonInk: '#260e03',
    camera: '#1c0b04',
    track: 'rgba(255, 196, 142, 0.25)',
    dot: '#ff9e44',
    tint: 'rgba(64, 24, 6, 0.32)',
    glow: 'rgba(255, 148, 56, 0.5)',
    border: 'rgba(255, 212, 166, 0.52)',
    surface: 'linear-gradient(135deg, rgba(255, 224, 190, 0.28) 0%, rgba(198, 102, 28, 0.22) 52%, rgba(74, 28, 6, 0.40) 100%)',
    metalText: 'linear-gradient(180deg, #fffdf8 0%, #ffd6a6 40%, #cf6e1c 78%, #ffe8c8 100%)',
    flute: 'repeating-linear-gradient(90deg, rgba(255, 216, 174, 0.18) 0px, rgba(255, 240, 220, 0.34) 6px, rgba(88, 34, 8, 0.26) 13px, rgba(255, 192, 128, 0.12) 20px)',
  },
  emerald: {
    name: 'Metallic Emerald',
    paper: '#0d2618',
    ink: '#f2fff6',
    muted: '#b8ecc8',
    accent: '#38b870',
    buttonInk: '#062012',
    camera: '#081910',
    track: 'rgba(168, 240, 194, 0.26)',
    dot: '#62f09c',
    tint: 'rgba(10, 44, 24, 0.32)',
    glow: 'rgba(82, 228, 142, 0.5)',
    border: 'rgba(182, 248, 206, 0.54)',
    surface: 'linear-gradient(135deg, rgba(210, 255, 226, 0.28) 0%, rgba(52, 164, 102, 0.22) 52%, rgba(12, 48, 28, 0.42) 100%)',
    metalText: 'linear-gradient(180deg, #fafffc 0%, #c6f7d6 40%, #3aa868 78%, #e4ffec 100%)',
    flute: 'repeating-linear-gradient(90deg, rgba(188, 246, 208, 0.18) 0px, rgba(232, 255, 240, 0.35) 6px, rgba(14, 58, 32, 0.26) 13px, rgba(148, 232, 180, 0.12) 20px)',
  },
}

const HELD = {
  paper: '#0c2919',
  ink: '#f3fff7',
  muted: '#c4f5d4',
  accent: '#39c474',
  buttonInk: '#052112',
  camera: '#071b10',
  track: 'rgba(164, 248, 196, 0.34)',
  dot: '#58f59a',
  tint: 'rgba(10, 52, 28, 0.32)',
  glow: 'rgba(78, 238, 144, 0.68)',
  border: 'rgba(190, 255, 214, 0.68)',
  surface: 'linear-gradient(135deg, rgba(210, 255, 226, 0.32) 0%, rgba(54, 178, 106, 0.26) 52%, rgba(10, 52, 28, 0.46) 100%)',
  metalText: 'linear-gradient(180deg, #ffffff 0%, #cbfce0 38%, #38b46b 78%, #e8fff0 100%)',
  flute: 'repeating-linear-gradient(90deg, rgba(190, 252, 212, 0.20) 0px, rgba(236, 255, 242, 0.38) 6px, rgba(12, 62, 34, 0.26) 13px, rgba(154, 240, 186, 0.14) 20px)',
}

function snapSeconds(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 10
  return Math.min(60, Math.max(5, Math.round(n / 5) * 5))
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      seconds: snapSeconds(saved.seconds ?? 10),
      tanpura: saved.tanpura !== false,
      ding: saved.ding !== false,
      theme: THEMES[saved.theme] ? saved.theme : 'gold',
    }
  } catch {
    return { seconds: 10, tanpura: true, ding: true, theme: 'gold' }
  }
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M4 7h16M4 12h16M4 17h11"
      />
    </svg>
  )
}

function SoundIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4a3.5 3.5 0 0 0-3.5 3.5v4a3.5 3.5 0 0 0 7 0v-4A3.5 3.5 0 0 0 12 4Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d={active ? 'M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3M9 20h6' : 'M6.5 11.5a5.5 5.5 0 0 0 11 0M4 4l16 16'}
      />
    </svg>
  )
}

function LotusIcon() {
  return (
    <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 6c2.6 3.5 4 6.8 4 10.2 0 3.2-1.8 5.8-4 6.8-2.2-1-4-3.6-4-6.8C12 12.8 13.4 9.5 16 6Zm0 17c3.8-.3 7.2-2.6 8.8-6.8-2.7-.2-4.8.7-6.3 2.2M16 23c-3.8-.3-7.2-2.6-8.8-6.8 2.7-.2 4.8.7 6.3 2.2M7 25.5c2.7 1.2 5.7 1.8 9 1.8s6.3-.6 9-1.8"
      />
    </svg>
  )
}

function HourglassIcon() {
  return (
    <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5.5h14M9 26.5h14M10.5 5.5c0 5.2 2.4 7.8 5.5 10.5-3.1 2.7-5.5 5.3-5.5 10.5M21.5 5.5c0 5.2-2.4 7.8-5.5 10.5 3.1 2.7 5.5 5.3 5.5 10.5"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 6 6 6-6 6"
      />
    </svg>
  )
}

export default function App() {
  const tanpura = useRef(null)
  if (!tanpura.current) tanpura.current = createTanpura()
  const initial = useRef(null)
  if (!initial.current) initial.current = loadSettings()
  const [screen, setScreen] = useState('home')
  const [poseId, setPoseId] = useState(ASANAS[0].id)
  const [mode, setMode] = useState('single')
  const [queue, setQueue] = useState(null)
  const [step, setStep] = useState(0)
  const [seconds, setSeconds] = useState(initial.current.seconds)
  const [tanpuraOn, setTanpuraOn] = useState(initial.current.tanpura)
  const [dingOn, setDingOn] = useState(initial.current.ding)
  const [theme, setTheme] = useState(initial.current.theme)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [held, setHeld] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ seconds, tanpura: tanpuraOn, ding: dingOn, theme }))
  }, [seconds, tanpuraOn, dingOn, theme])

  useEffect(() => {
    function autoStart() {
      unlockSpeech()
      if (tanpura.current.playing) return
      tanpura.current.start().then(() => {
        setPlaying(true)
        setTanpuraOn(true)
      }).catch(() => {})
    }
    window.addEventListener('click', autoStart, { once: true })
    window.addEventListener('touchstart', autoStart, { once: true })
    return () => {
      window.removeEventListener('click', autoStart)
      window.removeEventListener('touchstart', autoStart)
    }
  }, [])

  async function setTanpura(next) {
    setTanpuraOn(next)
    if (next) {
      try {
        await tanpura.current.start()
        setPlaying(true)
      } catch (error) {
        console.error(error)
        setTanpuraOn(false)
        setPlaying(false)
      }
      return
    }
    await tanpura.current.stop()
    setPlaying(false)
  }

  function begin() {
    unlockSpeech()
    setHeld(false)
    setScreen('asanas')
    if (!tanpura.current.playing) {
      tanpura.current.start().then(() => {
        setPlaying(true)
        setTanpuraOn(true)
      }).catch((error) => {
        console.error(error)
      })
    }
  }

  function openAsana(id) {
    unlockSpeech()
    setHeld(false)
    setQueue(null)
    setStep(0)
    setPoseId(id)
    setScreen('practice')
  }

  function startSequence() {
    unlockSpeech()
    const order = sequenceFor(mode)
    if (!order) return
    setHeld(false)
    setQueue(order)
    setStep(0)
    setPoseId(order[0])
    setScreen('practice')
  }

  function nextInSequence() {
    if (!queue) return
    if (step + 1 >= queue.length) {
      setHeld(false)
      setQueue(null)
      setStep(0)
      setScreen('asanas')
      return
    }
    setStep(step + 1)
    setPoseId(queue[step + 1])
  }

  function navigableList() {
    if (queue) return null
    if (mode === 'alphabetical') return alphabetical()
    return ASANAS.slice(0, 7)
  }

  function navigatePose(direction) {
    if (queue) {
      const next = step + direction
      if (next < 0 || next >= queue.length) return
      setHeld(false)
      setStep(next)
      setPoseId(queue[next])
      return
    }
    const list = navigableList()
    if (!list) return
    const idx = list.findIndex((a) => a.id === poseId)
    const next = (idx + direction + list.length) % list.length
    setHeld(false)
    setPoseId(list[next].id)
  }

  const pose = asanaById(poseId)
  const baseTheme = THEMES[theme] || THEMES.gold
  const isGreen = (held && screen === 'practice') || theme === 'emerald'
  const palette = held && screen === 'practice' ? { ...baseTheme, ...HELD } : baseTheme
  const style = {
    '--paper': palette.paper,
    '--ink': palette.ink,
    '--muted': palette.muted,
    '--accent': palette.accent,
    '--button-ink': palette.buttonInk,
    '--camera': palette.camera,
    '--track': palette.track,
    '--tint': palette.tint,
    '--glow': palette.glow,
    '--border': palette.border,
    '--surface': palette.surface,
    '--metal-text': palette.metalText,
    '--flute': palette.flute,
    '--studio-gold-bg': `url('${import.meta.env.BASE_URL}golden-hour.jpg')`,
    '--studio-green-bg': `url('${import.meta.env.BASE_URL}metallic-green.jpg')`,
  }

  return (
    <div className={`shell${isGreen ? ' held' : ''}`} style={style}>
      <div className="studio-backdrop" aria-hidden="true">
        <div className="backdrop-layer backdrop-gold" />
        <div className="backdrop-layer backdrop-green" />
        <div className="sun-wash" />
      </div>

      {screen === 'home' ? (
        <main className="home">
          <header className="home-top">
            <button
              className="glass-orb-btn"
              type="button"
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <MenuIcon />
            </button>

            <div className="brand-lockup">
              <h1 className="brand-title">YOGA</h1>
              <div className="brand-rule" aria-hidden="true">
                <span className="rule-line" />
                <span className="rule-diamond" />
                <span className="rule-line" />
              </div>
              <p className="brand-subtitle">Asana Studio • योग</p>
            </div>

            <button
              className={`glass-orb-btn${playing ? ' active' : ''}`}
              type="button"
              aria-label={playing ? 'Tanpura playing' : 'Play tanpura'}
              title={playing ? 'Tanpura playing (C#)' : 'Play C# tanpura'}
              onClick={() => setTanpura(!playing)}
            >
              <SoundIcon active={playing} />
            </button>
          </header>

          <section className="hero-cards" aria-label="Studio options">
            <button className="glass-tile" type="button" onClick={begin}>
              <span className="tile-icon">
                <LotusIcon />
              </span>
              <span className="tile-copy">
                <strong>Guided Pose Sequence</strong>
                <small>Seven asanas • सात आसन</small>
              </span>
              <span className="tile-arrow">
                <ChevronRight />
              </span>
            </button>

            <button className="glass-tile" type="button" onClick={() => setSettingsOpen(true)}>
              <span className="tile-icon">
                <HourglassIcon />
              </span>
              <span className="tile-copy">
                <strong>Mindful Hold Timer</strong>
                <small>
                  Hold with awareness • {seconds}s • C# Tanpura {playing ? 'playing' : tanpuraOn ? 'on' : 'off'}
                </small>
              </span>
              <span className="tile-arrow">
                <ChevronRight />
              </span>
            </button>
          </section>

          <footer className="home-cta">
            <button className="begin-amber" type="button" onClick={begin}>
              <span>BEGIN</span>
            </button>
            <p className="note">
              Choose an asana. The dots and studio shift from metallic gold to metallic emerald when the pose is right.
            </p>
          </footer>
        </main>
      ) : screen === 'asanas' ? (
        <main className="home asana-home">
          <header className="home-top">
            <button className="text-button" type="button" onClick={() => setScreen('home')}>Back</button>
            <div className="brand-lockup">
              <p className="sanskrit small">आसन</p>
              <h1 className="metallic-heading asana-title">Choose an asana</h1>
            </div>
            <button
              className={`glass-orb-btn${playing ? ' active' : ''}`}
              type="button"
              aria-label={playing ? 'Tanpura playing' : 'Play tanpura'}
              onClick={() => setTanpura(!playing)}
            >
              <SoundIcon active={playing} />
            </button>
          </header>
          <div className="mode-picker">
            <label htmlFor="mode-select">Practice</label>
            <select id="mode-select" value={mode} onChange={(event) => setMode(event.target.value)}>
              {MODES.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
          {sequenceFor(mode) ? (
            <section className="asana-list" aria-label="Sequence">
              <ol className="sequence-steps">
                {sequenceFor(mode).map((id, index) => {
                  const item = asanaById(id)
                  return (
                    <li key={`${id}-${index}`}>
                      <span className="step-no">{index + 1}</span>
                      <img src={`${import.meta.env.BASE_URL}${item.image}`} alt="" />
                      <span className="tile-copy">
                        <strong>{item.hi}</strong>
                        <small>{item.name}</small>
                      </span>
                    </li>
                  )
                })}
              </ol>
              <p className="note sequence-note">
                Each asana moves on after the hold turns green for {seconds} seconds. Change the hold time in Settings.
              </p>
              <button className="begin-amber sequence-start" type="button" onClick={startSequence}>
                <span>START</span>
              </button>
            </section>
          ) : (
            <section className="asana-list" aria-label="Asanas">
              {(mode === 'alphabetical' ? alphabetical() : ASANAS.slice(0, 7)).map((item) => (
                <button key={item.id} className="glass-tile asana-tile" type="button" onClick={() => openAsana(item.id)}>
                  <img src={`${import.meta.env.BASE_URL}${item.image}`} alt="" />
                  <span className="tile-copy">
                    <strong>{item.hi}</strong>
                    <small>{item.name} • {item.en}</small>
                  </span>
                  <span className="tile-arrow">
                    <ChevronRight />
                  </span>
                </button>
              ))}
            </section>
          )}
        </main>
      ) : (
        <Session
          pose={pose}
          step={step}
          position={queue ? { index: step + 1, total: queue.length } : null}
          onComplete={queue ? nextInSequence : null}
          tanpuraPlayer={tanpura.current}
          dingOn={dingOn}
          onPrev={queue ? (step > 0 ? () => navigatePose(-1) : null) : () => navigatePose(-1)}
          onNext={queue ? (step < queue.length - 1 ? () => navigatePose(1) : null) : () => navigatePose(1)}
          music={playing}
          onToggleMusic={() => setTanpura(!playing)}
          onExit={() => {
            setHeld(false)
            setScreen('asanas')
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          holdMs={seconds * 1000}
          dotColor={baseTheme.dot}
          onHeldChange={setHeld}
        />
      )}

      {settingsOpen && (
        <div className="settings-layer" onClick={() => setSettingsOpen(false)}>
          <div
            className="settings"
            role="dialog"
            aria-label="Settings"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-top">
              <h2>Studio Settings</h2>
              <button className="text-button" type="button" onClick={() => setSettingsOpen(false)}>Close</button>
            </div>
            <div className="setting">
              <p>Hold timer</p>
              <div className="stepper">
                <button type="button" onClick={() => setSeconds((value) => snapSeconds(value - 5))} disabled={seconds <= 5} aria-label="Shorter hold">−</button>
                <strong>{seconds} seconds</strong>
                <button type="button" onClick={() => setSeconds((value) => snapSeconds(value + 5))} disabled={seconds >= 60} aria-label="Longer hold">+</button>
              </div>
            </div>
            <div className="setting">
              <p>Tanpura</p>
              <button
                className="switch"
                type="button"
                role="switch"
                aria-checked={tanpuraOn}
                onClick={() => setTanpura(!tanpuraOn)}
              >
                {tanpuraOn ? 'On' : 'Off'}
              </button>
            </div>
            <div className="setting">
              <p>Ding each second</p>
              <button
                className="switch"
                type="button"
                role="switch"
                aria-checked={dingOn}
                onClick={() => setDingOn(!dingOn)}
              >
                {dingOn ? 'On' : 'Off'}
              </button>
            </div>
            <p className="credit">
              C# tanpura by iternetcone on Freesound, CC BY 4.0.
            </p>
            <div className="setting">
              <p>Finish</p>
              <div className="swatches">
                {Object.entries(THEMES).map(([id, item]) => (
                  <button
                    key={id}
                    type="button"
                    className={id === theme ? 'swatch chosen' : 'swatch'}
                    style={{ background: item.metalText, color: item.buttonInk }}
                    aria-pressed={id === theme}
                    onClick={() => setTheme(id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
