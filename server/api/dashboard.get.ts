import { and, desc, eq, inArray, lte } from 'drizzle-orm'
import { careEvents, cropTypes, gardens, plantings, plots } from '~/db/schema'
import { isDue, isNearHarvest } from '~/server/domain/crop'
import { enrichPlanting } from '~/server/utils/planting'
import { effectiveCropType, getAppNow } from '~/server/utils/dev'
import { useDb } from '~/server/db'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const now = getAppNow(event)
  const gardenRows = await db.select().from(gardens).orderBy(desc(gardens.createdAt))
  if (!gardenRows.length) return { attentionItems: [], attentionTotal: 0, gardens: [], upcomingHarvests: [], activePlantingsCount: 0, careCount: 0 }

  const records = await db.select({ planting: plantings, cropType: cropTypes, plot: plots, garden: gardens })
    .from(plantings)
    .innerJoin(cropTypes, eq(plantings.cropTypeId, cropTypes.id))
    .innerJoin(plots, eq(plantings.plotId, plots.id))
    .innerJoin(gardens, eq(plots.gardenId, gardens.id))
    .where(and(eq(plantings.status, 'ACTIVE'), lte(plantings.plantedAt, now)))

  const events = records.length
    ? await db.select().from(careEvents).where(inArray(careEvents.plantingId, records.map(({ planting }) => planting.id))).orderBy(desc(careEvents.performedAt), desc(careEvents.createdAt))
    : []
  const eventsByPlanting = new Map<string, typeof events>()
  for (const careEvent of events) eventsByPlanting.set(careEvent.plantingId, [...(eventsByPlanting.get(careEvent.plantingId) || []), careEvent])

  const enriched = await Promise.all(records.map(async (record) => {
    const cropType = effectiveCropType(event, record.cropType)
    return { ...record, cropType, planting: await enrichPlanting(db, record.planting, cropType, now, eventsByPlanting.get(record.planting.id) || []) }
  }))
  const attentionItems = enriched.flatMap(({ planting, cropType, plot, garden }) => {
    const items = [] as Array<{ plantingId: string; kind: 'WATERING' | 'FERTILIZING' | 'HARVEST'; cropType: typeof cropType; plot: typeof plot; garden: typeof garden; daysUntil: number }>
    if (isDue(planting.nextWateringAt, now)) items.push({ plantingId: planting.id, kind: 'WATERING', cropType, plot, garden, daysUntil: planting.wateringDaysUntil })
    if (isDue(planting.nextFertilizingAt, now)) items.push({ plantingId: planting.id, kind: 'FERTILIZING', cropType, plot, garden, daysUntil: planting.fertilizingDaysUntil })
    if (isDue(planting.expectedHarvestAt, now)) items.push({ plantingId: planting.id, kind: 'HARVEST', cropType, plot, garden, daysUntil: planting.daysToHarvest })
    return items
  }).sort((a, b) => a.daysUntil - b.daysUntil)
  const upcomingHarvests = enriched.filter(({ planting }) => !isDue(planting.expectedHarvestAt, now) && isNearHarvest(planting.expectedHarvestAt, now, 14)).sort((a, b) => a.planting.daysToHarvest - b.planting.daysToHarvest).slice(0, 8).map(({ planting, cropType, plot, garden }) => ({ plantingId: planting.id, cropName: cropType.name, cropEmoji: cropType.emoji, expectedHarvestAt: planting.expectedHarvestAt, plot, garden }))
  const countsByGarden = new Map<string, { activeCount: number; careCount: number }>()
  for (const record of enriched) {
    const counts = countsByGarden.get(record.garden.id) || { activeCount: 0, careCount: 0 }
    counts.activeCount += 1; counts.careCount += record.planting.needsCare ? 1 : 0
    countsByGarden.set(record.garden.id, counts)
  }
  const gardenSummaries = gardenRows.map((garden) => {
    const counts = countsByGarden.get(garden.id) || { activeCount: 0, careCount: 0 }
    return { garden, activeCount: counts.activeCount, freeCount: Math.max(0, garden.rows * garden.columns - counts.activeCount), careCount: counts.careCount }
  })
  return { attentionItems: attentionItems.slice(0, 12), attentionTotal: attentionItems.length, gardens: gardenSummaries, upcomingHarvests, activePlantingsCount: enriched.length, careCount: enriched.filter(({ planting }) => planting.needsCare).length }
})
