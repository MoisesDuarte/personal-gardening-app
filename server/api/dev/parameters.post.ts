import { z } from 'zod'
import { badRequest } from '~/server/utils/http'
import { assertDevMode, getParameterOverrides, setParameterOverrides } from '~/server/utils/dev'
import { cropTypes } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { useDb } from '~/server/db'

const schema = z.object({ cropTypeId: z.string().uuid(), wateringIntervalDays: z.number().int().min(1).max(365).nullable().optional(), fertilizingIntervalDays: z.number().int().min(1).max(365).nullable().optional(), harvestDays: z.number().int().min(1).max(730).nullable().optional() })

export default defineEventHandler(async (event) => {
  assertDevMode(event)
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Parâmetros de cultivo inválidos.')
  const [crop] = await useDb().select().from(cropTypes).where(eq(cropTypes.id, body.data.cropTypeId)).limit(1)
  if (!crop) badRequest('Cultivo não encontrado.')
  const overrides = getParameterOverrides(event)
  const current = overrides[body.data.cropTypeId] || {}
  overrides[body.data.cropTypeId] = {
    ...current,
    ...(body.data.wateringIntervalDays === null ? { wateringIntervalDays: undefined } : body.data.wateringIntervalDays === undefined ? {} : { wateringIntervalDays: body.data.wateringIntervalDays }),
    ...(body.data.fertilizingIntervalDays === null ? { fertilizingIntervalDays: undefined } : body.data.fertilizingIntervalDays === undefined ? {} : { fertilizingIntervalDays: body.data.fertilizingIntervalDays }),
    ...(body.data.harvestDays === null ? { harvestDays: undefined } : body.data.harvestDays === undefined ? {} : { harvestDays: body.data.harvestDays })
  }
  if (!Object.values(overrides[body.data.cropTypeId]).some((value) => value !== undefined)) delete overrides[body.data.cropTypeId]
  setParameterOverrides(event, overrides)
  return { parameterOverrides: overrides }
})
