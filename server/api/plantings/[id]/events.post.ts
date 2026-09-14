import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { careEvents, plantings } from '~/db/schema'
import { badRequest, conflict, notFound } from '~/server/utils/http'
import { enrichPlanting, findPlanting } from '~/server/utils/planting'
import { useDb } from '~/server/db'

const schema = z.object({ type: z.enum(['WATERING', 'FERTILIZING', 'HARVEST', 'REMOVAL']), performedAt: z.coerce.date().default(() => new Date()), notes: z.string().trim().max(200).optional() })

export default defineEventHandler(async (event) => {
  const plantingId = getRouterParam(event, 'id')!
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Tipo de cuidado inválido.')
  if (body.data.performedAt.getTime() > Date.now()) badRequest('A data da ação não pode estar no futuro.')
  const db = useDb()
  const result = await findPlanting(db, plantingId)
  if (!result) notFound('Plantio não encontrado.')
  if (result.planting.status !== 'ACTIVE') conflict('Este plantio já foi finalizado.')
  await db.transaction(async (tx) => {
    await tx.insert(careEvents).values({ plantingId, type: body.data.type, performedAt: body.data.performedAt, notes: body.data.notes || null })
    if (body.data.type === 'HARVEST') {
      await tx.update(plantings).set({ status: 'HARVESTED', harvestedAt: body.data.performedAt, updatedAt: new Date() }).where(eq(plantings.id, plantingId))
    }
    if (body.data.type === 'REMOVAL') {
      await tx.update(plantings).set({ status: 'REMOVED', removedAt: body.data.performedAt, updatedAt: new Date() }).where(eq(plantings.id, plantingId))
    }
  })
  const updated = await findPlanting(db, plantingId)
  return enrichPlanting(db, updated!.planting, updated!.cropType)
})
