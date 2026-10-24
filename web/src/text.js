const DIGITS = '०१२३४५६७८९'

export function hindiNumber(value) {
  return String(value).replace(/\d/g, (digit) => DIGITS[digit])
}

export function formatNumber(value, lang) {
  const text = String(value)
  return lang === 'hi' ? hindiNumber(text) : text
}
