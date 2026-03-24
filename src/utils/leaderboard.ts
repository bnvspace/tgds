// ── API utility for leaderboard ────────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string
  username: string
  score: number
  completedAt: string | null
}

// Resolve API base URL: in production use current origin, locally mock
const API_BASE = typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost:3000'

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const r = await fetch(`${API_BASE}/api/leaderboard`, { cache: 'no-store' })
    if (!r.ok) return []
    return r.json()
  } catch {
    return []
  }
}

export async function registerUser(tgUser: {
  id: number
  first_name: string
  username?: string
}, score = 0, completedAt?: string): Promise<void> {
  try {
    const username = tgUser.username
      ? `@${tgUser.username}`
      : tgUser.first_name

    await fetch(`${API_BASE}/api/leaderboard`, {
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
  } catch {
    // Silently fail — leaderboard is not critical
  }
}

export function getTelegramUser() {
  try {
    // @ts-ignore
    return window.Telegram?.WebApp?.initDataUnsafe?.user ?? null
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
