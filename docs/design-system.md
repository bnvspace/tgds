# Design System: Slot & Dungeons

> Оригинальный визуальный стиль (MUC GAMES, 2025). Строго соблюдать. Пиксельный dark fantasy.

---

## Общий стиль

Ориентир: японский инди-пиксель-арт. Темнее чем Moonlighter/Luck Be a Landlord.  
Похоже на: Shiren the Wanderer, Moonlighter, Luck Be a Landlord.  
**border-radius: 0 везде без исключений.**

---

## Цветовая палитра

```css
/* Фоны */
--bg-primary: #0a0a0f;         /* главный фон */
--bg-surface: #12121e;         /* поверхности, карточки */
--bg-elevated: #1c1c2e;        /* панели, приподнятые элементы */
--bg-floor: #16140e;           /* клетки этажа */

/* Границы */
--border-default: #3d2b1f;     /* основная рамка */
--border-active: #c8a96e;      /* активная/выбранная — золото */
--border-panel: #2a2a3e;       /* рамка панелей */

/* Акценты */
--accent-gold: #c8a96e;
--accent-gold-bright: #f0d090;

/* Типы символов */
--symbol-spell: #9b72cf;
--symbol-spell-bg: #1e0e3a;
--symbol-item: #4caf6e;
--symbol-item-bg: #0e2a16;
--symbol-enemy: #e05252;
--symbol-enemy-bg: #2a0e0e;
--symbol-relic: #e8a030;
--symbol-relic-bg: #2a1a00;

/* HP / статусы */
--hp-fill: #e05252;
--hp-bg: #2a0e0e;
--xp-fill: #4caf6e;
--status-freeze: #60b8e8;
--status-poison: #9b72cf;
--status-burn: #e87830;
```

---

## Типографика

**Только два шрифта:**
1. **Press Start 2P** — ВСЕ заголовки, цифры, названия, кнопки
2. **System UI / sans-serif** — только длинные описания (тултипы, описания эффектов)

| Элемент | Размер |
|---------|--------|
| Заголовок экрана | 12px |
| Название символа | 8px |
| Цифры (HP, урон) | 8px |
| Кнопки | 8px |
| Маленький текст | 6px |

`letter-spacing: 0.05em` • `line-height: 1.8` для многострочного

---

## Сетка этажа (Floor Grid)

- Клетки: **48×48px** (scale через transform на маленьких экранах)
- Сетка: **7 столбцов** × N рядов (адаптивно)
- Пустая клетка: `background: #16140e`, `border: 1px solid #2a2010`, `border-radius: 0`
- С символом: цветная рамка 2px по типу
- С игроком: `border: 2px solid #c8a96e` + glow
- Доступная для хода: pulse-анимация рамки

### Иконки в ячейке:
- Размер: **32×32px** внутри 48×48px, flex-центрирование
- Фон ячейки: `var(--symbol-*-bg)` по типу

---

## Пиксельные рамки (обязательно)

```css
/* Стандартная панель */
.pixel-panel {
  border: 2px solid #3d2b1f;
  box-shadow:
    inset -2px -2px 0 #1a0e06,
    inset 2px 2px 0 #5a3d28,
    4px 4px 0 #000000;
  background: #12121e;
  border-radius: 0;
}

/* Золотая панель */
.pixel-panel--gold {
  border-color: #c8a96e;
  box-shadow:
    inset -2px -2px 0 #7a5a20,
    inset 2px 2px 0 #f0d090,
    4px 4px 0 #000000;
}
```

---

## Анимация слота — строго через CSS steps()

```css
@keyframes slot-spin {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-480px); }
}
.slot-reel { animation: slot-spin 0.6s steps(10) infinite; }
.slot-reel--stopping { animation: slot-stop 0.3s steps(5) forwards; }
```

Задержки остановки барабанов:
- Барабан 1: `0.8s`
- Барабан 2: `1.2s`
- Барабан 3: `1.6s`
- Барабан 4: `2.0s`
- Барабан 5: `2.4s`

После остановки: flash весей сетки (`opacity 0→1`, `0.2s`).

---

## Карточки символов

```css
.symbol-card {
  width: 48px; height: 48px;
  border: 2px solid var(--border-по-типу);
  background: var(--bg-по-типу);
  box-shadow: inset -1px -1px 0 rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.1);
  border-radius: 0;
  cursor: pointer;
}
.symbol-card:hover {
  border-color: #f0d090;
  box-shadow: inset -1px -1px 0 rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.1),
    0 0 8px rgba(200,169,110,0.4);
}
```

**Бейдж редкости** (правый верхний угол):
- `common` — нет бейджа
- `rare` — синяя точка 6px
- `epic` — фиолетовая точка + pulse-анимация

---

## HP Bar

```css
.hp-bar { height: 6px; background: #2a0e0e; border: 1px solid #3d1515; }
.hp-bar__fill {
  height: 100%; background: #e05252;
  box-shadow: inset 0 1px 0 rgba(255,120,120,0.4);
  transition: width 0.3s steps(6);
}
```

---

## Кнопки

```css
.btn-pixel {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px; color: #c8a96e;
  background: #1c1c2e; border: 2px solid #c8a96e;
  padding: 10px 16px; cursor: pointer;
  border-radius: 0; box-shadow: 3px 3px 0 #000;
  text-transform: uppercase; letter-spacing: 0.05em;
  transition: none;
}
.btn-pixel:hover { background: #2a2a3e; box-shadow: 3px 3px 0 #000, 0 0 10px rgba(200,169,110,0.3); }
.btn-pixel:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #000; }
```

---

## Числа урона

```css
@keyframes damage-float {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  50%  { opacity: 1; transform: translateY(-20px) scale(1.2); }
  100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
}
.damage-number {
  font-family: 'Press Start 2P', monospace; font-size: 10px;
  color: #fff; text-shadow: 1px 1px 0 #e05252, -1px -1px 0 #e05252;
  animation: damage-float 0.8s steps(8) forwards;
  pointer-events: none; position: absolute; z-index: 100;
}
.damage-number--critical { color: #f0d090; font-size: 14px; }
```

---

## Фоновый паттерн этажа

```css
.dungeon-bg {
  background-color: #0a0a0f;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 47px, #1a1a2a 47px, #1a1a2a 48px),
    repeating-linear-gradient(90deg, transparent, transparent 47px, #1a1a2a 47px, #1a1a2a 48px);
}
```

---

## Антипаттерны — строго запрещено

- ❌ `border-radius > 2px` где угодно
- ❌ Gradient-кнопки или ombre-эффекты
- ❌ `box-shadow` с blur > 12px (только резкие тени)
- ❌ `transition: all 0.3s ease` — только `steps()` или мгновенно
- ❌ Шрифты кроме Press Start 2P для UI-элементов
- ❌ Светлые фоны (#fff, #f0f0f0)
- ❌ Tailwind `rounded-lg`, `shadow-lg` — заменять на `.pixel-panel`
- ❌ Иконки из lucide/heroicons — только emoji или пиксельные SVG
