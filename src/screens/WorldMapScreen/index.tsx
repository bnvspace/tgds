import { useState } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { zoneBackdropByZone } from '@/assets/pixelArt'
import { useGameStore } from '@/store/gameStore'
import { useTranslation } from '@/i18n'
import type { MapNode } from '@/types'
import styles from './WorldMapScreen.module.css'

const NODE_ICON: Record<string, string> = {
  combat: '⚔',
  elite: '☠',
  shop: '🏪',
  heal: '❤',
  boss: '♛',
}

const NODE_COLOR: Record<string, string> = {
  combat: '#c8a96e',
  elite: '#9b72cf',
  shop: '#4caf6e',
  heal: '#60b8e8',
  boss: '#e05252',
}

const NODE_LABEL_KEY: Record<string, string> = {
  combat: 'node_combat',
  elite: 'node_elite',
  shop: 'node_shop',
  heal: 'node_heal',
  boss: 'boss',
}

export default function WorldMapScreen() {
  const mapNodes = useGameStore((s) => s.mapNodes)
  const currentNodeId = useGameStore((s) => s.currentNodeId)
  const currentZone = useGameStore((s) => s.currentZone)
  const setPhase = useGameStore((s) => s.setPhase)
  const setEnemy = useGameStore((s) => s.setEnemy)
  const player = useGameStore((s) => s.player)
  const worldTier = useGameStore((s) => s.worldTier)
  const store = useGameStore()
  const { t } = useTranslation()

  const ZONE_LABEL: Record<string, string> = {
    swamp: t('zone_swamp'),
    sewer: t('zone_sewer'),
    citadel: t('zone_citadel'),
  }

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const availableIds: Set<string> = new Set()
  if (!currentNodeId) {
    const hasIncoming = new Set(mapNodes.flatMap((n) => n.connections))
    mapNodes.filter((n) => !hasIncoming.has(n.id)).forEach((n) => availableIds.add(n.id))
  } else {
    const current = mapNodes.find((n) => n.id === currentNodeId)
    current?.connections.forEach((id) => availableIds.add(id))
  }

  const selectedNode = selectedNodeId
    ? mapNodes.find((node) => node.id === selectedNodeId) ?? null
    : null
  const mapAreaStyle = {
    '--map-backdrop': `url("${zoneBackdropByZone[currentZone]}")`,
  } as CSSProperties

  function handleNodeClick(node: MapNode) {
    if (!availableIds.has(node.id) || node.visited) return
    if (selectedNodeId === node.id) {
      setSelectedNodeId(null)
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

    import('@/game/enemies').then(({ getRandomEnemy }) => {
      const enemy = getRandomEnemy(node.zone, node.type === 'boss', worldTier)
      setEnemy(enemy)
      setPhase('combat_start')
    })
  }

  const zones = ['swamp', 'sewer', 'citadel'] as const

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>{t('world_map_title')}</h2>
          <div className={styles.metaRow}>
            <span className={styles.metaChip}>
              {t('current_zone')}: {ZONE_LABEL[currentZone]}
            </span>
            <span className={styles.metaChip}>
              {t('world_tier')} {worldTier + 1}
            </span>
          </div>
        </div>

        <div className={styles.playerStats}>
          <span className={styles.playerChip}>
            {t('hp_label')} {player?.hp ?? 0}/{player?.maxHp ?? 0}
          </span>
          <span className={styles.playerChip}>
            {t('tokens_short')} {player?.tokens ?? 0}
          </span>
        </div>
      </div>

      <div className={styles.mapShell}>
        <div className={styles.mapArea} style={mapAreaStyle}>
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

          {mapNodes.map((node) => {
            const isAvailable = availableIds.has(node.id)
            const isCurrent = node.id === currentNodeId
            const isVisited = node.visited
            const isSelected = node.id === selectedNodeId

            return (
              <motion.button
                key={node.id}
                className={`${styles.node} ${isAvailable ? styles.available : ''} ${isCurrent ? styles.current : ''} ${isVisited ? styles.visited : ''} ${isSelected ? styles.selected : ''}`}
                data-type={node.type}
                style={{
                  left: `${node.position.x * 100}%`,
                  top: `${node.position.y * 100}%`,
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
      </div>

      <div className={styles.legend}>
        {zones.map((zone) => (
          <span key={zone} className={styles.zoneTag}>
            {ZONE_LABEL[zone]}
          </span>
        ))}
      </div>

      <div className={styles.selectionPanel}>
        <div className={styles.selectionContent}>
          {selectedNode ? (
            <div className={styles.selectionCopy}>
              <span className={styles.selectionLabel}>{t('selected_node')}</span>
              <div className={styles.selectionTitle}>
                <span className={styles.selectionIcon}>{NODE_ICON[selectedNode.type]}</span>
                <span>{t(NODE_LABEL_KEY[selectedNode.type])}</span>
              </div>
              <span className={styles.selectionMeta}>{ZONE_LABEL[selectedNode.zone]}</span>
            </div>
          ) : (
            <p className={styles.selectionHint}>{t('tap_node_hint')}</p>
          )}
        </div>

        <button
          className={`${styles.travelBtn} ${!selectedNode ? styles.travelBtnHidden : ''}`}
          onClick={handleTravel}
          disabled={!selectedNode}
          tabIndex={selectedNode ? 0 : -1}
          aria-hidden={selectedNode ? undefined : 'true'}
        >
          {t('travel')}
        </button>
      </div>
    </motion.div>
  )
}
