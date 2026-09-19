import { toNextJsHandler } from 'better-auth/next-js'
import { getRailwayAuth } from '@/lib/auth/railway-auth'

export const runtime = 'nodejs'

const handler = toNextJsHandler((request) => getRailwayAuth().handler(request))

export const GET = handler.GET
export const POST = handler.POST
export const PATCH = handler.PATCH
export const PUT = handler.PUT
export const DELETE = handler.DELETE
