'use client'

import { createAuthClient } from 'better-auth/client'

export const railwayAuthClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || undefined,
})
