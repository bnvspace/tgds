import { useEffect, useState } from 'react'
import type { TimingTier } from '@/types'
import { TIMING } from '@/constants'
import { useTranslation } from '@/i18n'
import styles from './TimingFeedback.module.css'

interface TimingFeedbackProps {
  tier: TimingTier | null
  sessionKey: number // increment to re-trigger animation
}

export default function TimingFeedback({ tier, sessionKey }: TimingFeedbackProps) {
  const [visible, setVisible] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    if (!tier || tier === 'ok') {
      setVisible(false)
      return
    }

    setVisible(true)
    const timeout = setTimeout(() => setVisible(false), TIMING.FEEDBACK_DISPLAY_MS)
    return () => clearTimeout(timeout)
  }, [tier, sessionKey])

  if (!visible || !tier || tier === 'ok') {
    return null
  }

  const label = tier === 'perfect'
    ? `${t('timing_perfect')} ×${TIMING.PERFECT_MULTIPLIER}`
    : `${t('timing_good')} ×${TIMING.GOOD_MULTIPLIER}`

  return (
    <div className={styles.wrap}>
      <span
        key={sessionKey}
        className={styles.label}
        data-tier={tier}
      >
        {label}
      </span>
    </div>
  )
}
