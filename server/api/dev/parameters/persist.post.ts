import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { cropTypes } from '~/db/schema'
import { useDb } from '~/server/db'
import { assertDevMode, getParameterOverrides, setParameterOverrides } from '~/server/utils/dev'
import { badRequest, notFound } from '~/server/utils/http'

const schema = z.object({ cropTypeId: z.string().uuid(), wateringIntervalDays: z.number().int().min(1).max(365), fertilizingIntervalDays: z.number().int().min(1).max(365), harvestDays: z.number().int().min(1).max(730) })

export default defineEventHandler(async (event) => {
  assertDevMode(event)
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Parâmetros de cultivo inválidos.')
  const [crop] = await useDb().update(cropTypes).set({ defaultWateringIntervalDays: body.data.wateringIntervalDays, defaultFertilizingIntervalDays: body.data.fertilizingIntervalDays, defaultHarvestDays: body.data.harvestDays, updatedAt: new Date() }).where(eq(cropTypes.id, body.data.cropTypeId)).returning()
  if (!crop) notFound('Cultivo não encontrado.')
  const parameterOverrides = getParameterOverrides(event)
  delete parameterOverrides[body.data.cropTypeId]
  setParameterOverrides(event, parameterOverrides)
  return { cropType: crop, parameterOverrides }
})
