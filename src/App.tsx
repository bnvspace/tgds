import { AnimatePresence, motion } from 'framer-motion'
import { BOSS_CHIPS_REWARD, useGameStore } from '@/store/gameStore'
import StartScreen from '@/screens/StartScreen'
import StartSymbolsScreen from '@/screens/InitialShop'
import CombatScreen from '@/screens/CombatScreen'
import PostCombatScreen from '@/screens/PostCombatScreen'
import ShopScreen from '@/screens/ShopScreen'
import WorldMapScreen from '@/screens/WorldMapScreen'
import LeaderboardScreen from '@/screens/LeaderboardScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import MetaMenu from '@/screens/MetaMenu'
import Layout from '@/components/Layout'
import { useEffect, useRef, useState } from 'react'
import { primeAudioPlayback, setAudioMuted, startBGM, stopBGM } from '@/utils/audio'
import { useTranslation } from '@/i18n'
import { playButtonSFX } from '@/utils/audio'
import { setHapticsEnabled } from '@/utils/haptics'
import { getTelegramUser, registerUser, calcScore } from '@/utils/leaderboard'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const isMuted = useGameStore((s) => s.meta.isMuted)
  const isHapticsEnabled = useGameStore((s) => s.meta.isHapticsEnabled)
  const player = useGameStore((s) => s.player)
  const audioPrimedRef = useRef(false)

  // Авторизация Telegram-пользователя при запуске
  useEffect(() => {
    const tgUser = getTelegramUser()
    if (tgUser) {
      registerUser(tgUser, 0) // регистрация с результатом 0
    }
  }, [])

  // Запись очков в лидерборд при победе ИЛИ поражении
  useEffect(() => {
    if (phase === 'run_complete' || phase === 'game_over') {
      const tgUser = getTelegramUser()
      if (tgUser && player) {
        const score = calcScore({
          tokens: player.tokens,
          fightsWon: player.fightsWon ?? 0,
          survived: phase === 'run_complete',
        })
        // Only register if score > 0 (player did something)
        if (score > 0) {
          registerUser(tgUser, score, new Date().toISOString())
        }
      }
    }
  }, [phase, player])

  // Sync mute state
  useEffect(() => {
    setAudioMuted(!!isMuted)
  }, [isMuted])

  useEffect(() => {
    setHapticsEnabled(isHapticsEnabled !== false)
  }, [isHapticsEnabled])

  // Play BGM everywhere except on these terminal screens
  useEffect(() => {
    if (phase === 'game_over' || phase === 'run_complete') {
      stopBGM()
    } else {
      startBGM()
    }
  }, [phase])

  useEffect(() => {
    function handleFirstInteraction() {
      if (audioPrimedRef.current) return
      audioPrimedRef.current = true
      primeAudioPlayback()

      if (!isMuted && phase !== 'game_over' && phase !== 'run_complete') {
        startBGM()
      }
    }

    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true })
    return () => window.removeEventListener('pointerdown', handleFirstInteraction)
  }, [isMuted, phase])

  function renderScreen() {
    switch (phase) {
      case 'meta_menu':
        return <StartScreen key="start" />
      case 'settings':
        return <SettingsScreen key="settings" />
      case 'start_symbols':
        return <StartSymbolsScreen key="start_symbols" />
      case 'world_map':
        return <WorldMapScreen key="world_map" />
      case 'combat_start':
      case 'player_spin':
      case 'resolving':
      case 'enemy_action':
      case 'turn_end':
        return <CombatScreen key="combat" />
      case 'post_combat':
        return <PostCombatScreen key="post-combat" />
      case 'shop':
        return <ShopScreen key="shop" />
      case 'game_over':
        return <GameOverScreen key="gameover" />
      case 'run_complete':
        return <VictoryScreen key="victory" />
      case 'leaderboard':
        return <LeaderboardScreen key="leaderboard" />
      case 'modifiers':
        return <MetaMenu key="modifiers" />
      default:
        return <StartScreen key="start" />
    }
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
    </Layout>
  )
}

// ── Game Over Screen ─────────────────────────────────────
function GameOverScreen() {
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
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 12,
        fontFamily: "'Press Start 2P', monospace", background: '#0a0a0f',
        padding: '16px',
        flex: 1, // Ensure it fills the flex container
      }}
    >
      {/* Title panel */}
      <div style={{
        width: '100%', background: '#12121e',
        border: '2px solid #3d2b1f', padding: '16px 12px',
        textAlign: 'center', boxShadow: '4px 4px 0 #000'
      }}>
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

      {/* Stats panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
        transition={{ delay: 0.6 }}
        style={{
          width: '100%', background: '#12121e',
          border: '2px solid #1c1c2e', padding: '12px',
          boxShadow: '4px 4px 0 #000',
        }}
      >
        {[ 
          { label: t('score_label'), value: score },
          { label: t('hp_label'), value: `${player?.hp ?? 0}/${player?.maxHp ?? 100}` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between',
            borderBottom: '1px solid #1c1c2e', padding: '8px 0',
            fontSize: 8, color: '#b5a89d'
          }}>
            <span>{label}</span>
            <span style={{ color: '#c8a96e' }}>{value}</span>
          </div>
        ))}
      </motion.div>

      {/* Retry button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ delay: 0.9 }}
        onClick={handleRetry}
        style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: 12,
          color: '#0a0a0f', background: '#c8a96e', border: '3px solid #c8a96e',
          padding: '14px 28px', cursor: 'pointer', borderRadius: 0,
          boxShadow: '4px 4px 0 #000', width: '100%', letterSpacing: 2,
        }}
      >
        ▶ {t('back_to_menu')}
      </motion.button>
    </motion.div>
  )
}

function VictoryScreen() {
  const resetGame = useGameStore((s) => s.resetGame)
  const setPhase = useGameStore((s) => s.setPhase)
  const { t } = useTranslation()

  function handleModifiers() {
    playButtonSFX()
    resetGame()
    setPhase('meta_menu')
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 16,
      fontFamily: "'Press Start 2P', monospace", background: '#0a0a0f',
      flex: 1, // Ensure it fills the flex container
    }}>
      <h2 style={{ color: '#c8a96e', fontSize: 14, margin: 0 }}>{t('victory')}</h2>
      <p style={{ color: '#3d3d5c', fontSize: 6, textAlign: 'center' }}>
        {t('chips_won')}: +{BOSS_CHIPS_REWARD}
      </p>
      <button
        onClick={handleModifiers}
        style={{
          fontFamily: "'Press Start 2P', monospace", fontSize: 8,
          color: '#0a0a0f', background: '#c8a96e', border: '2px solid #c8a96e',
          padding: '12px 20px', cursor: 'pointer', borderRadius: 0,
          boxShadow: '3px 3px 0 #000',
        }}
      >
        {'>'} {t('back_to_menu')}
      </button>
    </div>
  )
}
