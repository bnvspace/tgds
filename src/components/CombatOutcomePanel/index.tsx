import { symbolIconById } from '@/assets/pixelArt'
import GameIcon from '@/components/GameIcon'
import { useTranslation } from '@/i18n'
import type { SpinResult } from '@/types'
import styles from './CombatOutcomePanel.module.css'

interface CombatOutcomePanelProps {
  result: SpinResult | null
  placeholderCount: number
}

type SummaryTone = 'damage' | 'armor' | 'tokens' | 'heal'

interface SummaryCard {
  id: SummaryTone
  icon: string
  label: string
  value: string
  tone: SummaryTone
}

export default function CombatOutcomePanel({
  result,
  placeholderCount,
}: CombatOutcomePanelProps) {
  const { t, localizeSymbolName, localizeSynergyName } = useTranslation()
  const rolledSymbols = result?.rolledSymbols ?? []
  const slotCount = Math.max(placeholderCount, rolledSymbols.length, 3)

  const summaryCards: SummaryCard[] = [
    result && result.totalDamage > 0
      ? {
        id: 'damage',
        icon: symbolIconById.dagger,
        label: t('damage_short'),
        value: `${Math.round(result.totalDamage)}`,
        tone: 'damage',
      }
      : null,
    result && result.totalArmor > 0
      ? {
        id: 'armor',
        icon: symbolIconById.shield,
        label: t('armor_short'),
        value: `+${result.totalArmor}`,
        tone: 'armor',
      }
      : null,
    result && result.totalTokens > 0
      ? {
        id: 'tokens',
        icon: symbolIconById.coin,
        label: t('tokens_short'),
        value: `+${result.totalTokens}`,
        tone: 'tokens',
      }
      : null,
    result && result.totalHeal > 0
      ? {
        id: 'heal',
        icon: symbolIconById.health_potion,
        label: t('heal_short'),
        value: `+${result.totalHeal}`,
        tone: 'heal',
      }
      : null,
  ].filter((card): card is SummaryCard => card !== null)

  const accentChips = [
    result && result.qte.tier !== 'miss'
      ? {
        id: `qte-${result.qte.tier}`,
        tone: 'qte' as const,
        icon: symbolIconById.diamond,
        label: t(`qte_label_${result.qte.tier}`),
      }
      : null,
    ...(result?.synergiesActivated ?? []).map((synergy) => ({
      id: synergy.id,
      tone: 'synergy' as const,
      icon: symbolIconById.magic_scroll,
      label: localizeSynergyName(synergy),
    })),
  ].filter((chip): chip is { id: string; tone: 'qte' | 'synergy'; icon: string; label: string } => chip !== null)

  return (
    <section
      className={styles.panel}
      data-empty={result ? 'false' : 'true'}
      aria-label={t('last_spin')}
    >
      <div className={styles.topRow}>
        <span className={styles.title}>{t('last_spin')}</span>

        <div className={styles.accentChips} data-empty={accentChips.length === 0 ? 'true' : 'false'}>
          {accentChips.length > 0 ? (
            accentChips.map((chip) => (
              <span
                key={chip.id}
                className={styles.accentChip}
                data-tone={chip.tone}
              >
                <GameIcon
                  icon={chip.icon}
                  alt={chip.label}
                  decorative
                  className={styles.chipIcon}
                />
                {chip.label}
              </span>
            ))
          ) : (
            <span className={styles.accentPlaceholder} aria-hidden="true" />
          )}
        </div>
      </div>

      <div className={styles.rolledRow}>
        {Array.from({ length: slotCount }, (_, index) => {
          const symbol = rolledSymbols[index]

          return (
            <div
              key={symbol ? `${symbol.id}-${index}` : `placeholder-${index}`}
              className={styles.rollSlot}
              data-empty={symbol ? 'false' : 'true'}
              title={symbol ? localizeSymbolName(symbol) : undefined}
            >
              {symbol ? (
                <GameIcon
                  icon={symbol.icon}
                  alt={localizeSymbolName(symbol)}
                  className={styles.rollIcon}
                />
              ) : (
                <span className={styles.rollPlaceholder} aria-hidden="true" />
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.summaryGrid}>
        {(summaryCards.length > 0
          ? summaryCards
          : [
            {
              id: 'damage',
              icon: symbolIconById.dagger,
              label: t('damage_short'),
              value: '--',
              tone: 'damage' as const,
            },
            {
              id: 'armor',
              icon: symbolIconById.shield,
              label: t('armor_short'),
              value: '--',
              tone: 'armor' as const,
            },
            {
              id: 'tokens',
              icon: symbolIconById.coin,
              label: t('tokens_short'),
              value: '--',
              tone: 'tokens' as const,
            },
            {
              id: 'heal',
              icon: symbolIconById.health_potion,
              label: t('heal_short'),
              value: '--',
              tone: 'heal' as const,
            },
          ]).map((card) => (
            <div key={card.id} className={styles.summaryCard} data-tone={card.tone}>
              <GameIcon
                icon={card.icon}
                alt={card.label}
                decorative
                className={styles.summaryIcon}
              />
              <div className={styles.summaryCopy}>
                <span className={styles.summaryLabel}>{card.label}</span>
                <span className={styles.summaryValue} data-empty={result ? 'false' : 'true'}>
                  {card.value}
                </span>
              </div>
            </div>
          ))}
      </div>
    </section>
  )
}
