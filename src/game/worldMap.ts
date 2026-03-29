import type { MapNode, ZoneType, NodeType } from '@/types'

function seededRng(seed: number) {
  let state = seed

  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff
    return (state >>> 0) / 4294967296
  }
}

function randomItem<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)]
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

const ZONE_TYPES: ZoneType[] = ['swamp', 'sewer', 'citadel']

interface FloorSpec {
  zone: ZoneType
  nodes: Array<{ type: NodeType; col: number }>
}

function getFloorSpec(floorIndex: number, rng: () => number): FloorSpec {
  const zone = ZONE_TYPES[floorIndex % ZONE_TYPES.length]
  const nodeCount = 3 + (floorIndex > 0 ? 1 : 0)
  const nodes: Array<{ type: NodeType; col: number }> = [{ type: 'combat', col: 0 }]
  const possibleTypes: NodeType[] = ['combat', 'combat', 'shop', 'elite', 'heal']

  for (let col = 1; col < nodeCount; col += 1) {
    nodes.push({
      type: possibleTypes[Math.floor(rng() * possibleTypes.length)],
      col,
    })
  }

  return { zone, nodes }
}

function connectFloors(
  nodeMap: Map<string, MapNode>,
  currentFloor: string[],
  nextFloor: string[],
  rng: () => number,
) {
  const outgoing = new Map<string, Set<string>>(
    currentFloor.map((nodeId) => [nodeId, new Set<string>()]),
  )

  for (const targetId of shuffle(nextFloor, rng)) {
    outgoing.get(randomItem(currentFloor, rng))?.add(targetId)
  }

  for (const sourceId of currentFloor) {
    const links = outgoing.get(sourceId)
    if (!links) {
      continue
    }

    if (links.size === 0) {
      links.add(randomItem(nextFloor, rng))
    }

    const availableTargets = shuffle(
      nextFloor.filter((targetId) => !links.has(targetId)),
      rng,
    )
    const wantsExtraLink = nextFloor.length > 1 && rng() > 0.45

    if (wantsExtraLink && availableTargets.length > 0) {
      links.add(availableTargets[0])
    }

    nodeMap.get(sourceId)!.connections = Array.from(links)
  }
}

function isMapFullyConnected(nodes: MapNode[]): boolean {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const incoming = new Map(nodes.map((node) => [node.id, 0]))

  for (const node of nodes) {
    for (const targetId of node.connections) {
      incoming.set(targetId, (incoming.get(targetId) ?? 0) + 1)
    }
  }

  const startNodes = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0)
  const seen = new Set(startNodes.map((node) => node.id))
  const queue = startNodes.map((node) => node.id)

  while (queue.length > 0) {
    const currentId = queue.shift()
    const currentNode = currentId ? byId.get(currentId) : null

    if (!currentNode) {
      continue
    }

    for (const nextId of currentNode.connections) {
      if (!seen.has(nextId)) {
        seen.add(nextId)
        queue.push(nextId)
      }
    }
  }

  return nodes.every((node) => {
    const hasIncoming = (incoming.get(node.id) ?? 0) > 0
    const isFirstFloor = node.position.y <= 0.2
    const hasOutgoing = node.type === 'boss' || node.connections.length > 0

    return hasOutgoing && (isFirstFloor || hasIncoming) && seen.has(node.id)
  })
}

function buildWorldMap(seed: number): MapNode[] {
  const rng = seededRng(seed)
  const nodes: MapNode[] = []
  const nodeMap = new Map<string, MapNode>()
  const nodeGrid: string[][] = []
  let idCounter = 0

  for (let floorIndex = 0; floorIndex < 3; floorIndex += 1) {
    const floor = getFloorSpec(floorIndex, rng)
    const floorIds: string[] = []

    floor.nodes.forEach((spec) => {
      const id = `n${idCounter++}`
      const xSpread = 1 / (floor.nodes.length + 1)
      const x = xSpread + spec.col * xSpread + (rng() - 0.5) * 0.05
      const node: MapNode = {
        id,
        type: spec.type,
        zone: floor.zone,
        visited: false,
        connections: [],
        position: {
          x: Math.max(0.05, Math.min(0.95, x)),
          y: (floorIndex + 0.5) / 4,
        },
      }

      nodes.push(node)
      nodeMap.set(id, node)
      floorIds.push(id)
    })

    nodeGrid.push(floorIds)
  }

  const bossId = `n${idCounter++}`
  const bossNode: MapNode = {
    id: bossId,
    type: 'boss',
    zone: 'citadel',
    visited: false,
    connections: [],
    position: { x: 0.5, y: 0.9 },
  }

  nodes.push(bossNode)
  nodeMap.set(bossId, bossNode)

  nodeGrid.forEach((floor, floorIndex) => {
    const nextFloor = nodeGrid[floorIndex + 1] ?? [bossId]
    connectFloors(nodeMap, floor, nextFloor, rng)
  })

  return nodes
}

export function generateWorldMap(seed = Date.now()): MapNode[] {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const map = buildWorldMap(seed + attempt * 7919)
    if (isMapFullyConnected(map)) {
      return map
    }
  }

  return buildWorldMap(seed)
}
