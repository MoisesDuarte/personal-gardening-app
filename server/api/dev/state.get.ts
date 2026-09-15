import { assertDevMode, getClockOverride, getParameterOverrides } from '~/server/utils/dev'

export default defineEventHandler((event) => {
  assertDevMode(event)
  return { clockOverride: getClockOverride(event), parameterOverrides: getParameterOverrides(event) }
})
