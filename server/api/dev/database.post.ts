import { desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { careEvents, cropTypes, plantings, plots } from '~/db/schema'
import { addDays, expectedHarvestAt } from '~/server/domain/crop'
import { assertDevMode, getAppNow } from '~/server/utils/dev'
import { badRequest, notFound } from '~/server/utils/http'
import { useDb } from '~/server/db'

const schema = z.object({ action: z.enum(['delete-last-event', 'clear-events', 'clear-plot', 'reset-planting', 'reset-garden']), plotId: z.string().uuid().optional(), gardenId: z.string().uuid().optional() })

export default defineEventHandler(async (event) => {
  assertDevMode(event)
  const body = schema.safeParse(await readBody(event))
  if (!body.success) badRequest('Operação de banco inválida.')
  const db = useDb()
  const now = getAppNow(event)
  if (body.data.action === 'reset-garden') {
    if (!body.data.gardenId) badRequest('Horta não informada.')
    const gardenPlots = await db.select({ id: plots.id }).from(plots).where(eq(plots.gardenId, body.data.gardenId))
    if (gardenPlots.length) await db.delete(plantings).where(inArray(plantings.plotId, gardenPlots.map((plot) => plot.id)))
    return { ok: true }
  }
  if (!body.data.plotId) badRequest('Célula não informada.')
  const [record] = await db.select({ planting: plantings, cropType: cropTypes }).from(plantings).innerJoin(cropTypes, eq(plantings.cropTypeId, cropTypes.id)).where(eq(plantings.plotId, body.data.plotId)).orderBy(desc(plantings.createdAt)).limit(1)
  if (!record) notFound('Nenhum plantio encontrado na célula.')
  if (body.data.action === 'delete-last-event') {
    const [lastEvent] = await db.select({ id: careEvents.id }).from(careEvents).where(eq(careEvents.plantingId, record.planting.id)).orderBy(desc(careEvents.performedAt), desc(careEvents.createdAt)).limit(1)
    if (lastEvent) await db.delete(careEvents).where(eq(careEvents.id, lastEvent.id))
  }
  if (body.data.action === 'clear-events') await db.delete(careEvents).where(eq(careEvents.plantingId, record.planting.id))
  if (body.data.action === 'clear-plot') await db.delete(plantings).where(eq(plantings.plotId, body.data.plotId))
  if (body.data.action === 'reset-planting') {
    await db.transaction(async (tx) => {
      await tx.delete(careEvents).where(eq(careEvents.plantingId, record.planting.id))
      await tx.update(plantings).set({ status: 'ACTIVE', plantedAt: now, expectedHarvestAt: expectedHarvestAt(now, record.cropType), harvestedAt: null, removedAt: null, updatedAt: now }).where(eq(plantings.id, record.planting.id))
    })
  }
  return { ok: true }
})
