import { cropTypes } from '~/db/schema'
import { useDb } from '~/server/db'
import { badRequest, conflict } from '~/server/utils/http'
import { cropTypeDatabaseValues, cropTypeFieldsSchema } from '~/server/utils/crop-type'

export default defineEventHandler(async (event) => {
  const parsed = cropTypeFieldsSchema.safeParse(await readBody(event))
  if (!parsed.success) badRequest(parsed.error.issues[0]?.message || 'Dados da planta inválidos.')

  try {
    const [cropType] = await useDb().insert(cropTypes).values(cropTypeDatabaseValues(parsed.data)).returning()
    return { ...cropType, activePlantingCount: 0 }
  } catch (cause: any) {
    if (cause?.code === '23505') conflict('Já existe uma planta com esse nome.')
    throw cause
  }
})
