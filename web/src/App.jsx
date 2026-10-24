import { lazy, Suspense, useState } from 'react'
import { LanguageToggle, useLanguage, poseLabel } from './language'
import { CLASSIC_POSES } from './poses'

const Session = lazy(() => import('./Session'))

export default function App() {
  const [screen, setScreen] = useState({ name: 'home' })
  const { t, lang } = useLanguage()

  if (screen.name === 'surya' || screen.name === 'pose') {
    const pose = CLASSIC_POSES.find((item) => item.id === screen.poseId)
    return (
      <Suspense fallback={<main className="home"><p className="lede">{t.loading}</p></main>}>
        <Session
          mode={screen.name === 'surya' ? 'surya' : 'classic'}
          pose={pose}
          onExit={() => setScreen({ name: 'home' })}
        />
      </Suspense>
    )
  }

  return (
    <main className="home">
      <div className="home-head">
        <p className="eyebrow">{t.brand}</p>
        <LanguageToggle />
      </div>
      <h1>{t.choose}</h1>
      <p className="lede">{t.lede}</p>

      <button className="surya-choice" type="button" onClick={() => setScreen({ name: 'surya' })}>
        <span>{t.surya}</span>
        <small>{t.suryaNote}</small>
      </button>

      <section>
        <h2>{t.individual}</h2>
        <ul className="pose-list">
          {CLASSIC_POSES.map((pose) => (
            <li key={pose.id}>
              <button type="button" onClick={() => setScreen({ name: 'pose', poseId: pose.id })}>
                {poseLabel(pose, lang).name}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
