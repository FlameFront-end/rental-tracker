import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

import { createPortal } from 'react-dom'

import { useI18n } from '@/app/i18n/use-i18n'

import type { ToastTone } from './toast.context'
import styles from './toast.module.scss'

interface ToastViewportItem {
  id: string
  isLeaving: boolean
  message: string
  tone: ToastTone
}

interface ToastViewportProps {
  onDismiss: (id: string) => void
  toasts: ToastViewportItem[]
}

const TOAST_ICONS = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle
} as const

export const ToastViewport = ({ onDismiss, toasts }: ToastViewportProps) => {
  const { t } = useI18n()

  if (typeof document === 'undefined' || toasts.length === 0) {
    return null
  }

  return createPortal(
    <div className={styles.viewport} aria-live="polite" aria-atomic="false">
      <div className={styles.stack}>
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.tone]

          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className={`${styles.toast} ${styles[toast.tone]} ${toast.isLeaving ? styles.leaving : ''}`}
            >
              <span className={styles.iconWrap} aria-hidden="true">
                <Icon size={18} strokeWidth={2.1} />
              </span>
              <p className={styles.message}>{toast.message}</p>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => onDismiss(toast.id)}
                aria-label={t('common.close')}
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>
          )
        })}
      </div>
    </div>,
    document.body
  )
}
