'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  paneName: 'chat' | 'canvas'
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class PaneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })
    
    // Log error for debugging
    console.error(`${this.props.paneName} pane error:`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 mb-4 rounded-full bg-error/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-error mb-2">
              {this.props.paneName === 'chat' ? 'Chat Pane Error' : 'Canvas Pane Error'}
            </h3>
            
            <p className="text-secondary mb-4 max-w-md">
              Something went wrong in the {this.props.paneName} pane. This is likely a temporary issue.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-xs text-left max-w-md">
                <summary className="cursor-pointer text-secondary hover:text-primary mb-2">
                  Technical Details
                </summary>
                <div className="bg-parchment p-3 rounded border text-ink-light overflow-auto max-h-32">
                  <div className="font-semibold mb-1">Error:</div>
                  <div className="mb-2">{this.state.error.message}</div>
                  <div className="font-semibold mb-1">Stack:</div>
                  <pre className="whitespace-pre-wrap text-xs">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}
            
            <div className="flex gap-2">
              <button 
                onClick={this.handleRetry}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                Retry
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-divider rounded-lg hover:bg-primary/5 transition-colors"
              >
                Reload Page
              </button>
            </div>
            
            <p className="text-xs text-secondary mt-4">
              If this error persists, please contact support with the technical details above.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Loading component for pane initialization
interface LoadingPaneProps {
  paneName: 'chat' | 'canvas'
  message?: string
}

export function LoadingPane({ paneName, message }: LoadingPaneProps) {
  const defaultMessage = paneName === 'chat' 
    ? 'Initializing strategic conversation...' 
    : 'Preparing visual canvas...'

  return (
    <div className="loading-pane">
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <div className="loading-shimmer w-8 h-8 rounded-full"></div>
        </div>
        
        <h3 className="text-lg font-semibold text-primary mb-2">
          Loading {paneName === 'chat' ? 'Chat' : 'Canvas'}
        </h3>
        
        <p className="text-secondary mb-4">
          {message || defaultMessage}
        </p>
        
        <div className="flex items-center gap-2">
          <div className="loading-shimmer h-2 w-16 rounded"></div>
          <div className="loading-shimmer h-2 w-12 rounded"></div>
          <div className="loading-shimmer h-2 w-20 rounded"></div>
        </div>
      </div>
    </div>
  )
}

// Offline indicator component
export function OfflineIndicator() {
  return (
    <div className="offline-indicator">
      <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg mb-4">
        <div className="w-4 h-4 bg-warning rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-warning">Connection Lost</p>
          <p className="text-xs text-warning/80">Working offline - changes will sync when reconnected</p>
        </div>
      </div>
    </div>
  )
}

// Hook for online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}