import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { cropTypes } from '~/db/schema'
import { useDb } from '~/server/db'
import { notFound } from '~/server/utils/http'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  if (!z.string().uuid().safeParse(id).success) notFound('Planta não encontrada.')
  const [cropType] = await useDb().update(cropTypes).set({ isActive: true, updatedAt: new Date() }).where(eq(cropTypes.id, id)).returning()
  if (!cropType) notFound('Planta não encontrada.')
  return { ...cropType, activePlantingCount: undefined }
})
