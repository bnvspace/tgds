import { describe, expect, it } from 'vitest'
import { generateWorldMap } from '@/game/worldMap'
import type { MapNode } from '@/types'

function getReachableNodeIds(nodes: MapNode[]) {
  const incoming = new Map(nodes.map((node) => [node.id, 0]))

  for (const node of nodes) {
    for (const targetId of node.connections) {
      incoming.set(targetId, (incoming.get(targetId) ?? 0) + 1)
    }
  }

  const queue = nodes
    .filter((node) => (incoming.get(node.id) ?? 0) === 0)
    .map((node) => node.id)
  const seen = new Set(queue)
  const byId = new Map(nodes.map((node) => [node.id, node]))

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

  return seen
}

describe('generateWorldMap', () => {
  it('builds a fully reachable campaign map with a citadel boss', () => {
    const map = generateWorldMap(12345)
    const reachable = getReachableNodeIds(map)
    const bossNode = map.find((node) => node.type === 'boss')

    expect(map).toHaveLength(12)
    expect(bossNode?.zone).toBe('citadel')
    expect(reachable.size).toBe(map.length)
    expect(map.every((node) => node.type === 'boss' || node.connections.length > 0)).toBe(true)
  })

  it('keeps endless arena maps inside the arena zone', () => {
    const map = generateWorldMap(54321, true)
    const bossNode = map.find((node) => node.type === 'boss')

    expect(map.every((node) => node.zone === 'arena')).toBe(true)
    expect(bossNode?.zone).toBe('arena')
  })
})
