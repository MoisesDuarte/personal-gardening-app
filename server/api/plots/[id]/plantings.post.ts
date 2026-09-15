import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { cropTypes, plantings, plots } from '~/db/schema'
import { expectedHarvestAt } from '~/server/domain/crop'
import { badRequest, conflict, notFound } from '~/server/utils/http'
import { enrichPlanting } from '~/server/utils/planting'
import { useDb } from '~/server/db'
import { effectiveCropType, getAppNow } from '~/server/utils/dev'

const schema = z.object({ cropTypeId: z.string().uuid(), plantedAt: z.coerce.date().optional() })

export default defineEventHandler(async (event) => {
  const plotId = getRouterParam(event, 'id')!
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Cultivo e data de plantio válidos são obrigatórios.')
  const db = useDb()
  const now = getAppNow(event)
  const [plot] = await db.select().from(plots).where(eq(plots.id, plotId)).limit(1)
  if (!plot) notFound('Célula não encontrada.')
  const [active] = await db.select().from(plantings).where(and(eq(plantings.plotId, plotId), eq(plantings.status, 'ACTIVE'))).limit(1)
  if (active) conflict('Esta célula já possui um plantio ativo.')
  const [crop] = await db.select().from(cropTypes).where(and(eq(cropTypes.id, body.data.cropTypeId), eq(cropTypes.isActive, true))).limit(1)
  if (!crop) badRequest('Planta não encontrada ou está inativa.')
  let planting
  const plantedAt = body.data.plantedAt || now
  const effectiveCrop = effectiveCropType(event, crop)
  try {
    [planting] = await db.insert(plantings).values({ plotId, cropTypeId: crop.id, plantedAt, expectedHarvestAt: expectedHarvestAt(plantedAt, crop) }).returning()
  } catch (cause: any) {
    if (cause?.code === '23505') conflict('Esta célula já possui um plantio ativo.')
    throw cause
  }
  return enrichPlanting(db, planting, effectiveCrop, now)
})
