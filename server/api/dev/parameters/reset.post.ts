import { z } from 'zod'
import { assertDevMode, clearParameterOverrides, getParameterOverrides, setParameterOverrides } from '~/server/utils/dev'

export default defineEventHandler(async (event) => {
  assertDevMode(event)
  const body = z.object({ cropTypeId: z.string().uuid().optional() }).safeParse((await readBody(event)) || {})
  if (!body.success) return { parameterOverrides: getParameterOverrides(event) }
  if (!body.data.cropTypeId) clearParameterOverrides(event)
  else {
    const overrides = getParameterOverrides(event)
    delete overrides[body.data.cropTypeId]
    setParameterOverrides(event, overrides)
    return { parameterOverrides: overrides }
  }
  return { parameterOverrides: {} }
})
