# Design System: Slot & Dungeons

> Визуальный ориентир для original-faithful прототипа.
> Игра должна ощущаться как старый аркадный автомат в подпольной таверне, а не как абстрактный UI-дашборд.

---

## Общий стиль

Ориентир:

- темный pixel-art fantasy
- аркадный автомат из дерева, латуни и потертых панелей
- стол таверны, карты, окурки, шум толпы за кадром
- интерфейс встроен в корпус автомата

Ближайшая ассоциация:

- old arcade cabinet
- tavern table prop
- heavy pixel UI

**`border-radius: 0` везде.**

---

## Ключевой визуальный тезис

Игрок не должен смотреть на “просто меню”.

Он должен смотреть на:

- дисплей автомата
- барабаны
- вражескую панель над ними
- кнопку `STOP` внизу
- кошелек и pile of coins сбоку

---

## Цветовая палитра

```css
/* Базовые фоны */
--bg-room: #0a0a0f;
--bg-cabinet: #141119;
--bg-screen: #1a1620;
--bg-panel: #241d18;
--bg-wood: #3b2416;
--bg-felt: #1e2416;

/* Металл / рамки */
--border-default: #3d2b1f;
--border-brass: #b78a46;
--border-bright: #f0d090;
--shadow-hard: #000000;

/* Акценты */
--accent-gold: #c8a96e;
--accent-coin: #d9b44a;
--accent-chip: #59b86d;
--accent-danger: #d85858;
--accent-magic: #7f6ad8;

/* Статусы */
--status-poison: #8a5fd1;
--status-stun: #f0d090;
--status-freeze: #60b8e8;
--status-heal: #5ec97f;
```

---

## Типографика

Разрешены только:

1. `Press Start 2P` для заголовков, цифр, кнопок, стейтов, лейблов
2. `system-ui, sans-serif` для длинных описаний

| Элемент | Размер |
|---------|--------|
| Заголовок экрана | 12px |
| Название символа | 8px |
| Цифры HP / Armor / Coins | 8px |
| Кнопки | 8px |
| Микротекст | 6px |

---

## Компоновка экрана боя

Композиция должна быть такой:

1. Верх: враг, его HP, intent, статусы
2. Центр: окно автомата с барабанами
3. Слева или рядом с барабанами: wallet / pile of coins
4. Низ: большая `STOP`-кнопка под палец

### Обязательные UX-правила

- кнопка `STOP` визуально доминирует над второстепенными действиями
- на мобильном она должна быть широкой и низко посаженной
- stop chain должен считываться без объяснений

---

## Пиксельные панели

```css
.pixel-panel {
  border: 2px solid var(--border-default);
  background: var(--bg-screen);
  box-shadow:
    inset -2px -2px 0 #110c08,
    inset 2px 2px 0 #5a3d28,
    4px 4px 0 var(--shadow-hard);
  border-radius: 0;
}

.pixel-panel--brass {
  border-color: var(--border-brass);
  box-shadow:
    inset -2px -2px 0 #6d4d1a,
    inset 2px 2px 0 var(--border-bright),
    4px 4px 0 var(--shadow-hard);
}
```

---

## Барабаны и анимация

Анимация слота остается пиксельной и через `steps()`, но логика остановки только ручная.

```css
@keyframes slot-spin {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-480px); }
}

.slot-reel {
  animation: slot-spin 0.6s steps(10) infinite;
}

.slot-reel--stopping {
  animation: slot-stop 0.18s steps(4) forwards;
}
```

### Важно

- нельзя проектировать интерфейс, который подразумевает автостоп
- вспышка и звук должны происходить на каждом ручном stop
- последний stop должен ощущаться тяжелее и значимее первых

---

## Кнопка STOP

`STOP` — главный тактильный элемент интерфейса.

```css
.stopButton {
  min-height: 56px;
  width: 100%;
  border: 2px solid var(--border-brass);
  background: #3b1717;
  color: #f4d7b0;
  box-shadow:
    inset -2px -2px 0 #240909,
    inset 2px 2px 0 #7a3131,
    4px 4px 0 var(--shadow-hard);
  text-transform: uppercase;
  font-family: 'Press Start 2P', monospace;
}
```

Правила:

- большая зона нажатия
- не прятать в тулбар
- не заменять маленькой secondary-кнопкой
- можно усиливать hover/press через hard-shadow shift, но не через blur

---

## Карточки символов

Карточки остаются компактными и пиксельными.

```css
.symbol-card {
  width: 48px;
  height: 48px;
  border: 2px solid var(--border-default);
  background: var(--bg-panel);
  box-shadow:
    inset -1px -1px 0 rgba(0, 0, 0, 0.5),
    inset 1px 1px 0 rgba(255, 255, 255, 0.08);
  border-radius: 0;
}
```

Редкость:

- `common` = без сияния
- `rare` = точка / небольшой цветовой маркер
- `epic` = пульсирующий маркер, но без soft neon

---

## HP / Armor / Coins

Статы должны выглядеть как элементы автомата, а не как чистый HUD.

### HP Bar

```css
.hpBar {
  height: 6px;
  background: #2a0e0e;
  border: 1px solid #3d1515;
}

.hpBarFill {
  height: 100%;
  background: var(--accent-danger);
  transition: width 0.25s steps(6);
}
```

### Coin Wallet

Монеты отображаются:

- числом
- кучкой/стеком/пачкой слева от барабанов

Размер pile должен меняться визуально при росте кошелька.

---

## Reward Juice

После победы награды не должны “просто начисляться”.

Нужно проектировать:

- выстрел монет из левого лотка автомата
- отдельный вылет green chips снизу
- жесткие bounce-анимации
- короткие металлические clink-звуки

---

## Аудиовизуальный фон

Обязательные направления:

- тихий background crowd murmur
- cheering на сильных комбо, crit и boss kill
- crispy reel clicks
- отдельный тяжелый sound на финальный stop
- ретро “плинь” на монеты и редкие награды

---

## Shop Presentation

Магазин должен ощущаться как часть автомата и стола, а не как detached modal.

Допустимо:

- выдвижная панель
- shop tray
- cabinet drawer feel

Недопустимо:

- абстрактный белый popup
- SaaS-карточки без материальности

---

## Антипаттерны

- ❌ auto-stop как визуально подразумеваемый UX
- ❌ dungeon grid / floor tiles как главный экран игры
- ❌ clean sci-fi interface
- ❌ мягкие modern rounded cards
- ❌ `border-radius > 2px`
- ❌ gradients и glassmorphism
- ❌ blur-heavy shadows
- ❌ светлые фоны
- ❌ generic mobile game polish без ощущения старого автомата
