import { useEffect, useId, useRef, type MouseEvent } from 'react'

import { createPortal } from 'react-dom'

import { useI18n } from '@/app/i18n/use-i18n'
import { lockDocumentScroll } from '@/shared/lib/document-scroll-lock'
import { Button } from '@/shared/kit'

import styles from './ConfirmDialog.module.scss'

interface ConfirmDialogProps {
  cancelText: string
  confirmText: string
  description?: string
  onCancel: () => void
  onConfirm: () => void
  onSecondary?: () => void
  open: boolean
  secondaryText?: string
  secondaryTone?: 'default' | 'danger'
  title: string
  tone?: 'default' | 'danger'
}

const ConfirmDialog = ({
  cancelText,
  confirmText,
  description,
  onCancel,
  onConfirm,
  onSecondary,
  open,
  secondaryText,
  secondaryTone = 'default',
  title,
  tone = 'default'
}: ConfirmDialogProps) => {
  const { t } = useI18n()
  const titleId = useId()
  const descriptionId = useId()
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const unlockScroll = lockDocumentScroll()

    const focusFrame = window.requestAnimationFrame(() => {
      confirmButtonRef.current?.focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      unlockScroll()
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel, open])

  if (!open) {
    return null
  }

  const handlePanelClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onCancel}>
      <section
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={handlePanelClick}
      >
        <span className={styles.eyebrow}>{t('common.confirmAction')}</span>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}

        <div
          className={`${styles.actions} ${secondaryText ? styles.actionsWithSecondary : ''}`}
        >
          {secondaryText ? (
            <Button
              type="button"
              variant={secondaryTone === 'danger' ? 'danger' : 'secondary'}
              onClick={onSecondary}
            >
              {secondaryText}
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          <Button
            ref={confirmButtonRef}
            type="button"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
          {secondaryText ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              {cancelText}
            </Button>
          ) : null}
        </div>
      </section>
    </div>,
    document.body
  )
}

export default ConfirmDialog
