import type { MapNode, ZoneType, NodeType } from '@/types'

// ── Deterministic RNG (seeded) ────────────────────────────
function seededRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 4294967296
  }
}

// ── World map generation ──────────────────────────────────
// Structure: 3 zones, each has 3 floors
// Total: 9 nodes + 1 final boss
// Layout:
//   Floor 0 (Swamp):   2 combat nodes, 1 shop
//   Floor 1 (Sewer):   2 combat + 1 elite + 1 shop
//   Floor 2 (Citadel): 2 combat + 1 elite
//   Floor 3: BOSS

interface FloorSpec {
  zone: ZoneType
  nodes: Array<{ type: NodeType; col: number }>
}

const FLOORS: FloorSpec[] = [
  {
    zone: 'swamp',
    nodes: [
      { type: 'combat', col: 0 },
      { type: 'combat', col: 1 },
      { type: 'shop',   col: 2 },
    ],
  },
  {
    zone: 'sewer',
    nodes: [
      { type: 'combat', col: 0 },
      { type: 'elite',  col: 1 },
      { type: 'combat', col: 2 },
      { type: 'shop',   col: 3 },
    ],
  },
  {
    zone: 'citadel',
    nodes: [
      { type: 'combat', col: 0 },
      { type: 'elite',  col: 1 },
      { type: 'heal',   col: 2 },
    ],
  },
]

export function generateWorldMap(seed = Date.now()): MapNode[] {
  const rng = seededRng(seed)
  const nodes: MapNode[] = []
  let idCounter = 0

  const nodeGrid: string[][] = [] // nodeGrid[floor][col] = node id

  // Create nodes per floor
  FLOORS.forEach((floor, fi) => {
    const col_nodes: string[] = []
    floor.nodes.forEach((spec) => {
      const id = `n${idCounter++}`
      const xSpread = 1 / (floor.nodes.length + 1)
      const x = xSpread + spec.col * xSpread + (rng() - 0.5) * 0.05
      const y = (fi + 0.5) / (FLOORS.length + 1)
      nodes.push({
        id,
        type: spec.type,
        zone: floor.zone,
        visited: false,
        connections: [],
        position: { x: Math.max(0.05, Math.min(0.95, x)), y },
      })
      col_nodes.push(id)
    })
    nodeGrid.push(col_nodes)
  })

  // Boss node
  const bossId = `n${idCounter++}`
  nodes.push({
    id: bossId,
    type: 'boss',
    zone: 'citadel',
    visited: false,
    connections: [],
    position: { x: 0.5, y: 0.9 },
  })

  // Connect floors: each node connects to 1-2 random nodes in the next floor
  nodeGrid.forEach((floor, fi) => {
    const nextFloor = nodeGrid[fi + 1] ?? [bossId]
    floor.forEach((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)!
      // Connect to 1-2 targets
      const targets = [...nextFloor].sort(() => rng() - 0.5).slice(0, Math.min(2, nextFloor.length))
      node.connections = targets
    })
  })

  return nodes
}
