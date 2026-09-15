import { z } from 'zod'
import { badRequest } from '~/server/utils/http'
import { assertDevMode, setClockOverride } from '~/server/utils/dev'

const schema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional() })

export default defineEventHandler(async (event) => {
  assertDevMode(event)
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Data de desenvolvimento inválida.')
  const date = body.data.date ? new Date(`${body.data.date}T12:00:00.000Z`) : null
  if (date && Number.isNaN(date.getTime())) badRequest('Data de desenvolvimento inválida.')
  setClockOverride(event, date)
  return { clockOverride: date }
})
