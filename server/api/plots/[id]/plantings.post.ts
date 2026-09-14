import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { cropTypes, plantings, plots } from '~/db/schema'
import { expectedHarvestAt } from '~/server/domain/crop'
import { badRequest, notFound } from '~/server/utils/http'
import { enrichPlanting } from '~/server/utils/planting'
import { useDb } from '~/server/db'

const schema = z.object({ cropTypeId: z.string().uuid(), plantedAt: z.coerce.date().default(() => new Date()) })

export default defineEventHandler(async (event) => {
  const plotId = getRouterParam(event, 'id')!
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Cultivo e data de plantio válidos são obrigatórios.')
  const db = useDb()
  const [plot] = await db.select().from(plots).where(eq(plots.id, plotId)).limit(1)
  if (!plot) notFound('Célula não encontrada.')
  const [active] = await db.select().from(plantings).where(and(eq(plantings.plotId, plotId), eq(plantings.status, 'ACTIVE'))).limit(1)
  if (active) badRequest('Esta célula já possui um plantio ativo.')
  const [crop] = await db.select().from(cropTypes).where(eq(cropTypes.id, body.data.cropTypeId)).limit(1)
  if (!crop) badRequest('Cultivo não encontrado.')
  const [planting] = await db.insert(plantings).values({ plotId, cropTypeId: crop.id, plantedAt: body.data.plantedAt, expectedHarvestAt: expectedHarvestAt(body.data.plantedAt, crop) }).returning()
  return enrichPlanting(db, planting, crop)
})
