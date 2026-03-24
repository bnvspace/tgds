import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import WebApp from '@twa-dev/sdk'

try {
  WebApp.ready()
  WebApp.expand()
} catch {
  // Not in Telegram context — silently ignore
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
