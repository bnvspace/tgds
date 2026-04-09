# Conventions: Slot & Dungeons TMA

> Правила разработки для code-ассистента.
> Этот документ не спорит с `mechanics.md`, а помогает безопасно реализовывать его.

## Обязательные референсы

Перед любой работой — прочитать и соблюдать:

| Документ | Что регулирует |
|----------|---------------|
| [`mechanics.md`](mechanics.md) | Актуальный source of truth по игровому loop и математике боя |
| [`design-system.md`](design-system.md) | Подача автомата, tavern atmosphere, pixel UI, анимации и запреты |
| [`tasklist.md`](tasklist.md) | Текущий roadmap и порядок реализации |
| [`workflow.md`](workflow.md) | Правила согласования итераций |

**Приоритет:** `mechanics.md` > `design-system.md` > `tasklist.md` > текущее состояние кода.

---

## Структура проекта

```text
src/
  components/       # UI автомата: SlotMachine, SlotReel, EnemyDisplay, QTEBar...
  screens/          # экраны flow: Start, StartSymbols, Combat, Shop, WorldMap, Meta
  store/            # Zustand store для состояния рана и меты
  game/             # чистая игровая логика без React/store
    slotGenerator.ts
    resolution.ts
    symbols.ts
    synergies.ts
    enemies.ts
    worldMap.ts
  hooks/            # orchestration hooks уровня экрана
  types/            # TypeScript интерфейсы
  assets/           # пиксельные SVG / арты / иконки
  styles/           # CSS variables и глобальные pixel utility styles
  constants/        # баланс, тайминги, caps, конфиг UX
```

---

## TypeScript

- **Не** использовать `any`
- Все типы держать в `src/types/`
- Использовать `as const` для константных структур
- Держать строгий режим TypeScript
- Предпочитать `interface` для объектов данных

---

## React-компоненты

- Максимум **150 строк** на файл компонента
- Игровая логика не живет в React-компонентах
- Не использовать inline-styles
- Каждый компонент держать в отдельной папке с `index.tsx`
- Props типизировать через `interface`

---

## Игровая логика (`src/game/`)

- Только **чистые функции**
- Без React-хуков
- Без импорта Zustand store
- Входные данные → вычисление → результат
- Логику spin / stop / combat math / statuses / economy держать здесь или в typed orchestration-слое, а не в JSX
- Не хардкодить баланс, использовать `src/constants/`

---

## Zustand Store

- Один store = одна ответственность
- Изменения только через actions
- Не тянуть `getState()` в компоненты напрямую
- Store хранит состояние и переходы фаз, но не должен подменять `src/game/` как вычислительный слой

---

## Константы баланса

Все игровые цифры должны жить в `src/constants/`:

- caps
- урон
- HP
- шансовые веса
- цены магазина
- тайминги skill check
- assist windows

---

## Типы данных — ориентир

```ts
interface GameSymbol {
  id: string
  name: string
  rarity: 'common' | 'rare' | 'epic'
  tags: string[]
  effect: SymbolEffect
}

interface Reel {
  id: string
}

interface Player {
  hp: number
  maxHp: number
  armor: number
  reels: Reel[]
  symbolInventory: WeightedSymbol[]
  tokens: number
  bombCharge: number
}

type GamePhase =
  | 'meta_menu'
  | 'start_symbols'
  | 'world_map'
  | 'combat_start'
  | 'player_spin'
  | 'resolving'
  | 'enemy_action'
  | 'post_combat'
  | 'shop'
  | 'game_over'
  | 'run_complete'
```

---

## Именование

| Что | Стиль | Пример |
|-----|-------|--------|
| Компоненты | PascalCase | `SlotMachine`, `EnemyDisplay` |
| Хуки | camelCase + use | `useCombatFlow` |
| Store | camelCase | `gameStore`, `useGameStore` |
| Константы | UPPER_SNAKE | `MAX_REELS`, `MAX_TOKENS` |
| Типы | PascalCase | `Player`, `Enemy`, `GamePhase` |
| CSS-классы | camelCase | `slotReel`, `stopButton` |

---

## Запреты

- ❌ `any` в TypeScript
- ❌ Игровая логика внутри React-компонентов
- ❌ Inline-styles
- ❌ Монолитные компоненты > 150 строк
- ❌ Хардкод баланса в компонентах
- ❌ Импорты store напрямую в `src/game/`
- ❌ Auto-stop как игровая логика по умолчанию
- ❌ `initial shop` перед первым боем
- ❌ Возврат к dungeon-grid как core gameplay surface

---

## Git

```text
feat: итерация N — новая функциональность
fix: исправление
refactor: структурная переработка
docs: обновление документации
```

Коммит делается только после завершенной и подтвержденной итерации по `workflow.md`.

---

## Команды терминала

- Среда: Windows
- Для консольных команд использовать `cmd /c ...`
- Не зависать в интерактивных процессах
- Любая проверка должна запускаться и завершаться автоматически
