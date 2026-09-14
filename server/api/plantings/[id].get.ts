import { notFound } from '~/server/utils/http'
import { enrichPlanting, findPlanting } from '~/server/utils/planting'
import { useDb } from '~/server/db'

export default defineEventHandler(async (event) => {
  const result = await findPlanting(useDb(), getRouterParam(event, 'id')!)
  if (!result) notFound('Plantio não encontrado.')
  return enrichPlanting(useDb(), result.planting, result.cropType)
})
