import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { careEvents, plantings } from '~/db/schema'
import { badRequest, notFound } from '~/server/utils/http'
import { enrichPlanting, findPlanting } from '~/server/utils/planting'
import { useDb } from '~/server/db'

const schema = z.object({ type: z.enum(['WATERING', 'FERTILIZING', 'HARVEST']), performedAt: z.coerce.date().default(() => new Date()), notes: z.string().trim().max(200).optional() })

export default defineEventHandler(async (event) => {
  const plantingId = getRouterParam(event, 'id')!
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Tipo de cuidado inválido.')
  const db = useDb()
  const result = await findPlanting(db, plantingId)
  if (!result) notFound('Plantio não encontrado.')
  if (result.planting.status !== 'ACTIVE') badRequest('Este plantio já foi colhido.')
  await db.insert(careEvents).values({ plantingId, type: body.data.type, performedAt: body.data.performedAt, notes: body.data.notes || null })
  if (body.data.type === 'HARVEST') {
    await db.update(plantings).set({ status: 'HARVESTED', harvestedAt: body.data.performedAt, updatedAt: new Date() }).where(eq(plantings.id, plantingId))
  }
  const updated = await findPlanting(db, plantingId)
  return enrichPlanting(db, updated!.planting, updated!.cropType)
})
