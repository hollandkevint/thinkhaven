'use client'

import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineNotice() {
  const { isOnline, wasOffline } = useNetworkStatus()

  if (isOnline && !wasOffline) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm transition-all duration-300 ${
      isOnline
        ? 'bg-forest text-cream'
        : 'bg-terracotta text-cream'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            Back online! Your connection has been restored.
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            You appear to be offline. Some features may not work correctly.
          </>
        )}
      </div>
    </div>
  )
}

export default OfflineNotice