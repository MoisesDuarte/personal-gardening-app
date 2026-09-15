import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { careEvents, cropTypes, plantings, plots } from '~/db/schema'
import { addDays, expectedHarvestAt } from '~/server/domain/crop'
import { badRequest, conflict, notFound } from '~/server/utils/http'
import { enrichPlanting } from '~/server/utils/planting'
import { assertDevMode, effectiveCropType, getAppNow } from '~/server/utils/dev'
import { useDb } from '~/server/db'

const scenarios = ['normal', 'water-today', 'water-overdue', 'fertilize-today', 'fertilize-overdue', 'water-fertilize', 'harvest-soon', 'ready'] as const
const schema = z.object({ plotId: z.string().uuid(), scenario: z.enum(scenarios) })

export default defineEventHandler(async (event) => {
  assertDevMode(event)
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Cenário inválido.')
  const db = useDb()
  const [plot] = await db.select().from(plots).where(eq(plots.id, body.data.plotId)).limit(1)
  if (!plot) notFound('Célula não encontrada.')
  const [record] = await db.select({ planting: plantings, cropType: cropTypes }).from(plantings).innerJoin(cropTypes, eq(plantings.cropTypeId, cropTypes.id)).where(and(eq(plantings.plotId, plot.id), eq(plantings.status, 'ACTIVE'))).limit(1)
  if (!record) conflict('Selecione uma célula com plantio ativo.')
  const now = getAppNow(event)
  const crop = effectiveCropType(event, record.cropType)
  const intervalWatering = crop.defaultWateringIntervalDays
  const intervalFertilizing = crop.defaultFertilizingIntervalDays
  let plantedAt = now
  let expected = expectedHarvestAt(plantedAt, record.cropType)
  const events: { type: 'WATERING' | 'FERTILIZING'; performedAt: Date }[] = []
  switch (body.data.scenario) {
    case 'water-today': events.push({ type: 'WATERING', performedAt: addDays(now, -intervalWatering) }); break
    case 'water-overdue': events.push({ type: 'WATERING', performedAt: addDays(now, -intervalWatering - 3) }); break
    case 'fertilize-today': events.push({ type: 'FERTILIZING', performedAt: addDays(now, -intervalFertilizing) }); break
    case 'fertilize-overdue': events.push({ type: 'FERTILIZING', performedAt: addDays(now, -intervalFertilizing - 3) }); break
    case 'water-fertilize':
      events.push({ type: 'WATERING', performedAt: addDays(now, -intervalWatering) }, { type: 'FERTILIZING', performedAt: addDays(now, -intervalFertilizing) })
      break
    case 'harvest-soon':
      plantedAt = addDays(now, -(crop.defaultHarvestDays - 3))
      expected = expectedHarvestAt(plantedAt, record.cropType)
      events.push({ type: 'WATERING', performedAt: now }, { type: 'FERTILIZING', performedAt: now })
      break
    case 'ready':
      plantedAt = addDays(now, -(crop.defaultHarvestDays + 1))
      expected = expectedHarvestAt(plantedAt, record.cropType)
      events.push({ type: 'WATERING', performedAt: now }, { type: 'FERTILIZING', performedAt: now })
      break
  }
  await db.transaction(async (tx) => {
    await tx.delete(careEvents).where(eq(careEvents.plantingId, record.planting.id))
    await tx.update(plantings).set({ plantedAt, expectedHarvestAt: expected, harvestedAt: null, removedAt: null, status: 'ACTIVE', updatedAt: now }).where(eq(plantings.id, record.planting.id))
    for (const careEvent of events) await tx.insert(careEvents).values({ plantingId: record.planting.id, type: careEvent.type, performedAt: careEvent.performedAt, notes: null })
  })
  const [updated] = await db.select().from(plantings).where(eq(plantings.id, record.planting.id)).limit(1)
  return enrichPlanting(db, updated, crop, now)
})
