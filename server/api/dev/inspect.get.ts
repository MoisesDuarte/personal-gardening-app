import { and, desc, eq } from 'drizzle-orm'
import { careEvents, cropTypes, plantings, plots } from '~/db/schema'
import { enrichPlanting } from '~/server/utils/planting'
import { effectiveCropType, getAppNow, assertDevMode } from '~/server/utils/dev'
import { notFound } from '~/server/utils/http'
import { useDb } from '~/server/db'

export default defineEventHandler(async (event) => {
  assertDevMode(event)
  const plotId = String(getQuery(event).plotId || '')
  if (!plotId) notFound('Célula não informada.')
  const db = useDb()
  const [plot] = await db.select().from(plots).where(eq(plots.id, plotId)).limit(1)
  if (!plot) notFound('Célula não encontrada.')
  const [record] = await db.select({ planting: plantings, cropType: cropTypes })
    .from(plantings)
    .innerJoin(cropTypes, eq(plantings.cropTypeId, cropTypes.id))
    .where(eq(plantings.plotId, plotId))
    .orderBy(desc(plantings.createdAt))
    .limit(1)
  if (!record) return { plot, planting: null, persistedPlanting: null, persistedCropType: null }
  const cropType = effectiveCropType(event, record.cropType)
  const planting = await enrichPlanting(db, record.planting, cropType, getAppNow(event))
  const lastEvents = await db.select().from(careEvents).where(and(eq(careEvents.plantingId, record.planting.id))).orderBy(desc(careEvents.performedAt), desc(careEvents.createdAt))
  return { plot, planting, persistedPlanting: record.planting, persistedCropType: record.cropType, effectiveCropType: cropType, lastEvents }
})
