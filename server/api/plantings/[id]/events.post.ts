import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { careEvents, plantings } from '~/db/schema'
import { badRequest, conflict, notFound } from '~/server/utils/http'
import { enrichPlanting, findPlanting } from '~/server/utils/planting'
import { useDb } from '~/server/db'
import { effectiveCropType, getAppNow } from '~/server/utils/dev'

const schema = z.object({ type: z.enum(['WATERING', 'FERTILIZING', 'HARVEST', 'REMOVAL']), performedAt: z.coerce.date().optional(), notes: z.string().trim().max(200).optional() })

export default defineEventHandler(async (event) => {
  const plantingId = getRouterParam(event, 'id')!
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Tipo de cuidado inválido.')
  const now = getAppNow(event)
  const performedAt = body.data.performedAt || now
  if (performedAt.getTime() > now.getTime()) badRequest('A data da ação não pode estar no futuro.')
  const db = useDb()
  const result = await findPlanting(db, plantingId)
  if (!result) notFound('Plantio não encontrado.')
  if (result.planting.status !== 'ACTIVE') conflict('Este plantio já foi finalizado.')
  await db.transaction(async (tx) => {
    await tx.insert(careEvents).values({ plantingId, type: body.data.type, performedAt, notes: body.data.notes || null })
    if (body.data.type === 'HARVEST') {
      await tx.update(plantings).set({ status: 'HARVESTED', harvestedAt: performedAt, updatedAt: now }).where(eq(plantings.id, plantingId))
    }
    if (body.data.type === 'REMOVAL') {
      await tx.update(plantings).set({ status: 'REMOVED', removedAt: performedAt, updatedAt: now }).where(eq(plantings.id, plantingId))
    }
  })
  const updated = await findPlanting(db, plantingId)
  return enrichPlanting(db, updated!.planting, effectiveCropType(event, updated!.cropType), now)
})
