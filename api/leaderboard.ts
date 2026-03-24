import type { VercelRequest, VercelResponse } from '@vercel/node'
import { get, list, put } from '@vercel/blob'

export interface LeaderboardEntry {
  userId: string
  username: string
  score: number
  completedAt: string | null
}

const PREFIX = 'leaderboard/'
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

async function readEntry(pathname: string): Promise<LeaderboardEntry | null> {
  const blob = await get(pathname, {
    access: 'private',
    token: BLOB_TOKEN,
    useCache: false,
  })

  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    return null
  }

  const payload = await new Response(blob.stream).text()
  return JSON.parse(payload) as LeaderboardEntry
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (!BLOB_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' })
  }

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: PREFIX, token: BLOB_TOKEN })

      const entries = await Promise.all(
        blobs.map(async (blob) => readEntry(blob.pathname)),
      )

      const sorted = entries
        .filter((entry): entry is LeaderboardEntry => entry !== null)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          if (a.completedAt && b.completedAt) {
            return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
          }
          return 0
        })
        .slice(0, 20)

      return res.status(200).json(sorted)
    } catch (error) {
      console.error('GET leaderboard error:', error)
      return res.status(500).json({ error: 'Failed to fetch leaderboard' })
    }
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body

    const { userId, username, score, completedAt } = body as Partial<LeaderboardEntry>

    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' })
    }

    const blobKey = `${PREFIX}${userId}.json`

    try {
      const existingEntry = await readEntry(blobKey)
      const nextScore = Math.max(existingEntry?.score ?? 0, score ?? 0)

      const entry: LeaderboardEntry = {
        userId: String(userId),
        username: String(username),
        score: nextScore,
        completedAt: nextScore > 0 ? (completedAt ?? existingEntry?.completedAt ?? new Date().toISOString()) : null,
      }

      await put(blobKey, JSON.stringify(entry), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        token: BLOB_TOKEN,
      })

      return res.status(200).json(entry)
    } catch (error) {
      console.error('POST leaderboard error:', error)
      return res.status(500).json({ error: 'Failed to update leaderboard' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
