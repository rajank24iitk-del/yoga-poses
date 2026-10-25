export const ASANAS = [
  { id: 'tree', hi: 'वृक्षासन', name: 'Vrikshasanam', en: 'the tree pose', image: 'asanas/vrikshasanam.jpg' },
  { id: 'chair', hi: 'उत्कटासन', name: 'Utkatasanam', en: 'the chair pose', image: 'asanas/utkatasanam.jpg' },
  { id: 'cobra', hi: 'भुजंगासन', name: 'Bhujangasanam', en: 'the cobra pose', image: 'asanas/bhujangasanam.jpg' },
  { id: 'warrior', hi: 'वीरभद्रासन', name: 'Virabhadrasanam', en: 'the warrior pose', image: 'asanas/virabhadrasanam.jpg' },
  { id: 'dog', hi: 'अधोमुख श्वानासन', name: 'Adho Mukha Svanasanam', en: 'the downward-facing dog', image: 'asanas/svanasanam.jpg' },
  { id: 'shoulderstand', hi: 'सर्वांगासन', name: 'Sarvangasanam', en: 'the shoulderstand', image: 'asanas/sarvangasanam.jpg' },
  { id: 'triangle', hi: 'त्रिकोणासन', name: 'Trikonasanam', en: 'the triangle pose', image: 'asanas/trikonasanam.jpg' },
  { id: 'pranamasana', hi: 'प्रणामासन', name: 'Pranamasanam', en: 'the prayer pose', image: 'asanas/pranamasanam.jpg' },
  { id: 'hasta_uttanasana', hi: 'हस्त उत्तानासन', name: 'Hasta Uttanasanam', en: 'the raised-arms pose', image: 'asanas/hastauttanasanam.jpg' },
  { id: 'padahastasana', hi: 'पादहस्तासन', name: 'Padahastasanam', en: 'the forward fold', image: 'asanas/padahastasanam.jpg' },
  { id: 'ashwa_sanchalanasana', hi: 'अश्व संचालनासन', name: 'Ashwa Sanchalanasanam', en: 'the lunge', image: 'asanas/ashwasanchalanasanam.jpg' },
  { id: 'kumbhakasana', hi: 'कुंभकासन', name: 'Kumbhakasanam', en: 'the plank', image: 'asanas/kumbhakasanam.jpg' },
  { id: 'ashtanga_namaskara', hi: 'अष्टांग नमस्कार', name: 'Ashtanga Namaskaram', en: 'the eight-limbed salutation', image: 'asanas/ashtanganamaskara.jpg' },
]

export const ALL_ORDER = ['tree', 'chair', 'warrior', 'triangle', 'dog', 'cobra', 'shoulderstand']

export const SURYA_ORDER = [
  'pranamasana',
  'hasta_uttanasana',
  'padahastasana',
  'ashwa_sanchalanasana',
  'kumbhakasana',
  'ashtanga_namaskara',
  'cobra',
  'dog',
  'ashwa_sanchalanasana',
  'padahastasana',
  'hasta_uttanasana',
  'pranamasana',
]

export const MODES = [
  { id: 'all', label: 'All asanas • in sequence' },
  { id: 'surya', label: 'सूर्य नमस्कार • Surya Namaskar' },
  { id: 'alphabetical', label: 'Alphabetical list' },
  { id: 'single', label: 'Individual asanas' },
]

const BY_ID = Object.fromEntries(ASANAS.map((pose) => [pose.id, pose]))

export function asanaById(id) {
  return BY_ID[id] || ASANAS[0]
}

export function alphabetical() {
  return [...ASANAS].sort((a, b) => a.name.localeCompare(b.name))
}

export function sequenceFor(mode) {
  if (mode === 'all') return ALL_ORDER
  if (mode === 'surya') return SURYA_ORDER
  return null
}
