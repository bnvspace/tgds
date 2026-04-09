interface CreateGameIconNodeOptions {
  icon: string
  alt: string
  className: string
}

export function isAssetIcon(icon: string): boolean {
  return (
    icon.startsWith('data:image/')
    || icon.startsWith('blob:')
    || icon.startsWith('http://')
    || icon.startsWith('https://')
    || /\/assets\/.+\.(svg|png|webp|jpe?g|gif)(\?.*)?$/i.test(icon)
    || /\.(svg|png|webp|jpe?g|gif)(\?.*)?$/i.test(icon)
  )
}

export function createGameIconNode({
  icon,
  alt,
  className,
}: CreateGameIconNodeOptions): HTMLElement {
  if (isAssetIcon(icon)) {
    const image = document.createElement('img')
    image.src = icon
    image.alt = alt
    image.className = className
    image.draggable = false
    image.loading = 'eager'
    image.decoding = 'async'
    return image
  }

  const text = document.createElement('span')
  text.className = className
  text.textContent = icon || '?'
  text.setAttribute('role', 'img')
  text.setAttribute('aria-label', alt)
  return text
}
