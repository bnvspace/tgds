# Tasklist: Gift's & Daggers

> Актуальный статус проекта. Этот файл отражает то, что реально есть в коде сейчас, а не старые промежуточные планы.

## Прогресс

| № | Этап | Статус |
|---|------|--------|
| 0 | Docs Rebaseline | ✅ Готово |
| 1 | Core Loop Rework: manual stop + старт из 3 символов | ✅ Готово |
| 2 | Combat Readability: Match-3 + Enemy Intents | ✅ Готово |
| 3 | Inventory Pool RNG: shared symbol pool + deck-thinning | ✅ Готово |
| 4 | Skill Checks: timed stop crit logic | ✅ Готово |
| 5 | Combat Math: armor / magic / poison / stun | ✅ Готово |
| 6 | Shop & Run Economy | ✅ Готово |
| 7 | Symbols & Builds: Bomb / Axe / Diamond / Sawblade | ✅ Готово |
| 8 | Meta Progression | ✅ Готово |
| 9 | Atmosphere & Game Feel | ✅ Готово |
| 10 | Endless Mode + Leaderboard | ✅ Готово |
| 11 | TMA Polish & Ops | 🔄 В работе |

## Что уже закрыто

- Manual-stop бой без автостопа
- Стартовый выбор ровно из 3 символов
- Shared inventory RNG для всех барабанов
- Match-3, боевые синергии и читаемые намерения врага
- Timed stop skill checks
- Armor / magic / poison / stun
- Магазин после боя, cap на монеты, удаление символов
- Bomb persistence, Axe, Diamond reroll, Sawblade force-perfect
- Meta-модификаторы: HP, damage reduction, extra life, reel unlocks, token collector, shop discount, refund all
- Аудио, хаптики, reward burst, shake, safe-area handling
- Endless arena, Egg of Karkul, лидерборд через `api/leaderboard.ts`
- Базовый test harness через `vitest` для `skillCheck`, `resolution`, `worldMap`
- Тесты на `preResolveModifiers` и scoring/leaderboard math
- Зелёные `npm run lint` и `npm run build`
- Зелёный `npm run test`
- Frontend runtime monitoring baseline через optional Sentry DSN и error boundary
- Lazy loading экранов и vendor chunk splitting без build warning про oversized main bundle

## Что осталось

### 11. TMA Polish & Ops

Уже сделано:

- [x] Haptic feedback для ключевых действий
- [x] Широкая нижняя кнопка `STOP`
- [x] Safe-area и fullscreen handling для Telegram WebApp
- [x] Runtime baseline: проект собирается и проходит lint
- [x] Базовый deploy shape под Vercel + серверный leaderboard endpoint
- [x] Frontend monitoring baseline через optional Sentry
- [x] Lazy loading экранов и разбиение vendor bundle для более лёгкой первой загрузки

Нужно закрыть:

- [ ] Расширить automated tests на store flow, combat orchestration и регрессии UI-логики
- [ ] Решить, нужен ли server-side monitoring для API routes отдельно от frontend Sentry
- [ ] Проверить one-hand UX manual stop на реальном Telegram mobile
- [ ] Заменить временные иконки для `Axe` и `Sawblade`
- [ ] Провести финальный smoke test после прод-деплоя

## Ближайший приоритет

1. Тесты на `resolution`, `skillCheck`, `worldMap`, `shop/meta` базовые сценарии
2. Runtime hygiene и мониторинг
3. Финальная мобильная валидация в Telegram
