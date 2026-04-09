'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 font-mono text-4xl text-text-muted">⚠</div>
          <h2 className="mb-2 text-lg font-semibold text-text-primary">Something went wrong</h2>
          <p className="mb-6 max-w-sm text-sm text-text-muted">
            An unexpected error occurred. Your data is safe — try refreshing.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="rounded-input border border-border px-6 py-2.5 font-mono text-sm text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
