import { desc } from 'drizzle-orm'
import { gardens } from '~/db/schema'
import { useDb } from '~/server/db'

export default defineEventHandler(() => useDb().select().from(gardens).orderBy(desc(gardens.createdAt)))
