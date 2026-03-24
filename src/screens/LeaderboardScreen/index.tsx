import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import { fetchLeaderboard, getTelegramUser } from '@/utils/leaderboard'
import type { LeaderboardEntry } from '@/utils/leaderboard'
import styles from './LeaderboardScreen.module.css'
import { playButtonSFX } from '@/utils/audio'

const MEDALS = ['🥇', '🥈', '🥉']

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  })
}

export default function LeaderboardScreen() {
  const setPhase = useGameStore((s) => s.setPhase)
  const { t } = useTranslation()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const tgUser = getTelegramUser()

  useEffect(() => {
    fetchLeaderboard().then((data) => {
      setEntries(data)
      setLoading(false)
    })
  }, [])

  function back() {
    playButtonSFX()
    setPhase('meta_menu')
  }

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={back}>
          {t('back')}
        </button>
        <h2 className={styles.title}>🏆 {t('leaderboard')}</h2>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loading}>⌛ {t('loading')}...</div>
        ) : entries.length === 0 ? (
          <div className={styles.empty}>{t('no_data')}</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('player')}</th>
                <th>{t('score_label')}</th>
                <th>{t('record_label')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const isMe = tgUser && String(tgUser.id) === entry.userId
                return (
                  <tr key={entry.userId} className={isMe ? styles.myRow : ''}>
                    <td className={styles.rank}>
                      {i < 3 ? MEDALS[i] : `${i + 1}`}
                    </td>
                    <td className={styles.username}>
                      {entry.username}
                      {isMe && <span className={styles.meTag}> ★</span>}
                    </td>
                    <td className={styles.score}>{entry.score}</td>
                    <td className={styles.date}>{formatDate(entry.completedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {tgUser && !loading && (
        <div className={styles.myRankHint}>
          {(() => {
            const idx = entries.findIndex((e) => String(e.userId) === String(tgUser.id))
            if (idx === -1) return t('not_in_table')
            return `${t('your_rank')}: #${idx + 1}`
          })()}
        </div>
      )}
    </motion.div>
  )
}
