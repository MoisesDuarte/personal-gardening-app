import { desc, eq, inArray, sql } from 'drizzle-orm'
import { careEvents, cropTypes, gardens, plantings, plots } from '~/db/schema'
import { calendarDayDifference } from '~/utils/dates'
import { enrichPlanting } from '~/server/utils/planting'
import { getAppNow } from '~/server/utils/dev'
import { useDb } from '~/server/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const rows = await db.select({ planting: plantings, plot: plots, cropType: cropTypes, garden: gardens })
    .from(plantings)
    .innerJoin(plots, eq(plantings.plotId, plots.id))
    .innerJoin(gardens, eq(plots.gardenId, gardens.id))
    .innerJoin(cropTypes, eq(plantings.cropTypeId, cropTypes.id))
    .where(inArray(plantings.status, ['HARVESTED', 'REMOVED']))
    .orderBy(desc(sql`COALESCE(${plantings.harvestedAt}, ${plantings.removedAt})`), desc(plantings.updatedAt))
  if (!rows.length) return []
  const events = await db.select().from(careEvents).where(inArray(careEvents.plantingId, rows.map(({ planting }) => planting.id))).orderBy(desc(careEvents.performedAt), desc(careEvents.createdAt))
  const eventsByPlanting = new Map<string, typeof events>()
  for (const careEvent of events) eventsByPlanting.set(careEvent.plantingId, [...(eventsByPlanting.get(careEvent.plantingId) || []), careEvent])
  const now = getAppNow(event)
  return Promise.all(rows.map(async ({ planting, plot, cropType, garden }) => {
    const enriched = await enrichPlanting(db, planting, cropType, now, eventsByPlanting.get(planting.id) || [])
    const endedAt = planting.harvestedAt || planting.removedAt || planting.updatedAt
    return { ...enriched, plot, garden, endedAt, durationInDays: Math.max(0, calendarDayDifference(endedAt, planting.plantedAt)) }
  }))
})
