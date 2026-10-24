import { useEffect, useRef, useState } from 'react'
import Session from './Session'
import { createTanpura } from './tanpura'

const STORAGE_KEY = 'vrikshasanam-settings'

export const THEMES = {
  orange: {
    name: 'Orange',
    paper: '#ef8a32',
    ink: '#3d2418',
    muted: '#6b3010',
    accent: '#c45a12',
    buttonInk: '#fff6ee',
    camera: '#e07020',
    track: '#f2b56a',
    dot: '#ef8a32',
  },
  sage: {
    name: 'Sage',
    paper: '#8eae96',
    ink: '#1c3324',
    muted: '#234232',
    accent: '#2f6b45',
    buttonInk: '#f4fff6',
    camera: '#6e9478',
    track: '#c5dccb',
    dot: '#2f6b45',
  },
  sand: {
    name: 'Sand',
    paper: '#e4c9a4',
    ink: '#3d2418',
    muted: '#6b4a3a',
    accent: '#a86b3c',
    buttonInk: '#fff6ee',
    camera: '#d4b48a',
    track: '#f0ddc4',
    dot: '#c4844a',
  },
}

const HELD = {
  paper: '#d7eadc',
  ink: '#143324',
  muted: '#1f7a45',
  accent: '#1f7a45',
  buttonInk: '#f4fff6',
  camera: '#b7d4c0',
  track: '#b7d7c2',
  dot: '#1f7a45',
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
      theme: THEMES[saved.theme] ? saved.theme : 'orange',
    }
  } catch {
    return { seconds: 10, tanpura: true, theme: 'orange' }
  }
}

function Gear() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.51.4 1.05.71 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
    </svg>
  )
}

export default function App() {
  const tanpura = useRef(null)
  if (!tanpura.current) tanpura.current = createTanpura()
  const initial = useRef(null)
  if (!initial.current) initial.current = loadSettings()
  const [screen, setScreen] = useState('home')
  const [seconds, setSeconds] = useState(initial.current.seconds)
  const [tanpuraOn, setTanpuraOn] = useState(initial.current.tanpura)
  const [theme, setTheme] = useState(initial.current.theme)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [held, setHeld] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ seconds, tanpura: tanpuraOn, theme }))
  }, [seconds, tanpuraOn, theme])

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
    setHeld(false)
    setScreen('practice')
    if (tanpuraOn && !tanpura.current.playing) {
      tanpura.current.start().then(() => setPlaying(true)).catch((error) => {
        console.error(error)
        setTanpuraOn(false)
        setPlaying(false)
      })
    }
  }

  const palette = held && screen === 'practice' ? { ...THEMES[theme], ...HELD } : THEMES[theme]
  const style = {
    '--paper': palette.paper,
    '--ink': palette.ink,
    '--muted': palette.muted,
    '--accent': palette.accent,
    '--button-ink': palette.buttonInk,
    '--camera': palette.camera,
    '--track': palette.track,
  }

  return (
    <div className={`shell${held && screen === 'practice' ? ' held' : ''}`} style={style}>
      {screen === 'home' ? (
        <main className="home">
          <header className="home-top">
            <p className="edition">Version two</p>
            <div className="header-actions">
              <button className="text-button" type="button" onClick={() => setTanpura(!playing)}>
                {playing ? 'Tanpura playing' : 'Play tanpura'}
              </button>
              <button className="icon-button" type="button" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
                <Gear />
              </button>
            </div>
          </header>
          <p className="sanskrit">वृक्षासन</p>
          <h1>Vrikshasanam</h1>
          <p className="subtitle">the tree pose</p>
          <figure className="portrait">
            <img src="./tree.jpg" alt="Vrikshasanam, the tree pose, with the palms joined overhead" />
          </figure>
          <button className="begin" type="button" onClick={begin}>Begin</button>
          <p className="note">Stand where the camera can see your whole body. The dots and the page turn green when the pose is right, and the count begins then.</p>
        </main>
      ) : (
        <Session
          music={playing}
          onToggleMusic={() => setTanpura(!playing)}
          onExit={() => {
            setHeld(false)
            setScreen('home')
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          holdMs={seconds * 1000}
          dotColor={THEMES[theme].dot}
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
              <h2>Settings</h2>
              <button className="text-button" type="button" onClick={() => setSettingsOpen(false)}>Close</button>
            </div>
            <div className="setting">
              <p>Hold</p>
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
              <p>Colour</p>
              <div className="swatches">
                {Object.entries(THEMES).map(([id, item]) => (
                  <button
                    key={id}
                    type="button"
                    className={id === theme ? 'swatch chosen' : 'swatch'}
                    style={{ background: item.paper, color: item.ink }}
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
