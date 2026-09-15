import type { H3Event } from 'h3'
import { createError, deleteCookie, getCookie, setCookie } from 'h3'

export type DevCropOverride = { wateringIntervalDays?: number; fertilizingIntervalDays?: number; harvestDays?: number }

const CLOCK_COOKIE = 'cultiva_dev_now'
const PARAMETERS_COOKIE = 'cultiva_dev_parameters'

export function assertDevMode(event: H3Event) {
  if (!useRuntimeConfig(event).devMode) throw createError({ statusCode: 404, statusMessage: 'Not found' })
}

export function getAppNow(event?: H3Event) {
  if (!event || !useRuntimeConfig(event).devMode) return new Date()
  const value = getCookie(event, CLOCK_COOKIE)
  const parsed = value ? new Date(value) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function getClockOverride(event: H3Event) {
  assertDevMode(event)
  const value = getCookie(event, CLOCK_COOKIE)
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function setClockOverride(event: H3Event, date: Date | null) {
  assertDevMode(event)
  if (date) setCookie(event, CLOCK_COOKIE, date.toISOString(), { httpOnly: true, sameSite: 'lax', path: '/' })
  else deleteCookie(event, CLOCK_COOKIE, { path: '/' })
}

export function getParameterOverrides(event: H3Event) {
  assertDevMode(event)
  try {
    const value = getCookie(event, PARAMETERS_COOKIE)
    return value ? JSON.parse(value) as Record<string, DevCropOverride> : {}
  } catch { return {} }
}

export function setParameterOverrides(event: H3Event, overrides: Record<string, DevCropOverride>) {
  assertDevMode(event)
  setCookie(event, PARAMETERS_COOKIE, JSON.stringify(overrides), { httpOnly: true, sameSite: 'lax', path: '/' })
}

export function clearParameterOverrides(event: H3Event) {
  assertDevMode(event)
  deleteCookie(event, PARAMETERS_COOKIE, { path: '/' })
}

export function effectiveCropType<T extends { defaultWateringIntervalDays: number; defaultFertilizingIntervalDays: number; defaultHarvestDays: number }>(event: H3Event, cropType: T) {
  if (!useRuntimeConfig(event).devMode) return cropType
  const override = getParameterOverrides(event)[(cropType as T & { id?: string }).id || '']
  if (!override) return cropType
  return {
    ...cropType,
    defaultWateringIntervalDays: override.wateringIntervalDays ?? cropType.defaultWateringIntervalDays,
    defaultFertilizingIntervalDays: override.fertilizingIntervalDays ?? cropType.defaultFertilizingIntervalDays,
    defaultHarvestDays: override.harvestDays ?? cropType.defaultHarvestDays
  }
}
