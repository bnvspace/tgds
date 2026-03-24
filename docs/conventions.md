# Conventions: Slot & Dungeons TMA

> Правила разработки для code-ассистента. Дополняют `vision.md`, не дублируют его.

## ⚠️ Обязательные референсы

Перед любой работой — прочитать и строго соблюдать:

| Документ | Что регулирует |
|----------|---------------|
| [`mechanics.md`](mechanics.md) | Игровые механики оригинала. Не изобретать — только реализовывать по нему |
| [`design-system.md`](design-system.md) | Визуальный стиль: палитра, CSS, анимации, запреты |

**Приоритет:** `mechanics.md` и `design-system.md` > всё остальное.

---

## Структура проекта

```
src/
  components/       # React-компоненты (SlotMachine, DungeonGrid, CharacterCard...)
  store/            # Zustand-сторы (gameStore, characterStore, symbolStore)
  game/             # Чистая игровая логика (без React)
    engine.ts       # Основной движок: спин слота, размещение символов, бой
    symbols.ts      # Данные всех символов
    characters.ts   # Данные персонажей
    dungeon.ts      # Генерация этажей
  types/            # TypeScript интерфейсы
  hooks/            # Кастомные хуки (useGame, useSlot, useCombat)
  assets/           # Спрайты, иконки (пиксель-арт)
  styles/           # Глобальные CSS-переменные, pixel-шрифты
  constants/        # Константы баланса (урон, HP, шансы выпадения)
```

---

## TypeScript

- **НЕ** использовать `any` — использовать `unknown` + type guard или конкретные типы
- Все типы — в `src/types/`, экспортировать именованно
- `as const` для всех константных объектов и массивов
- Строгий режим (`"strict": true` в tsconfig)
- Предпочитать `interface` над `type` для объектов данных; `type` — для union/intersection

---

## React-компоненты

- Максимум **150 строк** на файл компонента
- **НЕ** смешивать игровую логику с компонентами — только вызовы хуков и store
- **НЕ** использовать inline-styles — только CSS-модули или Tailwind-классы
- Каждый компонент — в отдельной папке с `index.tsx` (и `.module.css` при необходимости)
- Props типизировать через `interface ComponentNameProps`

```
components/
  SlotMachine/
    index.tsx
    SlotMachine.module.css
  DungeonGrid/
    index.tsx
    DungeonGrid.module.css
```

---

## Игровая логика (src/game/)

- Только **чистые функции** — никаких React-хуков, никакого store
- Входные данные → вычисление → возвращаемый результат
- Функции должны быть тестируемы через Vitest без рендера компонентов
- **НЕ** хардкодить числа — только через `src/constants/`

```typescript
// ✅ Правильно
import { COMBAT } from '@/constants/balance'
export function calcDamage(attack: number, defense: number): number {
  return Math.max(COMBAT.MIN_DAMAGE, attack - defense)
}

// ❌ Неправильно
export function calcDamage(attack: number, defense: number): number {
  return Math.max(1, attack - defense) // хардкод!
}
```

---

## Zustand Store

- Один store = одна ответственность (game / character / symbol)
- Мутации только через actions, определённые в store
- **НЕ** вызывать `getState()` напрямую в компонентах — только через хуки-селекторы

```typescript
// ✅ Правильно
const hp = useGameStore((s) => s.player.hp)

// ❌ Неправильно
const { player } = useGameStore() // лишние ре-рендеры
```

---

## Константы баланса

Все игровые цифры — в `src/constants/`:

```
constants/
  balance.ts    # HP, урон, XP
  config.ts     # размер сетки, этажи, задержки
  rarity.ts     # веса редкостей
```

**НЕ** менять баланс внутри компонентов или game-функций напрямую.

---

## Дизайн-система (Dark Fantasy Pixel)

### CSS-переменные (src/styles/variables.css)

```css
:root {
  --color-bg: #0d0d0f;
  --color-surface: #1a1a2e;
  --color-border: #4a3728;
  --color-accent: #c8a96e;
  --color-danger: #c0392b;
  --color-spell: #7b68ee;
  --color-item: #27ae60;
  --color-enemy: #e74c3c;
  --color-text: #e8d5b7;
  --color-text-muted: #666666;
}
```

### Шрифт

- **Press Start 2P** (Google Fonts) — заголовки, числа, UI-элементы
- Подключается в `index.html` через `<link>`, не через JavaScript

### Размеры

- Ячейка сетки: `48×48px`
- Анимация слота: `steps(8)` в CSS keyframes
- Shake: `@keyframes shake`, duration `100ms`, 3 итерации

---

## Типы данных — строго соблюдать

```typescript
interface Symbol {
  id: string
  type: 'spell' | 'item' | 'enemy'
  name: string
  icon: string        // emoji или путь к спрайту
  rarity: 'common' | 'rare' | 'epic'
  effect: SymbolEffect
}

interface GameState {
  phase: 'character_select' | 'spinning' | 'floor' | 'combat' | 'upgrade' | 'game_over' | 'victory'
  currentFloor: number
  player: PlayerState
  grid: GridCell[][]  // 5×5 сетка этажа
  symbols: Symbol[]   // Колода игрока
  activeEnemies: Enemy[]
}
```

---

## Именование

| Что               | Стиль           | Пример                    |
|-------------------|-----------------|---------------------------|
| Компоненты        | PascalCase      | `SlotMachine`, `HPBar`    |
| Файлы компонентов | PascalCase      | `SlotMachine.tsx`         |
| Хуки              | camelCase + use | `useGame`, `useCombat`    |
| Store             | camelCase       | `gameStore`, `useGameStore` |
| Константы         | UPPER_SNAKE     | `MAX_HP`, `GRID_SIZE`     |
| Типы/интерфейсы   | PascalCase      | `GameState`, `Symbol`     |
| CSS-классы        | camelCase (модули) | `slotReel`, `gridCell` |

---

## Запреты

- ❌ `any` в TypeScript
- ❌ Игровая логика внутри React-компонентов
- ❌ Inline-styles (`style={{ color: 'red' }}`)
- ❌ Монолитные компоненты > 150 строк
- ❌ Хардкод баланса в компонентах
- ❌ `console.log` в продакшн-коде (только через `logger.ts` с проверкой `isDev`)
- ❌ Импорты store напрямую в `src/game/` (только чистые функции)

---

## Git

```
feat: итерация N — [описание что сделано]
fix: [что исправлено]
refactor: [что переработано]
docs: [обновление документации]
```

Коммит после каждой завершённой итерации согласно `doc/workflow.md`.
