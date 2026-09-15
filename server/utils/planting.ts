import { desc, eq } from 'drizzle-orm'
import { careEvents, cropTypes, plantings } from '~/db/schema'
import { daysSince, daysOverdue, daysUntil, expectedHarvestAt, isDue, nextFertilizingAt, nextWateringAt, plantingNeedsCare, plantingState, type CropEvent } from '~/server/domain/crop'

export async function enrichPlanting(db: ReturnType<typeof import('~/server/db').useDb>, planting: typeof plantings.$inferSelect, cropType: typeof cropTypes.$inferSelect, now = new Date()) {
  const eventRows = await db.select().from(careEvents).where(eq(careEvents.plantingId, planting.id)).orderBy(desc(careEvents.performedAt), desc(careEvents.createdAt))
  const events = [...eventRows].reverse()
  const domainEvents: CropEvent[] = eventRows.filter((event) => event.type === 'WATERING' || event.type === 'FERTILIZING').map((event) => ({ type: event.type as CropEvent['type'], performedAt: event.performedAt }))
  const wateringAt = nextWateringAt(planting.plantedAt, cropType.defaultWateringIntervalDays, domainEvents)
  const fertilizingAt = nextFertilizingAt(planting.plantedAt, cropType.defaultFertilizingIntervalDays, domainEvents)
  const derivedExpectedHarvestAt = expectedHarvestAt(planting.plantedAt, cropType)
  return {
    ...planting,
    cropType,
    events,
    ageInDays: daysSince(planting.plantedAt, now),
    expectedHarvestAt: derivedExpectedHarvestAt,
    nextWateringAt: wateringAt,
    nextFertilizingAt: fertilizingAt,
    wateringOverdueDays: daysOverdue(wateringAt, now),
    fertilizingOverdueDays: daysOverdue(fertilizingAt, now),
    wateringDaysUntil: daysUntil(wateringAt, now),
    fertilizingDaysUntil: daysUntil(fertilizingAt, now),
    needsWatering: isDue(wateringAt, now),
    needsFertilizing: isDue(fertilizingAt, now),
    daysToHarvest: daysUntil(derivedExpectedHarvestAt, now),
    state: plantingState({ plantedAt: planting.plantedAt, expectedHarvestAt: derivedExpectedHarvestAt, wateringAt, fertilizingAt, harvestedAt: planting.harvestedAt, removedAt: planting.removedAt }, now),
    needsCare: plantingNeedsCare({ expectedHarvestAt: derivedExpectedHarvestAt, needsWatering: isDue(wateringAt, now), needsFertilizing: isDue(fertilizingAt, now), status: planting.status }, now)
  }
}

export async function findPlanting(db: ReturnType<typeof import('~/server/db').useDb>, id: string) {
  const result = await db.select({ planting: plantings, cropType: cropTypes })
    .from(plantings)
    .innerJoin(cropTypes, eq(plantings.cropTypeId, cropTypes.id))
    .where(eq(plantings.id, id))
    .limit(1)
  return result[0]
}
