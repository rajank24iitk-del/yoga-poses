import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const COPY = {
  hi: {
    brand: 'योग',
    choose: 'अभ्यास चुनें',
    lede: 'सामने का कैमरा। हरा ढाँचा और चार सेकंड का ठहराव।',
    surya: 'सूर्य नमस्कार',
    suryaNote: 'बारह आसन, केवल इसी क्रम में',
    individual: 'अलग आसन',
    back: 'वापस',
    pose: 'आसन',
    camera: 'कैमरा',
    done: 'समाप्त',
    complete: 'सूर्य नमस्कार पूरा हुआ',
    fullBody: 'पूरा शरीर कैमरे में लाएँ',
    next: 'अगले आसन की ओर बढ़ें',
    hold: 'ठीक है, रुकें',
    loading: 'मॉडल आ रहा है',
    failed: 'कैमरा या मॉडल नहीं खुल पाया',
    changing: 'बदल रहा है',
    match: 'मिलान',
    holdLimit: '४',
    sample: 'इसे देखकर करें',
  },
  en: {
    brand: 'Yoga',
    choose: 'Choose a practice',
    lede: 'Front camera. A green skeleton and a four-second hold.',
    surya: 'Surya Namaskar',
    suryaNote: 'Twelve poses, only in this order',
    individual: 'Individual poses',
    back: 'Back',
    pose: 'Pose',
    camera: 'Camera',
    done: 'Finished',
    complete: 'Surya Namaskar is complete',
    fullBody: 'Bring your whole body into the camera',
    next: 'Move into the next pose',
    hold: 'Correct. Hold.',
    loading: 'Loading the model',
    failed: 'The camera or the model could not open',
    changing: 'Changing',
    match: 'Match',
    holdLimit: '4',
    sample: 'Copy this pose',
  },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => (
    window.localStorage.getItem('yoga-lang') === 'en' ? 'en' : 'hi'
  ))

  useEffect(() => {
    window.localStorage.setItem('yoga-lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({
    lang,
    t: COPY[lang],
    setLang,
  }), [lang])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export function LanguageToggle() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="lang-toggle" role="group" aria-label={lang === 'hi' ? 'भाषा' : 'Language'}>
      <button type="button" aria-pressed={lang === 'hi'} onClick={() => setLang('hi')}>हिंदी</button>
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
    </div>
  )
}

export function poseLabel(pose, lang) {
  if (!pose) return { name: '', hint: '' }
  return {
    name: lang === 'en' ? pose.en : pose.hi,
    hint: lang === 'en' ? pose.hintEn : pose.hint,
  }
}
