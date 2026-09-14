export type CropRule = {
  defaultHarvestDays: number
  defaultWateringIntervalDays: number
  defaultFertilizingIntervalDays: number
}

export type CropEvent = { type: 'WATERING' | 'FERTILIZING'; performedAt: Date }

const DAY_MS = 24 * 60 * 60 * 1000

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS)
}

export function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function daysSince(date: Date, now = new Date()) {
  return Math.max(0, Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS))
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
  return startOfDay(date).getTime() <= startOfDay(now).getTime()
}

export function isNearHarvest(date: Date, now = new Date(), thresholdDays = 7) {
  const days = Math.ceil((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS)
  return days >= 0 && days <= thresholdDays
}

export function plantingState(input: { plantedAt: Date; expectedHarvestAt: Date; wateringAt: Date; fertilizingAt: Date; harvestedAt?: Date | null }, now = new Date()) {
  if (input.harvestedAt) return 'HARVESTED' as const
  if (isDue(input.expectedHarvestAt, now)) return 'READY' as const
  if (isDue(input.wateringAt, now)) return 'NEEDS_WATERING' as const
  if (isDue(input.fertilizingAt, now)) return 'NEEDS_FERTILIZING' as const
  if (isNearHarvest(input.expectedHarvestAt, now)) return 'NEAR_HARVEST' as const
  return 'GROWING' as const
}
