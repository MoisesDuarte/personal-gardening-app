import { describe, expect, it } from 'vitest'
import { cropTypeFieldsSchema, cropTypePatchSchema } from '../server/utils/crop-type'

const validCrop = {
  emoji: '🥦',
  name: 'Brócolis',
  defaultWateringIntervalDays: 2,
  defaultFertilizingIntervalDays: 10,
  defaultHarvestDays: 70
}

describe('validação de tipos de planta', () => {
  it('aceita uma planta válida e normaliza espaços', () => {
    const result = cropTypeFieldsSchema.safeParse({ ...validCrop, name: '  Brócolis  ', emoji: ' 🥦 ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toMatchObject({ name: 'Brócolis', emoji: '🥦' })
  })

  it('rejeita intervalos negativos, zero e fracionados', () => {
    for (const value of [-4, 0, 1.7]) {
      expect(cropTypeFieldsSchema.safeParse({ ...validCrop, defaultWateringIntervalDays: value }).success).toBe(false)
    }
  })

  it('exige pelo menos um campo na edição', () => {
    expect(cropTypePatchSchema.safeParse({}).success).toBe(false)
    expect(cropTypePatchSchema.safeParse({ name: 'Tomate' }).success).toBe(true)
  })

  it('limita o emoji a um campo curto', () => {
    expect(cropTypeFieldsSchema.safeParse({ ...validCrop, emoji: 'emoji longo' }).success).toBe(false)
  })
})
