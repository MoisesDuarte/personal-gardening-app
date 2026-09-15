import { notFound } from '~/server/utils/http'
import { enrichPlanting, findPlanting } from '~/server/utils/planting'
import { useDb } from '~/server/db'
import { effectiveCropType, getAppNow } from '~/server/utils/dev'

export default defineEventHandler(async (event) => {
  const result = await findPlanting(useDb(), getRouterParam(event, 'id')!)
  if (!result) notFound('Plantio não encontrado.')
  return enrichPlanting(useDb(), result.planting, effectiveCropType(event, result.cropType), getAppNow(event))
})
