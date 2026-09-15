import { and, asc, eq } from 'drizzle-orm'
import { cropTypes, gardens, plantings, plots } from '~/db/schema'
import { enrichPlanting } from '~/server/utils/planting'
import { notFound } from '~/server/utils/http'
import { useDb } from '~/server/db'
import { effectiveCropType, getAppNow } from '~/server/utils/dev'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const gardenId = getRouterParam(event, 'id')!
  const db = useDb()
  const now = getAppNow(event)
  const [garden] = await db.select().from(gardens).where(eq(gardens.id, gardenId)).limit(1)
  if (!garden) notFound('Horta não encontrada.')
  const rows = await db.select({ plot: plots, planting: plantings, cropType: cropTypes })
    .from(plots)
    .leftJoin(plantings, and(eq(plantings.plotId, plots.id), eq(plantings.status, 'ACTIVE')))
    .leftJoin(cropTypes, eq(plantings.cropTypeId, cropTypes.id))
    .where(eq(plots.gardenId, gardenId))
    .orderBy(asc(plots.row), asc(plots.column))
  const result = []
  for (const row of rows) {
    const planting = row.planting && row.cropType ? await enrichPlanting(db, row.planting, effectiveCropType(event, row.cropType), now) : null
    result.push({ ...row.plot, planting })
  }
  return result
})
