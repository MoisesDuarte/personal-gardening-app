import { and, asc, eq } from 'drizzle-orm'
import { careEvents, cropTypes, plantings } from '~/db/schema'
import { daysSince, nextFertilizingAt, nextWateringAt, plantingState, type CropEvent } from '~/server/domain/crop'

export async function enrichPlanting(db: ReturnType<typeof import('~/server/db').useDb>, planting: typeof plantings.$inferSelect, cropType: typeof cropTypes.$inferSelect, now = new Date()) {
  const events = await db.select().from(careEvents).where(eq(careEvents.plantingId, planting.id)).orderBy(asc(careEvents.performedAt))
  const domainEvents: CropEvent[] = events.filter((event) => event.type === 'WATERING' || event.type === 'FERTILIZING').map((event) => ({ type: event.type as CropEvent['type'], performedAt: event.performedAt }))
  const wateringAt = nextWateringAt(planting.plantedAt, cropType.defaultWateringIntervalDays, domainEvents)
  const fertilizingAt = nextFertilizingAt(planting.plantedAt, cropType.defaultFertilizingIntervalDays, domainEvents)
  return {
    ...planting,
    cropType,
    events,
    ageInDays: daysSince(planting.plantedAt, now),
    nextWateringAt: wateringAt,
    nextFertilizingAt: fertilizingAt,
    state: plantingState({ plantedAt: planting.plantedAt, expectedHarvestAt: planting.expectedHarvestAt, wateringAt, fertilizingAt, harvestedAt: planting.harvestedAt }, now)
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
