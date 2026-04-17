import { Component, type ErrorInfo, type ReactNode } from 'react'
import RuntimeErrorScreen from '@/components/RuntimeErrorScreen'
import { captureError } from '@/utils/monitoring'

interface RuntimeErrorBoundaryProps {
  children: ReactNode
}

interface RuntimeErrorBoundaryState {
  hasError: boolean
}

export default class RuntimeErrorBoundary extends Component<
  RuntimeErrorBoundaryProps,
  RuntimeErrorBoundaryState
> {
  state: RuntimeErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void captureError(error, {
      scope: 'react.error_boundary',
      extra: {
        componentStack: errorInfo.componentStack,
      },
    })
  }

  render() {
    if (this.state.hasError) {
      return <RuntimeErrorScreen />
    }

    return this.props.children
  }
}
