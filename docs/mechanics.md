# Game Mechanics: Slot & Daggers

> VERIFIED GAME DESIGN SPEC (based on real gameplay behaviour)
> STRICTLY FOLLOW. NO INVENTION.

---

## Core Concept

Slot machine = **combat engine**.

- Spin = action
- Symbols = abilities
- No paylines. No gambling. No dungeon grid.

Enemy always visible above reels.  
Game = **Slay the Spire × Slot Machine × Tactical Timing**

---

## Full Game Loop

```
INIT_RUN
  ↓
META_MODIFIERS_APPLY       ← applyModifiers(meta) → базовые статы игрока
  ↓
INITIAL_SYMBOL_SELECTION   ← 6–7 символов на выбор → попадают на барабаны
  ↓
GENERATE_WORLD_MAP
  ↓
SELECT_NODE
  ↓
COMBAT_START               ← инициализация Enemy
  ↓
PLAYER_SPIN_PHASE          ← барабаны + QTE (armor сбрасывается ЗДЕСЬ)
  ↓
SYMBOL_RESOLUTION          ← 7-шаговый pipeline
  ↓
ENEMY_ACTION               ← детерминированный паттерн
  ↓
TURN_END_CHECK

WIN  → POST_COMBAT_REWARD → SHOP → SELECT_NODE
LOSE → GAME_OVER
FINAL_BOSS_DEFEATED → RUN_COMPLETE → chips
```

---

## ⚠️ Критические правила (строго соблюдать)

| # | Правило |
|---|---------|
| 1 | У Player **НЕТ** поля `attack`. Урон — только из символов |
| 2 | Броня (`armor`) сбрасывается в начале **PLAYER_SPIN_PHASE**, не в начале боя |
| 3 | Паттерн атаки врага — детерминированный цикл, **не random** |
| 4 | Порядок разрешения символов (Resolution order) — критически важен |
| 5 | Синергии работают только внутри **одного спина**, не персистентны |

---

## Player Model

```typescript
interface Player {
  hp: number
  maxHp: number
  armor: number          // resets at start of PLAYER_SPIN_PHASE each turn
  reels: Reel[]
  relics: Relic[]
  tokens: number         // in-run currency
  metaModifiers: Modifier[]
}
// NO attack field. Damage comes ONLY from symbols.
```

---

## Enemy Model

```typescript
interface Enemy {
  hp: number
  maxHp: number
  patternIndex: number           // cycles deterministically
  attackPattern: AttackPattern[] // shown to player BEFORE spin
}
// DETERMINISTIC cycle. NOT random. This enables tactical decisions.
```

Паттерн атаки **показывается игроку до спина** → игрок принимает тактическое решение.

---

## Reels (Барабаны)

Каждый барабан — независимый взвешенный пул.

```typescript
interface Reel {
  symbolPool: Array<{ symbol: GameSymbol; weight: number }>
}

// Алгоритм спина (НЕ grid, НЕ paylines):
function spin(reels: Reel[]): GameSymbol[] {
  return reels.map(reel => weightedRandom(reel.symbolPool))
}
```

Результат спина = **массив символов**, по одному на барабан.  
Нет сетки. Нет позиций. Нет линий выплат.

---

## Symbol Resolution Order (7 шагов — не менять порядок!)

```
1. Collect symbols       ← собрать выпавшие символы
2. Apply base values     ← суммировать damage / armor / gold / heal
3. Apply synergies       ← тег-based комбо внутри текущего спина
4. Apply relic mods      ← пассивные бонусы от реликвий
5. Apply QTE multiplier  ← ТОЛЬКО к damage (не к armor/gold/heal)
6. Apply enemy resistance ← enemy resistances / debuffs
7. Apply effects         ← нанести урон, начислить броню, золото
```

**QTE модифицирует ТОЛЬКО damage.** Броня, золото и лечение — без множителя.

---

## QTE Multipliers

| Tier | Условие | M_qte |
|------|---------|-------|
| miss | промах | ×1.0 |
| hit | широкая зона | ×1.5 |
| crit | узкая зона | ×2.0 |
| mega | 3+ одинаковых тега + все QTE успешны | ×3.0 |

```
D_total = (Σ D_base · L_mod · S_syn · R_mod) · M_qte
                                                   ↑ применяется последним перед resistance
```

---

## Synergy System

**Синергии работают только внутри одного спина. Никогда не персистентны.**

Детекция по тегам, **не по ID символа**.

```typescript
// Пример:
{ requiredTags: ['explosive', 'diamond'], damageMultiplier: 2.0 }   // Bomb + Diamond
{ requiredTags: ['coin', 'coin', 'coin'], bonusTokens: 20 }          // 3× Coin
{ requiredTags: ['shield', 'shield'], armorBonus: 15 }               // Shield + Shield reinforce
```

---

## Symbols (базовый набор)

| Символ | Тег | Тип | Эффект | Rarity |
|--------|-----|-----|--------|--------|
| Dagger | `weapon` | damage | Физический урон | Common |
| Shield | `shield` | defense | +Броня | Common |
| Coin | `coin` | economy | +Tokens | Common |
| Energizer | `magic` | damage | Магический (игнорирует броню врага) | Rare |
| Bomb | `explosive` | damage | Большой урон, тригерит синергии | Epic |
| Diamond | `diamond` | special | Экономика + синергия с weapon | Epic |

**Уровни (1–3):** повышают базовый эффект при апгрейде.

---

## Shop System (POST_COMBAT_REWARD → SHOP)

После победы игрок получает:
1. **Tokens** — за убийство
2. **Symbol choice** — выбор 1 из N новых символов (добавляется в пул барабана)
3. **Relic chance** — шанс найти пассивный артефакт
4. **Heal node possibility** — шанс восстановить HP

В магазине (SHOP):
- Купить символ → добавить в пул барабана
- **Удалить символ** → уменьшить пул → выше вероятность нужных синергий
- Улучшить символ (Level Up): `symbol.level++`
- Купить реликвию

**Symbol removal = deck-thinning. Ключевой roguelite-механике.**

---

## Meta Progression

**Chips** начисляются после рана (победа или смерть).

В главном меню: трата на Modifier'ы.  
Перед раном: **бесплатный полный респек** (Refund All).

```
Modifiers влияют на:
  base hp
  reel count (3 → 4 → 5)
  symbol rarity weights

Modifiers НЕ влияют на пул символов напрямую.
```

| Modifier | chips | Эффект |
|----------|-------|--------|
| Physical Strength | 50 | +20% физического урона |
| Health Core | 25 | +базовый HP |
| Reel Slot | 100 | +1 барабан (до 5) |
| Token Collector | 40 | +токены от Coin-символов |

---

## World Map

Генерируется процедурно каждый ран. Без возврата (no backtracking).

Типы узлов: `combat` / `elite` / `shop` / `heal` / `boss`  
Зоны: Swamp → Sewer → Citadel (нарастающая сложность)

---

## Build Philosophy

**Build = evolving symbol pool.**

NOT: level, skill tree, класс.

Прогресс = добавление/удаление/апгрейд символов + реликвий.

---

## What the game does NOT have

- ❌ Paylines / slot bets / free spins
- ❌ Class selection
- ❌ `player.attack` stat
- ❌ Persistent armor (сбрасывается каждый ход)
- ❌ Random enemy attacks (все детерминированы)
- ❌ Multiplayer
- ❌ Casino roguelike mechanics
