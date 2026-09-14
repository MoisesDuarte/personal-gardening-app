import { calendarDayDifference } from '../../utils/dates'

export type CropRule = {
  defaultHarvestDays: number
  defaultWateringIntervalDays: number
  defaultFertilizingIntervalDays: number
}

export type CropEvent = { type: 'WATERING' | 'FERTILIZING'; performedAt: Date }

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export function daysSince(date: Date, now = new Date()) {
  return Math.max(0, calendarDayDifference(now, date))
}

export function expectedHarvestAt(plantedAt: Date, rule: CropRule) {
  return addDays(plantedAt, rule.defaultHarvestDays)
}

function latestEvent(events: CropEvent[], type: CropEvent['type']) {
  return events.filter((event) => event.type === type).sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())[0]
}

export function nextWateringAt(plantedAt: Date, intervalDays: number, events: CropEvent[] = []) {
  return addDays(latestEvent(events, 'WATERING')?.performedAt ?? plantedAt, intervalDays)
}

export function nextFertilizingAt(plantedAt: Date, intervalDays: number, events: CropEvent[] = []) {
  return addDays(latestEvent(events, 'FERTILIZING')?.performedAt ?? plantedAt, intervalDays)
}

export function isDue(date: Date, now = new Date()) {
  return calendarDayDifference(date, now) <= 0
}

export function daysOverdue(date: Date, now = new Date()) {
  return Math.max(0, -calendarDayDifference(date, now))
}

export function daysUntil(date: Date, now = new Date()) {
  return calendarDayDifference(date, now)
}

export function isNearHarvest(date: Date, now = new Date(), thresholdDays = 7) {
  const days = calendarDayDifference(date, now)
  return days >= 0 && days <= thresholdDays
}

export function plantingState(input: { plantedAt: Date; expectedHarvestAt: Date; wateringAt: Date; fertilizingAt: Date; harvestedAt?: Date | null; removedAt?: Date | null }, now = new Date()) {
  if (input.removedAt) return 'REMOVED' as const
  if (input.harvestedAt) return 'HARVESTED' as const
  if (isDue(input.expectedHarvestAt, now)) return 'READY' as const
  if (isDue(input.wateringAt, now)) return 'NEEDS_WATERING' as const
  if (isDue(input.fertilizingAt, now)) return 'NEEDS_FERTILIZING' as const
  if (isNearHarvest(input.expectedHarvestAt, now)) return 'NEAR_HARVEST' as const
  return 'GROWING' as const
}

export function plantingNeedsCare(input: { expectedHarvestAt: Date; needsWatering: boolean; needsFertilizing: boolean; status?: 'ACTIVE' | 'HARVESTED' | 'REMOVED' }, now = new Date()) {
  if (input.status && input.status !== 'ACTIVE') return false
  return input.needsWatering || input.needsFertilizing || isDue(input.expectedHarvestAt, now) || isNearHarvest(input.expectedHarvestAt, now)
}
