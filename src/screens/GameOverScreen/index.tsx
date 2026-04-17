import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import { playButtonSFX } from '@/utils/audio'

export default function GameOverScreen() {
  const resetGame = useGameStore((s) => s.resetGame)
  const player = useGameStore((s) => s.player)
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 300)
  }, [])

  const score = (player?.tokens ?? 0) * 100 + (player?.fightsWon ?? 0) * 500

  function handleRetry() {
    playButtonSFX()
    resetGame()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
        fontFamily: "'Press Start 2P', monospace",
        background: '#0a0a0f',
        padding: '16px',
        flex: 1,
      }}
    >
      <div
        style={{
          width: '100%',
          background: '#12121e',
          border: '2px solid #3d2b1f',
          padding: '16px 12px',
          textAlign: 'center',
          boxShadow: '4px 4px 0 #000',
        }}
      >
        <div style={{ color: '#888', fontSize: 8, marginBottom: 8, letterSpacing: 2 }}>
          {t('end_of_game')}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.8 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{ color: '#e05252', fontSize: 20, letterSpacing: 3 }}
        >
          {t('game_over')}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
        transition={{ delay: 0.6 }}
        style={{
          width: '100%',
          background: '#12121e',
          border: '2px solid #1c1c2e',
          padding: '12px',
          boxShadow: '4px 4px 0 #000',
        }}
      >
        {[
          { label: t('score_label'), value: score },
          { label: t('hp_label'), value: `${player?.hp ?? 0}/${player?.maxHp ?? 100}` },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid #1c1c2e',
              padding: '8px 0',
              fontSize: 8,
              color: '#b5a89d',
            }}
          >
            <span>{label}</span>
            <span style={{ color: '#c8a96e' }}>{value}</span>
          </div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ delay: 0.9 }}
        onClick={handleRetry}
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 12,
          color: '#0a0a0f',
          background: '#c8a96e',
          border: '3px solid #c8a96e',
          padding: '14px 28px',
          cursor: 'pointer',
          borderRadius: 0,
          boxShadow: '4px 4px 0 #000',
          width: '100%',
          letterSpacing: 2,
        }}
      >
        ▶ {t('back_to_menu')}
      </motion.button>
    </motion.div>
  )
}
