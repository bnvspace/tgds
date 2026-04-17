import { AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import StartScreen from '@/screens/StartScreen'
import Layout from '@/components/Layout'
import RewardBurstLayer from '@/components/RewardBurstLayer'
import ScreenLoader from '@/components/ScreenLoader'
import { Suspense, lazy, useEffect, useRef } from 'react'
import { primeAudioPlayback, setAudioMuted, startBGM, stopBGM } from '@/utils/audio'
import { setHapticsEnabled } from '@/utils/haptics'
import { getTelegramUser, registerUser, calcScore } from '@/utils/leaderboard'

const StartSymbolsScreen = lazy(() => import('@/screens/InitialShop'))
const CombatScreen = lazy(() => import('@/screens/CombatScreen'))
const PostCombatScreen = lazy(() => import('@/screens/PostCombatScreen'))
const ShopScreen = lazy(() => import('@/screens/ShopScreen'))
const WorldMapScreen = lazy(() => import('@/screens/WorldMapScreen'))
const LeaderboardScreen = lazy(() => import('@/screens/LeaderboardScreen'))
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen'))
const MetaMenu = lazy(() => import('@/screens/MetaMenu'))
const GameOverScreen = lazy(() => import('@/screens/GameOverScreen'))
const VictoryScreen = lazy(() => import('@/screens/VictoryScreen'))

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
      <Suspense fallback={<ScreenLoader />}>
        <AnimatePresence mode="wait">
          {renderScreen()}
        </AnimatePresence>
      </Suspense>
      <RewardBurstLayer />
    </Layout>
  )
}
