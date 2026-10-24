import { useEffect, useRef, useState } from 'react'
import Session from './Session'
import { createTanpura } from './tanpura'

export default function App() {
  const tanpura = useRef(null)
  if (!tanpura.current) tanpura.current = createTanpura('tanpura-player')
  const [screen, setScreen] = useState('home')
  const [music, setMusic] = useState(false)

  useEffect(() => {
    tanpura.current.mount()
  }, [])

  async function toggleMusic() {
    if (music) {
      await tanpura.current.stop()
      setMusic(false)
      return
    }
    await tanpura.current.start()
    setMusic(true)
  }

  function begin() {
    setScreen('practice')
    if (!tanpura.current.playing) {
      tanpura.current.start().then(() => setMusic(true)).catch((error) => console.error(error))
    }
  }

  return (
    <div className="shell">
      {screen === 'home' ? (
        <main className="home">
          <header className="home-top">
            <p className="edition">Version two</p>
            <button className="text-button" type="button" onClick={toggleMusic}>
              {music ? 'Tanpura playing' : 'Play tanpura'}
            </button>
          </header>
          <p className="sanskrit">वृक्षासन</p>
          <h1>Vrikshasanam</h1>
          <p className="subtitle">the tree pose</p>
          <figure className="portrait">
            <img src="./tree.jpg" alt="Vrikshasanam, the tree pose, with the palms joined overhead" />
          </figure>
          <button className="begin" type="button" onClick={begin}>Begin</button>
          <p className="note">Stand where the camera can see your whole body. The dots turn green when the pose is right, and the count begins then.</p>
        </main>
      ) : (
        <Session
          music={music}
          onToggleMusic={toggleMusic}
          onExit={() => setScreen('home')}
        />
      )}
      <section className="tanpura-dock" aria-label="C sharp tanpura">
        <p>C# tanpura</p>
        <div className="tanpura-frame">
          <div id="tanpura-player" />
        </div>
      </section>
    </div>
  )
}
