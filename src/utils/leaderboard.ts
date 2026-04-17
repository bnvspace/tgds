// ── API utility for leaderboard ────────────────────────────────────────────
import { captureError } from '@/utils/monitoring'

export interface LeaderboardEntry {
  userId: string
  username: string
  score: number
  completedAt: string | null
}

export interface TelegramUser {
  id: number
  first_name: string
  username?: string
}

type TelegramWindow = Window & typeof globalThis & {
  Telegram?: {
    WebApp?: {
      initDataUnsafe?: {
        user?: unknown
      }
    }
  }
}

function isTelegramUser(value: unknown): value is TelegramUser {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return 'id' in value && 'first_name' in value
}

// Resolve API base URL: in production use current origin, locally mock
const API_BASE = typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost:3000'

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const r = await fetch(`${API_BASE}/api/leaderboard`, { cache: 'no-store' })
    if (!r.ok) {
      captureError(new Error(`Leaderboard fetch failed with status ${r.status}`), {
        scope: 'leaderboard.fetch',
        extra: { status: r.status },
      })
      return []
    }
    return r.json()
  } catch (error) {
    captureError(error, { scope: 'leaderboard.fetch' })
    return []
  }
}

export async function registerUser(
  tgUser: TelegramUser,
  score = 0,
  completedAt?: string,
): Promise<void> {
  try {
    const username = tgUser.username
      ? `@${tgUser.username}`
      : tgUser.first_name

    const response = await fetch(`${API_BASE}/api/leaderboard`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: String(tgUser.id),
        username,
        score,
        completedAt: completedAt ?? null,
      }),
    })

    if (!response.ok) {
      captureError(new Error(`Leaderboard update failed with status ${response.status}`), {
        scope: 'leaderboard.register',
        extra: {
          status: response.status,
          userId: tgUser.id,
          score,
        },
      })
    }
  } catch (error) {
    captureError(error, {
      scope: 'leaderboard.register',
      extra: {
        userId: tgUser.id,
        score,
      },
    })
    // Silently fail — leaderboard is not critical
  }
}

export function getTelegramUser() {
  try {
    const candidate = (window as TelegramWindow).Telegram?.WebApp?.initDataUnsafe?.user
    return isTelegramUser(candidate) ? candidate : null
  } catch {
    return null
  }
}

export function calcScore(params: {
  tokens: number
  fightsWon: number
  survived: boolean
}): number {
  const base = params.tokens * 100 + params.fightsWon * 500
  const survivalBonus = params.survived ? 1000 : 0
  return base + survivalBonus
}
