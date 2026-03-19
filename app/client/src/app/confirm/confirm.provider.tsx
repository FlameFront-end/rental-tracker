import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from 'react'

import {
  ConfirmContext,
  type ConfirmChoiceOptions,
  type ConfirmChoiceResult,
  type ConfirmContextValue,
  type ConfirmOptions
} from './confirm.context'
import ConfirmDialog from '@/shared/widgets/ConfirmDialog'

interface ConfirmState {
  cancelText: string
  confirmText: string
  description?: string
  secondaryText?: string
  secondaryTone?: 'default' | 'danger'
  title: string
  tone: 'default' | 'danger'
}

const DEFAULT_OPTIONS = {
  cancelText: 'Cancel',
  confirmText: 'Confirm',
  tone: 'default'
} satisfies Pick<ConfirmState, 'cancelText' | 'confirmText' | 'tone'>

export const ConfirmProvider = ({ children }: PropsWithChildren) => {
  const resolveRef = useRef<((value: ConfirmChoiceResult) => void) | null>(null)
  const [dialog, setDialog] = useState<ConfirmState | null>(null)

  const closeDialog = useCallback((result: ConfirmChoiceResult) => {
    resolveRef.current?.(result)
    resolveRef.current = null
    setDialog(null)
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    if (resolveRef.current) {
      resolveRef.current('cancel')
      resolveRef.current = null
    }

    return new Promise<boolean>((resolve) => {
      resolveRef.current = (result) => resolve(result === 'confirm')
      setDialog({
        cancelText: options.cancelText ?? DEFAULT_OPTIONS.cancelText,
        confirmText: options.confirmText ?? DEFAULT_OPTIONS.confirmText,
        description: options.description,
        title: options.title,
        tone: options.tone ?? DEFAULT_OPTIONS.tone
      })
    })
  }, [])

  const confirmChoice = useCallback((options: ConfirmChoiceOptions) => {
    if (resolveRef.current) {
      resolveRef.current('cancel')
      resolveRef.current = null
    }

    return new Promise<ConfirmChoiceResult>((resolve) => {
      resolveRef.current = resolve
      setDialog({
        cancelText: options.cancelText ?? DEFAULT_OPTIONS.cancelText,
        confirmText: options.confirmText ?? DEFAULT_OPTIONS.confirmText,
        description: options.description,
        secondaryText: options.secondaryText,
        secondaryTone: options.secondaryTone ?? DEFAULT_OPTIONS.tone,
        title: options.title,
        tone: options.tone ?? DEFAULT_OPTIONS.tone
      })
    })
  }, [])

  useEffect(
    () => () => {
      resolveRef.current?.('cancel')
      resolveRef.current = null
    },
    []
  )

  const value = useMemo<ConfirmContextValue>(
    () => ({
      confirm,
      confirmChoice
    }),
    [confirm, confirmChoice]
  )

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.title ?? ''}
        description={dialog?.description}
        cancelText={dialog?.cancelText ?? DEFAULT_OPTIONS.cancelText}
        confirmText={dialog?.confirmText ?? DEFAULT_OPTIONS.confirmText}
        secondaryText={dialog?.secondaryText}
        secondaryTone={dialog?.secondaryTone}
        tone={dialog?.tone ?? DEFAULT_OPTIONS.tone}
        onCancel={() => closeDialog('cancel')}
        onConfirm={() => closeDialog('confirm')}
        onSecondary={() => closeDialog('secondary')}
      />
    </ConfirmContext.Provider>
  )
}
