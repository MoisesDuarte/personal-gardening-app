import { eq } from 'drizzle-orm'
import { gardens } from '~/db/schema'
import { notFound } from '~/server/utils/http'
import { useDb } from '~/server/db'

export default defineEventHandler(async (event) => {
  const [garden] = await useDb().select().from(gardens).where(eq(gardens.id, getRouterParam(event, 'id')!)).limit(1)
  if (!garden) notFound('Horta não encontrada.')
  return garden
})
