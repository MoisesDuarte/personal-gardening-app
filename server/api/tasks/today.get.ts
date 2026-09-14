import { and, eq, sql } from 'drizzle-orm'
import { cropTypes, gardens, plantings, plots } from '~/db/schema'
import { isDue, isNearHarvest } from '~/server/domain/crop'
import { enrichPlanting } from '~/server/utils/planting'
import { useDb } from '~/server/db'

export default defineEventHandler(async () => {
  const db = useDb()
  const records = await db.select({ planting: plantings, cropType: cropTypes, plot: plots, garden: gardens })
    .from(plantings)
    .innerJoin(cropTypes, eq(plantings.cropTypeId, cropTypes.id))
    .innerJoin(plots, eq(plantings.plotId, plots.id))
    .innerJoin(gardens, eq(plots.gardenId, gardens.id))
    .where(and(eq(plantings.status, 'ACTIVE'), sql`${plantings.plantedAt} <= now()`))
  const enriched = []
  for (const record of records) {
    enriched.push({ ...record, planting: await enrichPlanting(db, record.planting, record.cropType) })
  }
  const tasks = enriched.flatMap((record) => {
    const items = []
    if (isDue(record.planting.nextWateringAt)) items.push({ id: `${record.planting.id}-watering`, type: 'WATERING', label: `Irrigar ${record.cropType.name}`, plantingId: record.planting.id, plot: record.plot, garden: record.garden })
    if (isDue(record.planting.nextFertilizingAt)) items.push({ id: `${record.planting.id}-fertilizing`, type: 'FERTILIZING', label: `Adubar ${record.cropType.name}`, plantingId: record.planting.id, plot: record.plot, garden: record.garden })
    return items
  })
  const upcomingHarvests = enriched.filter((record) => isNearHarvest(record.planting.expectedHarvestAt) || isDue(record.planting.expectedHarvestAt)).map((record) => ({ plantingId: record.planting.id, cropName: record.cropType.name, expectedHarvestAt: record.planting.expectedHarvestAt, plot: record.plot, garden: record.garden }))
  return { activeCount: enriched.length, tasks, upcomingHarvests }
})
