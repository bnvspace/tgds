import WebApp from '@twa-dev/sdk'

declare global {
  interface Window {
    Telegram?: any
  }
}

export const haptics = {
  impactLight() {
    if (WebApp.HapticFeedback?.impactOccurred) {
      WebApp.HapticFeedback.impactOccurred('light')
    }
  },
  impactMedium() {
    if (WebApp.HapticFeedback?.impactOccurred) {
      WebApp.HapticFeedback.impactOccurred('medium')
    }
  },
  impactHeavy() {
    if (WebApp.HapticFeedback?.impactOccurred) {
      WebApp.HapticFeedback.impactOccurred('heavy')
    }
  },
  notifySuccess() {
    if (WebApp.HapticFeedback?.notificationOccurred) {
      WebApp.HapticFeedback.notificationOccurred('success')
    }
  },
  notifyError() {
    if (WebApp.HapticFeedback?.notificationOccurred) {
      WebApp.HapticFeedback.notificationOccurred('error')
    }
  },
}
