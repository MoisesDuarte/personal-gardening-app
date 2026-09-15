import { and, asc, count, desc, eq } from 'drizzle-orm'
import { cropTypes } from '~/db/schema'
import { plantings } from '~/db/schema'
import { useDb } from '~/server/db'

export default defineEventHandler(async (event) => {
  const includeInactive = getQuery(event).includeInactive === 'true'
  const rows = await useDb().select({ cropType: cropTypes, activePlantingCount: count(plantings.id) })
    .from(cropTypes)
    .leftJoin(plantings, and(eq(plantings.cropTypeId, cropTypes.id), eq(plantings.status, 'ACTIVE')))
    .where(includeInactive ? undefined : eq(cropTypes.isActive, true))
    .groupBy(cropTypes.id)
    .orderBy(desc(cropTypes.isActive), asc(cropTypes.name))

  return rows.map(({ cropType, activePlantingCount }) => ({ ...cropType, activePlantingCount: Number(activePlantingCount) }))
})
