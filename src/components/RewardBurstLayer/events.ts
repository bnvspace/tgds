export type RewardType = 'coin' | 'chip'

export interface RewardBurstEventDetail {
  type: RewardType
  amount: number
}

export const REWARD_BURST_EVENT = 'rewardBurst'

export function triggerRewardBurst(type: RewardType, amount: number) {
  window.dispatchEvent(
    new CustomEvent<RewardBurstEventDetail>(REWARD_BURST_EVENT, {
      detail: { type, amount },
    }),
  )
}
