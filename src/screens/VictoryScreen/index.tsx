import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import { playButtonSFX } from '@/utils/audio'

export default function VictoryScreen() {
  const resetGame = useGameStore((s) => s.resetGame)
  const setPhase = useGameStore((s) => s.setPhase)
  const enterArena = useGameStore((s) => s.enterArena)
  const player = useGameStore((s) => s.player)
  const meta = useGameStore((s) => s.meta)
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 300)
  }, [])

  function handleModifiers() {
    playButtonSFX()
    resetGame()
    setPhase('modifiers')
  }

  function handleMenu() {
    playButtonSFX()
    resetGame()
  }

  function handleEnterArena() {
    playButtonSFX()
    enterArena()
  }

  const chipsTotal = meta.totalChips

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
          border: '2px solid rgba(76, 175, 110, 0.5)',
          padding: '16px 12px',
          textAlign: 'center',
          boxShadow: '4px 4px 0 #000',
        }}
      >
        <div style={{ color: '#4caf91', fontSize: 8, marginBottom: 8, letterSpacing: 2 }}>
          {t('run_complete_label') ?? 'RUN COMPLETE'}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.8 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{ color: '#c8a96e', fontSize: 18, letterSpacing: 2 }}
        >
          {t('victory')}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
        transition={{ delay: 0.5 }}
        style={{
          width: '100%',
          background: '#12121e',
          border: '2px solid #1c1c2e',
          padding: '12px',
          boxShadow: '4px 4px 0 #000',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {[
          { label: t('fights_won') ?? 'Fights Won', value: player?.fightsWon ?? 0 },
          { label: t('tokens_short'), value: player?.tokens ?? 0 },
          { label: t('chips'), value: `🟢 ${chipsTotal}` },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid #1c1c2e',
              padding: '10px 0',
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
        transition={{ delay: 0.8 }}
        onClick={handleEnterArena}
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 10,
          color: '#ffffff',
          background: '#c82626',
          border: '3px solid #ff4444',
          padding: '16px 20px',
          cursor: 'pointer',
          borderRadius: 0,
          boxShadow: '4px 4px 0 #000',
          width: '100%',
          letterSpacing: 1,
          animation: 'heavyShake 4s cubic-bezier(0.36, 0.07, 0.19, 0.97) infinite both',
        }}
      >
        ⚔️ {t('enter_arena') ?? 'ENTER ARENA'}
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ delay: 0.9 }}
        onClick={handleModifiers}
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 10,
          color: '#0a0a0f',
          background: '#4caf91',
          border: '3px solid #4caf91',
          padding: '14px 20px',
          cursor: 'pointer',
          borderRadius: 0,
          boxShadow: '4px 4px 0 #000',
          width: '100%',
          letterSpacing: 1,
        }}
      >
        🟢 {t('spend_chips') ?? 'SPEND CHIPS'}
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ delay: 0.9 }}
        onClick={handleMenu}
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: '#666',
          background: 'transparent',
          border: '1px solid #333',
          padding: '10px 20px',
          cursor: 'pointer',
          borderRadius: 0,
          width: '100%',
          letterSpacing: 1,
        }}
      >
        ▶ {t('back_to_menu')}
      </motion.button>
    </motion.div>
  )
}
