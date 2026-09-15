import { and, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { cropTypes, plantings } from '~/db/schema'
import { useDb } from '~/server/db'
import { notFound } from '~/server/utils/http'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  if (!z.string().uuid().safeParse(id).success) notFound('Planta não encontrada.')
  const db = useDb()
  const [cropType] = await db.select().from(cropTypes).where(eq(cropTypes.id, id)).limit(1)
  if (!cropType) notFound('Planta não encontrada.')
  const [active] = await db.select({ count: count(plantings.id) }).from(plantings).where(and(eq(plantings.cropTypeId, id), eq(plantings.status, 'ACTIVE')))
  const [updated] = await db.update(cropTypes).set({ isActive: false, updatedAt: new Date() }).where(eq(cropTypes.id, id)).returning()
  return { ...updated, activePlantingCount: Number(active?.count || 0) }
})
