import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { cropTypes, plantings, plots } from '~/db/schema'
import { addDays, expectedHarvestAt } from '~/server/domain/crop'
import { badRequest, conflict, notFound } from '~/server/utils/http'
import { enrichPlanting } from '~/server/utils/planting'
import { assertDevMode, effectiveCropType, getAppNow } from '~/server/utils/dev'
import { useDb } from '~/server/db'

const schema = z.object({ plotId: z.string().uuid(), cropTypeId: z.string().uuid(), ageDays: z.number().int().min(0).max(3650) })

export default defineEventHandler(async (event) => {
  assertDevMode(event)
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Dados do plantio rápido inválidos.')
  const db = useDb()
  const [plot] = await db.select().from(plots).where(eq(plots.id, body.data.plotId)).limit(1)
  if (!plot) notFound('Célula não encontrada.')
  const [active] = await db.select().from(plantings).where(and(eq(plantings.plotId, plot.id), eq(plantings.status, 'ACTIVE'))).limit(1)
  if (active) conflict('Esta célula já possui um plantio ativo.')
  const [crop] = await db.select().from(cropTypes).where(and(eq(cropTypes.id, body.data.cropTypeId), eq(cropTypes.isActive, true))).limit(1)
  if (!crop) badRequest('Planta não encontrada ou está inativa.')
  const now = getAppNow(event)
  const effectiveCrop = effectiveCropType(event, crop)
  const plantedAt = addDays(now, -body.data.ageDays)
  const [planting] = await db.insert(plantings).values({ plotId: plot.id, cropTypeId: crop.id, plantedAt, expectedHarvestAt: expectedHarvestAt(plantedAt, crop) }).returning()
  return enrichPlanting(db, planting, effectiveCrop, now)
})
