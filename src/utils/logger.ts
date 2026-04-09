const isDev = import.meta.env.DEV

export const gameLog = {
  spin: (count: number) =>
    isDev && console.log('[SPIN] symbols placed:', count),
  move: (row: number, col: number) =>
    isDev && console.log(`[MOVE] → (${row}, ${col})`),
  combat: (attacker: string, damage: number) =>
    isDev && console.log(`[COMBAT] ${attacker} hits for ${damage}`),
  floor: (floor: number) =>
    isDev && console.log(`[FLOOR] entering floor ${floor}`),
  upgrade: (symbolId: string) =>
    isDev && console.log('[UPGRADE] picked:', symbolId),
  gameOver: (floor: number, hp: number) =>
    isDev && console.log('[GAME OVER]', { floor, hp }),
  victory: (floor: number) =>
    isDev && console.log('[VICTORY] cleared floor', floor),
}
