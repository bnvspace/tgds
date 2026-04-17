type SentryModule = typeof import('@sentry/react')

interface ErrorContext {
  scope?: string
  extra?: Record<string, unknown>
}

let monitoringEnabled = false
let sentryModule: SentryModule | null = null
let initPromise: Promise<SentryModule | null> | null = null

function getDsn() {
  return import.meta.env.VITE_SENTRY_DSN?.trim()
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  try {
    return new Error(JSON.stringify(error))
  } catch {
    return new Error('Unknown runtime error')
  }
}

export function initMonitoring() {
  void ensureMonitoring()
}

async function ensureMonitoring() {
  const dsn = getDsn()

  if (!dsn) {
    return null
  }

  if (monitoringEnabled && sentryModule) {
    return sentryModule
  }

  if (!initPromise) {
    initPromise = import('@sentry/react')
      .then((module) => {
        module.init({
          dsn,
          environment: import.meta.env.MODE,
          release: import.meta.env.VITE_APP_VERSION || undefined,
          enabled: true,
          attachStacktrace: true,
          tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
        })

        sentryModule = module
        monitoringEnabled = true

        return module
      })
      .catch(() => null)
  }

  return initPromise
}

export async function captureError(error: unknown, context?: ErrorContext) {
  const Sentry = await ensureMonitoring()

  if (!Sentry || !monitoringEnabled) {
    return
  }

  const normalizedError = normalizeError(error)

  Sentry.withScope((scope) => {
    if (context?.scope) {
      scope.setTag('scope', context.scope)
    }

    for (const [key, value] of Object.entries(context?.extra ?? {})) {
      if (value !== undefined) {
        scope.setExtra(key, value)
      }
    }

    Sentry.captureException(normalizedError)
  })
}
