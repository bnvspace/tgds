import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import type { MapNode } from '@/types'
import styles from './WorldMapScreen.module.css'

const NODE_ICON: Record<string, string> = {
  combat: '⚔',
  elite:  '💀',
  shop:   '🏪',
  heal:   '❤️',
  boss:   '👑',
}

const NODE_COLOR: Record<string, string> = {
  combat: '#c8a96e',
  elite:  '#9b72cf',
  shop:   '#4caf6e',
  heal:   '#60b8e8',
  boss:   '#e05252',
}

export default function WorldMapScreen() {
  const mapNodes = useGameStore((s) => s.mapNodes)
  const currentNodeId = useGameStore((s) => s.currentNodeId)
  const setPhase = useGameStore((s) => s.setPhase)
  const setEnemy = useGameStore((s) => s.setEnemy)
  const player = useGameStore((s) => s.player)
  const worldTier = useGameStore((s) => s.worldTier)
  const store = useGameStore()
  const { t } = useTranslation()

  const ZONE_LABEL: Record<string, string> = {
    swamp:   t('zone_swamp'),
    sewer:   t('zone_sewer'),
    citadel: t('zone_citadel'),
  }

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Available nodes = connections from currentNode, or floor-0 nodes if no current
  const availableIds: Set<string> = new Set()
  if (!currentNodeId) {
    const hasIncoming = new Set(mapNodes.flatMap((n) => n.connections))
    mapNodes.filter((n) => !hasIncoming.has(n.id)).forEach((n) => availableIds.add(n.id))
  } else {
    const current = mapNodes.find((n) => n.id === currentNodeId)
    current?.connections.forEach((id) => availableIds.add(id))
  }

  function handleNodeClick(node: MapNode) {
    if (!availableIds.has(node.id) || node.visited) return
    if (selectedNodeId === node.id) {
      setSelectedNodeId(null) // deselect
    } else {
      setSelectedNodeId(node.id)
    }
  }

  function handleTravel() {
    if (!selectedNodeId) return
    const node = mapNodes.find((n) => n.id === selectedNodeId)
    if (!node) return

    store.setCurrentNode(node.id)

    if (node.type === 'shop' || node.type === 'heal') {
      setPhase('shop')
      return
    }

    // combat / elite / boss → set proper enemy and go to combat
    import('@/game/enemies').then(({ getRandomEnemy }) => {
      const enemy = getRandomEnemy(node.zone, node.type === 'boss', worldTier)
      setEnemy(enemy)
      setPhase('combat_start')
    })
  }

  // Group nodes by zone for zone labels
  const zones = ['swamp', 'sewer', 'citadel'] as const

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{t('world_map_title')}</h2>
        <span className={styles.hp}>❤ {player?.hp ?? 0}/{player?.maxHp ?? 100}</span>
      </div>

      <div className={styles.mapArea}>
        {/* SVG edges */}
        <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
          {mapNodes.map((node) =>
            node.connections.map((targetId) => {
              const target = mapNodes.find((n) => n.id === targetId)
              if (!target) return null
              return (
                <line
                  key={`${node.id}-${targetId}`}
                  x1={node.position.x * 100}
                  y1={node.position.y * 100}
                  x2={target.position.x * 100}
                  y2={target.position.y * 100}
                  stroke="#2a2a3e"
                  strokeWidth="0.8"
                />
              )
            })
          )}
        </svg>

        {/* Nodes */}
        {mapNodes.map((node) => {
          const isAvailable = availableIds.has(node.id)
          const isCurrent = node.id === currentNodeId
          const isVisited = node.visited
          const isSelected = node.id === selectedNodeId

          return (
            <motion.button
              key={node.id}
              className={`${styles.node} ${isAvailable ? styles.available : ''} ${isCurrent ? styles.current : ''} ${isVisited ? styles.visited : ''} ${isSelected ? styles.selected : ''}`}
              style={{
                left: `${node.position.x * 100}%`,
                top:  `${node.position.y * 100}%`,
                borderColor: isAvailable ? NODE_COLOR[node.type] : '#2a2a3e',
              }}
              onClick={() => handleNodeClick(node)}
              disabled={!isAvailable || isVisited}
            >
              <span className={styles.nodeIcon}>{NODE_ICON[node.type]}</span>
              {node.type === 'boss' && (
                <span className={styles.bossLabel}>{t('boss')}</span>
              )}
            </motion.button>
          )
        })}
      </div>

      {selectedNodeId && (
        <div className={styles.travelOverlay}>
          <button className={styles.travelBtn} onClick={handleTravel}>
            {t('travel')}
          </button>
        </div>
      )}

      {/* Zone legend */}
      <div className={styles.legend}>
        {zones.map((z) => (
          <span key={z} className={styles.zoneTag}>{ZONE_LABEL[z]}</span>
        ))}
      </div>
    </motion.div>
  )
}
