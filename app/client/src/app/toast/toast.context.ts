import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'warning' | 'error' | 'info'

export interface ToastOptions {
  durationMs?: number
  message: string
  tone?: ToastTone
}

export interface ToastContextValue {
  dismissToast: (id: string) => void
  error: (message: string, durationMs?: number) => string
  info: (message: string, durationMs?: number) => string
  pushToast: (options: ToastOptions) => string
  success: (message: string, durationMs?: number) => string
  warning: (message: string, durationMs?: number) => string
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export const useToastContext = () => {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider.')
  }

  return context
}
