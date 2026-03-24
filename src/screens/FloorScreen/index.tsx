import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GameSymbol } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { spinSlot, getColumnSymbols, getAdjacentCells, applyItemEffect, applySpellEffect } from '@/game/engine'
import { STARTER_DECK } from '@/game/symbols'
import { gameLog } from '@/utils/logger'
import DungeonGrid from '@/components/DungeonGrid'
import styles from './FloorScreen.module.css'

type SpinPhase = 'spinning' | 'spell_flash' | 'floor'

export default function FloorScreen() {
  const { grid, symbols, currentFloor, player, setGrid, setSymbols, setPlayer, markCellVisited, movePlayer, setPhase } = useGameStore()
  const [spinPhase, setSpinPhase] = useState<SpinPhase>('spinning')
  const [spinColumns, setSpinColumns] = useState<GameSymbol[][]>([])

  // ── 1. Auto-spin on mount ──────────────────────────────────────────────
  useEffect(() => {
    const deck = symbols.length > 0 ? symbols : STARTER_DECK
    if (symbols.length === 0) setSymbols(STARTER_DECK)

    const newGrid = spinSlot(deck)

    // Show spinning columns during animation
    const cols = Array.from({ length: 7 }, (_, col) => getColumnSymbols(newGrid, col))
    setSpinColumns(cols)

    // After animation finishes — commit grid and apply spell effects
    const timer = setTimeout(() => {
      setGrid(newGrid)

      // Apply all Spell symbols immediately (per mechanics.md)
      if (player) {
        const spells = newGrid.flat().filter((c) => c.symbol?.type === 'spell')
        let updatedPlayer = player
        spells.forEach((c) => {
          if (c.symbol) updatedPlayer = applySpellEffect(c.symbol, updatedPlayer)
        })
        if (spells.length > 0) setPlayer(updatedPlayer)
        gameLog.spin(newGrid.flat().length)
      }

      // Flash → floor
      setSpinPhase('spell_flash')
      setTimeout(() => setSpinPhase('floor'), 300)
    }, 2800)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 2. Reachable cells ─────────────────────────────────────────────────
  const reachableCells = (() => {
    if (!player || spinPhase !== 'floor') return new Set<string>()
    return new Set(
      getAdjacentCells(player.position, grid).map((c) => `${c.row}-${c.col}`)
    )
  })()

  // ── 3. Move handler ────────────────────────────────────────────────────
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!player || spinPhase !== 'floor') return
    const cell = grid[row][col]
    if (!cell || cell.visited) return

    movePlayer(row, col)
    markCellVisited(row, col)

    if (cell.symbol?.type === 'item') {
      const updated = applyItemEffect(cell.symbol, player)
      setPlayer(updated)
      gameLog.move(row, col)
    }

    if (cell.symbol?.type === 'enemy') {
      // Iteration 5: initiate combat
      gameLog.combat('player→enemy', 0)
    }
  }, [player, spinPhase, grid, movePlayer, markCellVisited, setPlayer])

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.floor}>Floor {currentFloor}</span>
        {player && (
          <div className={styles.hpWrap}>
            <span className={styles.hpLabel}>HP</span>
            <div className={styles.hpBar}>
              <div
                className={styles.hpFill}
                style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
              />
            </div>
            <span className={styles.hpValue}>{player.hp}/{player.maxHp}</span>
          </div>
        )}
        {player && <span className={styles.atk}>⚔ {player.attack}</span>}
      </div>

      {/* Spinning overlay */}
      <AnimatePresence>
        {spinPhase === 'spinning' && (
          <motion.div
            className={styles.spinOverlay}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.spinCols}>
              {spinColumns.map((col, ci) => (
                <div key={ci} className={styles.spinCol} style={{ animationDelay: `${ci * 0.12}s` }}>
                  {col.map((sym, ri) => (
                    <div key={ri} className={styles.spinCell}>{sym.icon}</div>
                  ))}
                </div>
              ))}
            </div>
            <p className={styles.spinLabel}>Entering Floor {currentFloor}...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spell flash */}
      <AnimatePresence>
        {spinPhase === 'spell_flash' && (
          <motion.div
            className={styles.spellFlash}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        )}
      </AnimatePresence>

      {/* Grid */}
      {(spinPhase === 'floor' || spinPhase === 'spell_flash') && grid.length > 0 && player && (
        <div className={styles.gridWrapper}>
          <DungeonGrid
            grid={grid}
            playerPos={player.position}
            reachableCells={reachableCells}
            onCellClick={handleCellClick}
          />
        </div>
      )}

      {/* Status bar */}
      {spinPhase === 'floor' && player && (
        <div className={styles.status}>
          <span className={styles.statusText}>Tap adjacent cell to move</span>
        </div>
      )}
    </motion.div>
  )
}
