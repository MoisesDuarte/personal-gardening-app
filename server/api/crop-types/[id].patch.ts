import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { cropTypes } from '~/db/schema'
import { useDb } from '~/server/db'
import { badRequest, conflict, notFound } from '~/server/utils/http'
import { cropTypePatchSchema } from '~/server/utils/crop-type'

export default defineEventHandler(async (event) => {
  const parsed = cropTypePatchSchema.safeParse(await readBody(event))
  if (!parsed.success) badRequest(parsed.error.issues[0]?.message || 'Dados da planta inválidos.')
  const id = getRouterParam(event, 'id')!
  if (!z.string().uuid().safeParse(id).success) notFound('Planta não encontrada.')
  const values = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]))

  try {
    const [cropType] = await useDb().update(cropTypes).set({ ...values, updatedAt: new Date() }).where(eq(cropTypes.id, id)).returning()
    if (!cropType) notFound('Planta não encontrada.')
    return { ...cropType, activePlantingCount: undefined }
  } catch (cause: any) {
    if (cause?.code === '23505') conflict('Já existe uma planta com esse nome.')
    throw cause
  }
})
