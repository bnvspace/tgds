import { isAssetIcon } from '@/utils/gameIcon'

interface GameIconProps {
  icon: string
  alt: string
  className?: string
  decorative?: boolean
}

export default function GameIcon({
  icon,
  alt,
  className,
  decorative = false,
}: GameIconProps) {
  if (isAssetIcon(icon)) {
    return (
      <img
        src={icon}
        alt={decorative ? '' : alt}
        aria-hidden={decorative ? 'true' : undefined}
        className={className}
        draggable={false}
      />
    )
  }

  return (
    <span
      className={className}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : alt}
    >
      {icon || '?'}
    </span>
  )
}
