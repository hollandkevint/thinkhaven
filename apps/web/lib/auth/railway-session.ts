import 'next/dist/compiled/server-only'

import { headers } from 'next/headers'
import { getRailwayAuth } from './railway-auth'

type RailwayAuth = ReturnType<typeof getRailwayAuth>

export type RailwaySession = NonNullable<Awaited<ReturnType<RailwayAuth['api']['getSession']>>>
export type RailwaySessionRequest = Request | HeadersInit

export class RailwayAuthRequiredError extends Error {
  readonly status = 401
  readonly code = 'AUTHENTICATION_REQUIRED'

  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'RailwayAuthRequiredError'
  }
}

async function getRequestHeaders(request?: RailwaySessionRequest): Promise<Headers> {
  if (request instanceof Request) return request.headers
  return new Headers(request ?? await headers())
}

export async function getRailwaySession(request?: RailwaySessionRequest): Promise<RailwaySession | null> {
  return getRailwayAuth().api.getSession({ headers: await getRequestHeaders(request) })
}

export async function requireRailwaySession(request?: RailwaySessionRequest): Promise<RailwaySession> {
  const session = await getRailwaySession(request)
  if (!session) throw new RailwayAuthRequiredError()
  return session
}
