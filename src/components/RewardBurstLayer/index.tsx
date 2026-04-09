import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { symbolIconById } from '@/assets/pixelArt'
import { playCoinSFX } from '@/utils/audio'
import GameIcon from '@/components/GameIcon'
import styles from './RewardBurstLayer.module.css'

export type RewardType = 'coin' | 'chip'

export interface RewardBurstEventDetail {
  type: RewardType
  amount: number
}

export const triggerRewardBurst = (type: RewardType, amount: number) => {
  window.dispatchEvent(
    new CustomEvent<RewardBurstEventDetail>('rewardBurst', {
      detail: { type, amount },
    })
  )
}

interface Particle {
  id: string
  type: RewardType
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  scale: number
}

export default function RewardBurstLayer() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const handleBurst = (e: Event) => {
      const { type, amount } = (e as CustomEvent<RewardBurstEventDetail>).detail
      
      const newParticles: Particle[] = []
      const burstCount = Math.min(amount, 15) // limit max particles rendered
      
      for (let i = 0; i < burstCount; i++) {
        // Randomize physics
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI // shoots upwards
        const force = 400 + Math.random() * 400
        
        newParticles.push({
          id: `${Date.now()}-${Math.random()}`,
          type,
          x: 0,
          y: window.innerHeight * 0.3, // Roughly slot machine height
          vx: Math.cos(angle) * force,
          vy: Math.sin(angle) * force - 300,
          rotation: Math.random() * 360,
          scale: 0.8 + Math.random() * 0.5,
        })
      }

      setParticles((prev) => [...prev, ...newParticles])
      playCoinSFX()
      
      // Clean up particles after they fall
      setTimeout(() => {
        setParticles((prev) => prev.filter(p => !newParticles.find(np => np.id === p.id)))
      }, 2500)
    }

    window.addEventListener('rewardBurst', handleBurst)
    return () => window.removeEventListener('rewardBurst', handleBurst)
  }, [])

  return (
    <div className={styles.layer} aria-hidden="true">
      <AnimatePresence>
        {particles.map((p) => {
          const isCoin = p.type === 'coin'
          // Actually let's use a raw emoji if chip icon isn't standard
          
          return (
            <motion.div
              key={p.id}
              className={styles.particle}
              initial={{ 
                x: '50vw', 
                y: p.y, 
                rotate: p.rotation, 
                scale: p.scale 
              }}
              animate={{
                x: `calc(50vw + ${p.vx}px)`,
                y: window.innerHeight + 100, // fall off screen
                rotate: p.rotation + p.vx * 2, // spin relative to x velocity
                scale: p.scale * 1.2
              }}
              transition={{
                duration: 2,
                ease: [0.32, 0.72, 0.5, 1.2], // strong physics gravity ease
              }}
            >
              {isCoin ? (
                <GameIcon icon={symbolIconById.coin} alt="" decorative className={styles.icon} />
              ) : (
                <span className={styles.chipEmoji}>🟢</span>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
