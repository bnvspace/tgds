// ── Vercel Serverless Function — /api/leaderboard ──────────────────────────
// Strategy: one JSON blob per user at `leaderboard/{userId}.json`
// GET → list all entries, sort by score, return top 20
// POST → create/update this user's entry
// No concurrent write conflicts (each user owns one file)

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put, list, head, del } from '@vercel/blob'

export interface LeaderboardEntry {
  userId: string
  username: string
  score: number
  completedAt: string | null
}

const PREFIX = 'leaderboard/'
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers (needed for TMA)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (!BLOB_TOKEN) {
    return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' })
  }

  // ── GET: return top 20 ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: PREFIX, token: BLOB_TOKEN })

      const entries: LeaderboardEntry[] = await Promise.all(
        blobs.map(async (blob) => {
          const r = await fetch(blob.url)
          return r.json() as Promise<LeaderboardEntry>
        })
      )

      // Sort by score descending, zero-scores last
      const sorted = entries
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          // sort by completedAt for ties
          if (a.completedAt && b.completedAt) {
            return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
          }
          return 0
        })
        .slice(0, 20)

      return res.status(200).json(sorted)
    } catch (err) {
      console.error('GET leaderboard error:', err)
      return res.status(500).json({ error: 'Failed to fetch leaderboard' })
    }
  }

  // ── POST: register or update user ───────────────────────────────────────
  if (req.method === 'POST') {
    const { userId, username, score, completedAt } = req.body as Partial<LeaderboardEntry>

    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username are required' })
    }

    const blobKey = `${PREFIX}${userId}.json`

    try {
      // Check if user already has an entry
      let existingScore = 0
      try {
        const existing = await head(blobKey, { token: BLOB_TOKEN })
        if (existing) {
          const r = await fetch(existing.url)
          const data: LeaderboardEntry = await r.json()
          existingScore = data.score ?? 0
        }
      } catch {
        // New user, no existing entry — that's fine
      }

      // Only update score if new score is higher
      const finalScore = Math.max(existingScore, score ?? 0)

      const entry: LeaderboardEntry = {
        userId: String(userId),
        username: String(username),
        score: finalScore,
        completedAt: finalScore > 0 ? (completedAt ?? new Date().toISOString()) : null,
      }

      await put(blobKey, JSON.stringify(entry), {
        access: 'public',
        addRandomSuffix: false,
        token: BLOB_TOKEN,
        allowOverwrite: true,
      })

      return res.status(200).json(entry)
    } catch (err) {
      console.error('POST leaderboard error:', err)
      return res.status(500).json({ error: 'Failed to update leaderboard' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
