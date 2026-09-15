import { z } from 'zod'

const positiveDays = (max: number) => z.coerce.number().int('Use um número inteiro de dias.').min(1, 'Informe pelo menos 1 dia.').max(max, `Use no máximo ${max} dias.`)

export const cropTypeFieldsSchema = z.object({
  emoji: z.string().trim().min(1, 'Informe um emoji.').max(8, 'Use um emoji curto.'),
  name: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres.').max(80, 'O nome deve ter no máximo 80 caracteres.'),
  defaultWateringIntervalDays: positiveDays(365),
  defaultFertilizingIntervalDays: positiveDays(365),
  defaultHarvestDays: positiveDays(730)
})

export const cropTypePatchSchema = cropTypeFieldsSchema.partial().refine((value) => Object.keys(value).length > 0, 'Informe ao menos um campo para atualizar.')

export function cropTypeDatabaseValues(input: z.infer<typeof cropTypeFieldsSchema>) {
  return {
    ...input,
    name: input.name.trim(),
    emoji: input.emoji.trim()
  }
}
