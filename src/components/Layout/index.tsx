import styles from './Layout.module.css'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.root}>
      <div className={styles.frame}>
        <div className={styles.header}>
          <span className={styles.title}>Slot &amp; Daggers</span>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
