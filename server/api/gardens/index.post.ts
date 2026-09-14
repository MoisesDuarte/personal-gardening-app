import { z } from 'zod'
import { gardens, plots } from '~/db/schema'
import { badRequest } from '~/server/utils/http'
import { useDb } from '~/server/db'

const schema = z.object({ name: z.string().trim().min(1).max(80), rows: z.number().int().min(1).max(30), columns: z.number().int().min(1).max(30) })

export default defineEventHandler(async (event) => {
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Nome e dimensões válidos são obrigatórios.')
  const db = useDb()
  const [garden] = await db.insert(gardens).values(body.data).returning()
  const plotValues = Array.from({ length: garden.rows * garden.columns }, (_, index) => ({ gardenId: garden.id, row: Math.floor(index / garden.columns) + 1, column: (index % garden.columns) + 1 }))
  await db.insert(plots).values(plotValues)
  return garden
})
