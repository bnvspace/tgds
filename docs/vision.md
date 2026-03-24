# Vision: Slot & Dungeons TMA

> Техническое видение проекта на основе `idea.md`

---

## 1. Технологии

| Слой          | Технология                          | Версия | Назначение                        |
|---------------|-------------------------------------|--------|-----------------------------------|
| Frontend      | React + TypeScript                  | 19 / 5.9 | UI-компоненты                  |
| Сборка        | Vite                                | 7      | Dev-сервер, бандлинг              |
| Стейт         | Zustand                             | 5      | Глобальный стейт игры             |
| Стили         | Tailwind CSS + CSS-модули           | 4      | Утилиты + пиксельные элементы     |
| Анимации      | Framer Motion                       | 12     | Переходы экранов, shake-эффекты   |
| 2D-графика    | PixiJS                              | 8      | Спрайты, анимация слота (опц.)    |
| TMA SDK       | @twa-dev/sdk                        | 8      | Haptic, MainButton, WebApp API    |
| Роутинг       | react-router-dom                    | 7      | Навигация между экранами          |
| Мониторинг    | Sentry                              | latest | Трекинг ошибок в проде            |
| Тесты         | Vitest + Testing Library            | latest | Unit-тесты игровой логики         |
| Хранилище     | localStorage                        | —      | Сохранение прогресса рана         |
| Звук          | Howler.js                           | —      | **Опционально, вне MVP**          |
| Бэкенд        | —                                   | —      | **Отсутствует в MVP**             |

---

## 2. Принципы разработки

- **KISS** — простейшее решение, которое работает
- **YAGNI** — не писать то, что не нужно сейчас
- **MVP-first** — запустить минимальный играбельный продукт
- **Итеративность** — каждая итерация = играбельный результат
- **Разделение ответственности** — игровая логика строго отделена от React

---

## 3. Структура проекта

```
tgds/
├── src/
│   ├── components/       # React-компоненты
│   │   ├── SlotMachine/
│   │   ├── DungeonGrid/
│   │   ├── CharacterCard/
│   │   ├── CombatScreen/
│   │   └── UpgradeScreen/
│   ├── store/            # Zustand-сторы
│   │   ├── gameStore.ts
│   │   ├── characterStore.ts
│   │   └── symbolStore.ts
│   ├── game/             # Чистая игровая логика (без React)
│   │   ├── engine.ts     # Спин слота, размещение, бой
│   │   ├── symbols.ts    # Данные всех символов
│   │   ├── characters.ts # Данные персонажей
│   │   └── dungeon.ts    # Генерация этажей
│   ├── types/            # TypeScript интерфейсы
│   ├── hooks/            # Кастомные хуки
│   │   ├── useGame.ts
│   │   ├── useSlot.ts
│   │   └── useCombat.ts
│   ├── assets/           # Спрайты, иконки
│   ├── styles/           # Глобальные CSS-переменные, шрифты
│   └── constants/        # Константы баланса
├── doc/
│   ├── tasklist.md
│   └── workflow.md
├── idea.md
├── vision.md
└── conventions.md
```

---

## 4. Архитектура

```
┌─────────────────────────────────────────┐
│              React UI Layer             │
│  (components/, hooks/, store/)          │
└────────────────┬────────────────────────┘
                 │ dispatch actions
┌────────────────▼────────────────────────┐
│           Zustand Store                 │
│  gameStore / characterStore / symbolStore│
└────────────────┬────────────────────────┘
                 │ calls pure functions
┌────────────────▼────────────────────────┐
│         Game Engine (src/game/)         │
│  engine.ts / dungeon.ts / symbols.ts    │
│  (чистые функции, без React)            │
└────────────────┬────────────────────────┘
                 │ persist
┌────────────────▼────────────────────────┐
│            localStorage                 │
└─────────────────────────────────────────┘
```

**Поток данных:** UI → Store → Engine → Store → UI (однонаправленный)

---

## 5. Модель данных

### Symbol
```typescript
interface Symbol {
  id: string
  type: 'spell' | 'item' | 'enemy'
  name: string
  icon: string              // emoji или путь к спрайту
  rarity: 'common' | 'rare' | 'epic'
  effect: SymbolEffect
}

interface SymbolEffect {
  damage?: number           // урон (spell/enemy)
  heal?: number             // лечение (item/spell)
  attackBonus?: number      // бонус атаки (item)
  aoe?: boolean             // урон всем врагам (spell)
  freeze?: boolean          // заморозка (spell)
}
```

### Character
```typescript
interface Character {
  id: string
  name: string
  icon: string
  maxHp: number
  baseAttack: number
  skill: CharacterSkill     // уникальный скилл
  bonusType: 'physical' | 'spell' | 'speed'
}

interface CharacterSkill {
  name: string
  description: string
  effect: SkillEffect
  cooldown: number          // в ходах
}
```

### GameState
```typescript
interface GameState {
  phase: 'character_select' | 'spinning' | 'floor' | 'combat' | 'upgrade' | 'game_over' | 'victory'
  currentFloor: number      // 1–5
  player: PlayerState
  grid: GridCell[][]        // 5×5 сетка этажа
  symbols: Symbol[]         // Колода игрока
  activeEnemies: Enemy[]
}

interface PlayerState {
  character: Character
  hp: number
  maxHp: number
  attack: number
  position: { row: number; col: number }
  inventory: Symbol[]       // подобранные предметы за ран
  relics: Relic[]           // пассивные бонусы
  xp: number
}

interface GridCell {
  row: number
  col: number
  symbol: Symbol | null
  visited: boolean
}

interface Enemy {
  symbolId: string
  name: string
  hp: number
  maxHp: number
  attack: number
  position: { row: number; col: number }
}
```

### Relic (с Итерации 8)
```typescript
interface Relic {
  id: string
  name: string
  description: string
  passiveEffect: PassiveEffect
}
```

---

## 6. Игровые механики

### Алгоритм слота (engine.ts)
```
1. Взять колоду символов игрока (symbols[])
2. Shuffle колоду (Fisher-Yates)
3. Взять первые 25 символов (5×5 = 25 клеток)
4. Если колода < 25 — повторить с начала (цикличная колода)
5. Разместить символы на сетке GridCell[][]
6. Анимация: барабаны крутятся → останавливаются по колонкам (шаг 200ms)
```

### Боевая система
```
1. Игрок наступает на клетку с Enemy
2. Инициируется пошаговый бой (phase: 'combat')
3. Ход игрока:
   - Базовая атака (damage = player.attack)
   - Скилл персонажа (cooldown-based)
4. Ход врага: enemy.attack → player.hp -= damage
5. Победа: enemy.hp <= 0 → враг пропадает, +XP
6. Поражение: player.hp <= 0 → phase: 'game_over'
```

### Прогрессия
```
После очистки этажа:
  → phase: 'upgrade'
  → Показать 3 случайных символа (взвешенные по rarity)
  → Игрок выбирает 1 → добавляется в колоду
  → Следующий этаж: HP врагов × 1.2 за каждый этаж
  → Этаж 5: Босс (HP × 3, уникальные атаки)
```

### Веса редкостей
| Rarity | Вес | Шанс |
|--------|-----|------|
| common | 60  | 60%  |
| rare   | 30  | 30%  |
| epic   | 10  | 10%  |

---

## 7. UI/UX система

### Цветовая палитра (CSS-переменные)
```css
:root {
  --color-bg: #0d0d0f;        /* почти чёрный */
  --color-surface: #1a1a2e;   /* тёмно-синий */
  --color-border: #4a3728;    /* коричневый */
  --color-accent: #c8a96e;    /* золотой */
  --color-danger: #c0392b;    /* красный */
  --color-spell: #7b68ee;     /* фиолетовый */
  --color-item: #27ae60;      /* зелёный */
  --color-enemy: #e74c3c;     /* красный */
  --color-text: #e8d5b7;      /* пергамент */
  --color-text-muted: #666;
}
```

### Шрифты
- **Press Start 2P** (Google Fonts) — заголовки, UI, HP-бары, числа
- **System font** — мелкий текст, описания (где Press Start 2P нечитаем мелко)

### Компоненты
| Компонент      | Описание                                  |
|----------------|-------------------------------------------|
| SlotMachine    | 5 барабанов с анимацией steps()           |
| DungeonGrid    | 5×5 сетка с символами                    |
| CharacterCard  | Карточка выбора персонажа                 |
| CombatScreen   | Экран боя с HP-барами                     |
| UpgradeScreen  | Выбор 1 из 3 символов                    |
| PixelButton    | Кнопка в пиксельном стиле                |
| HPBar          | Полоска HP с пиксельным стилем            |

### Размеры и анимации
- Размер ячейки сетки: **48×48px**
- Анимация слота: `CSS keyframes` + `animation-timing-function: steps(8)`
- Shake-эффект при ударе: `keyframes shake` (3 итерации, 100ms)
- Переходы экранов: Framer Motion `AnimatePresence`

---

## 8. Сценарии игры

```
[Главное меню]
  → Кнопка "Играть"
  
[Выбор персонажа]
  → Warrior / Mage / Rogue
  → "Начать"
  
[Этаж 1: Спин]
  → Анимация слота → сетка заполнена символами
  → Игрок в центре нижнего ряда
  
[Передвижение по сетке]
  → Тап на соседнюю клетку
  → Item: +HP / +атака (анимация подбора)
  → Spell: эффект срабатывает (урон, заморозка)
  → Enemy: переход в Combat
  
[Бой]
  → Ход игрока → ход врага → ...
  → Победа: +XP, враг исчезает
  → Поражение: Game Over экран
  
[Очистка этажа]
  → Upgrade экран: выбор символа в колоду
  → Переход на следующий этаж (Спин)
  
[Этаж 5: Босс]
  → Усиленный враг → победа → Victory экран
  
[Game Over / Victory]
  → Счёт, статистика, кнопка "Играть снова"
```

---

## 9. Деплой

### Telegram Mini App
```
1. Создать бота через @BotFather
2. /newapp → указать URL задеплоенного приложения
3. Приложение доступно через встроенный браузер Telegram
```

### Хостинг (выбрать один)
| Платформа | Команда деплоя            | Бесплатный план |
|-----------|---------------------------|-----------------|
| Vercel    | `vercel deploy`           | ✅ Да           |
| Netlify   | `netlify deploy --prod`   | ✅ Да           |
| GitHub Pages | `vite build` + gh-pages | ✅ Да          |

### HTTPS обязателен (Telegram требует)

```bash
# Сборка
npm run build

# Превью локально
npm run preview

# Ngrok для локального тестирования в TG
ngrok http 5173
```

---

## 10. Конфигурация

```typescript
// src/constants/config.ts
export const CONFIG = {
  GRID_SIZE: 5,           // 5×5 сетка
  TOTAL_FLOORS: 5,
  ENEMY_HP_SCALE: 1.2,    // +20% HP за этаж
  BOSS_HP_MULTIPLIER: 3,
  UPGRADE_CHOICES: 3,     // выбор из N символов
  SPIN_DELAY_MS: 200,     // задержка между колонками
  RARITY_WEIGHTS: {
    common: 60,
    rare: 30,
    epic: 10,
  },
} as const
```

---

## 11. Логирование

### Игровые события (dev-режим)
```typescript
// src/utils/logger.ts
const isDev = import.meta.env.DEV

export const gameLog = {
  spin: (symbols: Symbol[]) => isDev && console.log('[SPIN]', symbols),
  combat: (attacker: string, damage: number) => isDev && console.log('[COMBAT]', attacker, damage),
  floor: (floor: number) => isDev && console.log('[FLOOR]', floor),
  upgrade: (symbol: Symbol) => isDev && console.log('[UPGRADE]', symbol),
  gameOver: (floor: number, hp: number) => isDev && console.log('[GAME OVER]', { floor, hp }),
}
```

### Sentry (продакшн)
```typescript
// main.tsx
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
})
```

### Аналитика (опционально, вне MVP)
- Telegram WebApp `sendData()` для серверной аналитики
- Либо простой `fetch` к аналитическому эндпоинту
