'use client'

import { Component, ReactNode, ErrorInfo } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  component?: string  // For tracking which component boundary this is
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    console.error(`ErrorBoundary [${this.props.component || 'Unknown'}]:`, error, errorInfo)
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo!, this.retry)
      }

      // Default BMad-specific error UI
      return (
        <BmadErrorFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo!}
          onRetry={this.retry}
        />
      )
    }

    return this.props.children
  }
}

// BMad-specific error fallback component
function BmadErrorFallback({ 
  error, 
  errorInfo, 
  onRetry 
}: { 
  error: Error
  errorInfo: ErrorInfo
  onRetry: () => void 
}) {
  const getErrorGuidance = (error: Error): { title: string; message: string; actions: string[] } => {
    const errorMessage = error.message.toLowerCase()

    // Session-related errors
    if (errorMessage.includes('session') || errorMessage.includes('bmad')) {
      if (errorMessage.includes('create') || errorMessage.includes('creation')) {
        return {
          title: 'Session Creation Failed',
          message: 'We couldn\'t create your strategic thinking session. This might be due to a temporary server issue or network problem.',
          actions: [
            'Try creating the session again',
            'Check your internet connection',
            'If the problem persists, try refreshing the page'
          ]
        }
      }
      
      if (errorMessage.includes('load') || errorMessage.includes('retrieve')) {
        return {
          title: 'Session Loading Failed',
          message: 'We couldn\'t load your session data. Your work might still be saved.',
          actions: [
            'Try refreshing the page',
            'Return to the workspace and try again',
            'Contact support if you\'ve lost important work'
          ]
        }
      }
    }

    // Pathway analysis errors
    if (errorMessage.includes('pathway') || errorMessage.includes('analysis')) {
      return {
        title: 'Pathway Analysis Failed',
        message: 'We couldn\'t analyze your input to recommend the best strategic pathway.',
        actions: [
          'Try submitting your input again',
          'Simplify your description and try again', 
          'Choose a pathway manually if the problem continues'
        ]
      }
    }

    // Network/connection errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return {
        title: 'Connection Problem',
        message: 'We\'re having trouble connecting to our servers. Please check your internet connection.',
        actions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Refresh the page if the problem persists'
        ]
      }
    }

    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('storage')) {
      return {
        title: 'Data Storage Issue',
        message: 'We\'re experiencing temporary issues saving or retrieving data.',
        actions: [
          'Try your action again',
          'Your work should be automatically saved',
          'Contact support if you notice missing data'
        ]
      }
    }

    // Generic fallback
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred in your BMad Method session.',
      actions: [
        'Try the action again',
        'Refresh the page if the problem continues',
        'Return to your workspace and try again'
      ]
    }
  }

  const guidance = getErrorGuidance(error)

  return (
    <div className="bg-white rounded-lg border border-error/20 p-6 max-w-lg mx-auto">
      <div className="text-center">
        {/* Error Icon */}
        <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-error" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>

        {/* Error Title */}
        <h3 className="text-lg font-semibold text-error mb-2">
          {guidance.title}
        </h3>

        {/* Error Message */}
        <p className="text-secondary mb-6">
          {guidance.message}
        </p>

        {/* Action Steps */}
        <div className="text-left mb-6">
          <h4 className="font-medium text-primary mb-3">What you can do:</h4>
          <ul className="space-y-2">
            {guidance.actions.map((action, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-secondary">
                <span className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">{index + 1}</span>
                </span>
                {action}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 border border-divider text-secondary rounded-lg hover:bg-primary/5 transition-colors"
          >
            Refresh Page
          </button>
        </div>

        {/* Technical Details (Collapsible) */}
        <details className="mt-6 text-left">
          <summary className="text-xs text-secondary cursor-pointer hover:text-primary">
            Technical Details (for support)
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-secondary font-mono">
            <div className="mb-2">
              <strong>Error:</strong> {error.name}: {error.message}
            </div>
            {error.stack && (
              <div className="mb-2">
                <strong>Stack:</strong>
                <pre className="mt-1 whitespace-pre-wrap break-all">
                  {error.stack.split('\n').slice(0, 3).join('\n')}
                </pre>
              </div>
            )}
            {errorInfo.componentStack && (
              <div>
                <strong>Component:</strong>
                <pre className="mt-1 whitespace-pre-wrap break-all">
                  {errorInfo.componentStack.split('\n').slice(0, 3).join('\n')}
                </pre>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  )
}