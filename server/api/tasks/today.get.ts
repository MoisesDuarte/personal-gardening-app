import { and, eq, lte } from 'drizzle-orm'
import { cropTypes, gardens, plantings, plots } from '~/db/schema'
import { isDue, isNearHarvest } from '~/server/domain/crop'
import { enrichPlanting } from '~/server/utils/planting'
import { useDb } from '~/server/db'
import { effectiveCropType, getAppNow } from '~/server/utils/dev'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const now = getAppNow(event)
  const records = await db.select({ planting: plantings, cropType: cropTypes, plot: plots, garden: gardens })
    .from(plantings)
    .innerJoin(cropTypes, eq(plantings.cropTypeId, cropTypes.id))
    .innerJoin(plots, eq(plantings.plotId, plots.id))
    .innerJoin(gardens, eq(plots.gardenId, gardens.id))
    .where(and(eq(plantings.status, 'ACTIVE'), lte(plantings.plantedAt, now)))
  const enriched = []
  for (const record of records) {
    const cropType = effectiveCropType(event, record.cropType)
    enriched.push({ ...record, cropType, planting: await enrichPlanting(db, record.planting, cropType, now) })
  }
  const tasks = enriched.flatMap((record) => {
    const items = []
    if (isDue(record.planting.nextWateringAt, now)) items.push({ id: `${record.planting.id}-watering`, type: 'WATERING', label: `Irrigar ${record.cropType.name}`, plantingId: record.planting.id, plot: record.plot, garden: record.garden })
    if (isDue(record.planting.nextFertilizingAt, now)) items.push({ id: `${record.planting.id}-fertilizing`, type: 'FERTILIZING', label: `Adubar ${record.cropType.name}`, plantingId: record.planting.id, plot: record.plot, garden: record.garden })
    return items
  })
  const upcomingHarvests = enriched.filter((record) => isNearHarvest(record.planting.expectedHarvestAt, now) || isDue(record.planting.expectedHarvestAt, now)).map((record) => ({ plantingId: record.planting.id, cropName: record.cropType.name, expectedHarvestAt: record.planting.expectedHarvestAt, plot: record.plot, garden: record.garden }))
  const activeCountByGarden = enriched.reduce<Record<string, number>>((counts, record) => {
    counts[record.garden.id] = (counts[record.garden.id] || 0) + 1
    return counts
  }, {})
  return { activeCount: enriched.length, activeCountByGarden, tasks, upcomingHarvests }
})
