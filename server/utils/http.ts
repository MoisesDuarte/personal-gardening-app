import { createError } from 'h3'

export function badRequest(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message })
}

export function notFound(message = 'Registro não encontrado.'): never {
  throw createError({ statusCode: 404, statusMessage: message })
}

export function conflict(message: string): never {
  throw createError({ statusCode: 409, statusMessage: message })
}
