import { asc } from 'drizzle-orm'
import { cropTypes } from '~/db/schema'
import { useDb } from '~/server/db'

export default defineEventHandler(() => useDb().select().from(cropTypes).orderBy(asc(cropTypes.name)))
