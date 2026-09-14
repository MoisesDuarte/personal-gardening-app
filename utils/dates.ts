export const APP_TIME_ZONE = 'America/Sao_Paulo'

const DAY_MS = 24 * 60 * 60 * 1000

function calendarParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]))
  return { year: values.year, month: values.month, day: values.day }
}

export function calendarDateKey(date: Date) {
  const { year, month, day } = calendarParts(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function calendarDayDifference(date: Date, reference = new Date()) {
  const target = calendarParts(date)
  const base = calendarParts(reference)
  const targetDay = Date.UTC(target.year, target.month - 1, target.day)
  const baseDay = Date.UTC(base.year, base.month - 1, base.day)
  return Math.round((targetDay - baseDay) / DAY_MS)
}

export function formatAppDate(date: string | Date, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: APP_TIME_ZONE }).format(date instanceof Date ? date : new Date(date))
}

export function formatAppTime(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: APP_TIME_ZONE }).format(date instanceof Date ? date : new Date(date))
}

export function relativeDayLabel(daysUntil: number) {
  if (daysUntil < 0) return `Atrasada há ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'dia' : 'dias'}`
  if (daysUntil === 0) return 'Hoje'
  if (daysUntil === 1) return 'Amanhã'
  return `Em ${daysUntil} dias`
}
