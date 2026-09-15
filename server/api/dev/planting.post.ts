import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { cropTypes, plantings, plots } from '~/db/schema'
import { expectedHarvestAt } from '~/server/domain/crop'
import { badRequest, conflict, notFound } from '~/server/utils/http'
import { enrichPlanting } from '~/server/utils/planting'
import { assertDevMode, effectiveCropType, getAppNow } from '~/server/utils/dev'
import { useDb } from '~/server/db'

const schema = z.object({ plotId: z.string().uuid(), plantedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })

export default defineEventHandler(async (event) => {
  assertDevMode(event)
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Data de plantio inválida.')
  const db = useDb()
  const [record] = await db.select({ planting: plantings, cropType: cropTypes }).from(plantings).innerJoin(cropTypes, eq(plantings.cropTypeId, cropTypes.id)).where(and(eq(plantings.plotId, body.data.plotId), eq(plantings.status, 'ACTIVE'))).limit(1)
  if (!record) {
    const [plot] = await db.select().from(plots).where(eq(plots.id, body.data.plotId)).limit(1)
    if (!plot) notFound('Célula não encontrada.')
    conflict('A célula não possui plantio ativo.')
  }
  const plantedAt = new Date(`${body.data.plantedAt}T12:00:00.000Z`)
  const now = getAppNow(event)
  if (plantedAt.getTime() > now.getTime()) badRequest('A data de plantio não pode estar no futuro.')
  const [updated] = await db.update(plantings).set({ plantedAt, expectedHarvestAt: expectedHarvestAt(plantedAt, record.cropType), updatedAt: now }).where(eq(plantings.id, record.planting.id)).returning()
  return enrichPlanting(db, updated, effectiveCropType(event, record.cropType), now)
})
