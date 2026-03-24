import { AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import StartScreen from '@/screens/StartScreen'
import InitialShopScreen from '@/screens/InitialShop'
import CombatScreen from '@/screens/CombatScreen'
import ShopScreen from '@/screens/ShopScreen'
import WorldMapScreen from '@/screens/WorldMapScreen'
import Layout from '@/components/Layout'

export default function App() {
  const phase = useGameStore((s) => s.phase)

  function renderScreen() {
    switch (phase) {
      case 'meta_menu':
        return <StartScreen key="start" />
      case 'initial_shop':
        return <InitialShopScreen key="initial_shop" />
      case 'world_map':
        return <WorldMapScreen key="world_map" />
      case 'combat_start':
      case 'player_spin':
      case 'resolving':
      case 'enemy_action':
      case 'turn_end':
        return <CombatScreen key="combat" />
      case 'post_combat':
      case 'shop':
        return <ShopScreen key="shop" />
      case 'game_over':
        return <GameOverScreen key="gameover" />
      case 'run_complete':
        return <VictoryScreen key="victory" />
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

// ── Inline placeholder screens ────────────────────────────
function GameOverScreen() {
  const resetGame = useGameStore((s) => s.resetGame)
  const addChips = useGameStore((s) => s.addChips)

  function handleRetry() {
    addChips(10) // reward chips even on loss
    resetGame()
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 16,
      fontFamily: "'Press Start 2P', monospace", background: '#0a0a0f',
    }}>
      <h2 style={{ color: '#e05252', fontSize: 14, margin: 0 }}>GAME OVER</h2>
      <p style={{ color: '#3d3d5c', fontSize: 6, textAlign: 'center' }}>
        +10 chips awarded
      </p>
      <button onClick={handleRetry} style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: 8,
        color: '#c8a96e', background: '#12121e', border: '2px solid #c8a96e',
        padding: '12px 20px', cursor: 'pointer', borderRadius: 0,
        boxShadow: '3px 3px 0 #000',
      }}>
        ↩ RETRY
      </button>
    </div>
  )
}

function VictoryScreen() {
  const resetGame = useGameStore((s) => s.resetGame)
  const addChips = useGameStore((s) => s.addChips)
  const setPhase = useGameStore((s) => s.setPhase)

  function handleModifiers() {
    addChips(30) // reward for winning
    resetGame()
    setPhase('meta_menu')
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 16,
      fontFamily: "'Press Start 2P', monospace", background: '#0a0a0f',
    }}>
      <h2 style={{ color: '#c8a96e', fontSize: 14, margin: 0 }}>VICTORY!</h2>
      <p style={{ color: '#3d3d5c', fontSize: 6, textAlign: 'center' }}>
        +30 chips awarded
      </p>
      <button onClick={handleModifiers} style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: 8,
        color: '#0a0a0f', background: '#c8a96e', border: '2px solid #c8a96e',
        padding: '12px 20px', cursor: 'pointer', borderRadius: 0,
        boxShadow: '3px 3px 0 #000',
      }}>
        ▶ PLAY AGAIN
      </button>
    </div>
  )
}
