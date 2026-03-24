// ── Haptic Feedback wrapper ───────────────────────────────────────────────
// Access HapticFeedback directly via window.Telegram.WebApp to avoid
// any @twa-dev/sdk wrapper issues. Falls back silently if unavailable.

let IS_HAPTICS_ENABLED = true

export function setHapticsEnabled(enabled: boolean) {
  IS_HAPTICS_ENABLED = enabled
}

function hf() {
  if (!IS_HAPTICS_ENABLED) {
    return null
  }

  try {
    return (window as any)?.Telegram?.WebApp?.HapticFeedback ?? null
  } catch {
    return null
  }
}

export const haptics = {
  // ── Impact events ─────────────────────────────────────────
  /** Light tap — regular button presses */
  button() { hf()?.impactOccurred('light') },

  /** Medium — important action (start battle, confirm) */
  action() { hf()?.impactOccurred('medium') },

  /** Heavy — boss attack, major event */
  heavy() { hf()?.impactOccurred('heavy') },

  /** Rigid — swipe-like (flee, hard decision) */
  rigid() { hf()?.impactOccurred('rigid') },

  /** Soft — subtle feedback (hover tick, reel tick) */
  soft() { hf()?.impactOccurred('soft') },

  // ── Reel spin ─────────────────────────────────────────────
  /** Reel animation tick */
  reelTick() { hf()?.selectionChanged() },
  /** All reels stopped */
  reelLand() { hf()?.impactOccurred('medium') },

  // ── QTE ───────────────────────────────────────────────────
  /** QTE stop button */
  qteHit() { hf()?.impactOccurred('rigid') },
  /** Perfect/crit zone hit */
  qteCrit() { hf()?.impactOccurred('heavy') },

  // ── Combat ────────────────────────────────────────────────
  /** Player receives damage */
  damageTaken() { hf()?.impactOccurred('heavy') },
  /** Deal damage to enemy */
  damageDealt() { hf()?.impactOccurred('medium') },
  /** Shield / block */
  shieldBlock() { hf()?.impactOccurred('rigid') },
  /** Player healed */
  heal() { hf()?.impactOccurred('light') },

  // ── Notifications ─────────────────────────────────────────
  /** Run won */
  victory() { hf()?.notificationOccurred('success') },
  /** Run lost */
  defeat() { hf()?.notificationOccurred('error') },
  /** Warning (not enough tokens) */
  warn() { hf()?.notificationOccurred('warning') },

  // ── Navigation ────────────────────────────────────────────
  /** Tab switch or selection change */
  selectionChange() { hf()?.selectionChanged() },
  /** Coin/token/item pickup */
  coinPickup() { hf()?.impactOccurred('soft') },

  // ── Backward-compatible aliases ───────────────────────────
  notifySuccess() { this.victory() },
  notifyError()   { this.defeat() },
  impactLight()   { this.button() },
  impactMedium()  { this.action() },
  impactHeavy()   { this.heavy() },
}
