import WebApp from '@twa-dev/sdk'

declare global {
  interface Window {
    Telegram?: any
  }
}

export const haptics = {
  impactLight() {
    if (WebApp.isExpanded || window.Telegram?.WebApp) {
      WebApp.HapticFeedback.impactOccurred('light')
    }
  },
  impactMedium() {
    if (WebApp.isExpanded || window.Telegram?.WebApp) {
      WebApp.HapticFeedback.impactOccurred('medium')
    }
  },
  impactHeavy() {
    if (WebApp.isExpanded || window.Telegram?.WebApp) {
      WebApp.HapticFeedback.impactOccurred('heavy')
    }
  },
  notifySuccess() {
    if (WebApp.isExpanded || window.Telegram?.WebApp) {
      WebApp.HapticFeedback.notificationOccurred('success')
    }
  },
  notifyError() {
    if (WebApp.isExpanded || window.Telegram?.WebApp) {
      WebApp.HapticFeedback.notificationOccurred('error')
    }
  },
}
