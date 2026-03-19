import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type PropsWithChildren
} from 'react'

import type { ToastContextValue, ToastOptions, ToastTone } from './toast.context'
import { ToastContext } from './toast.context'
import { ToastViewport } from './toast.viewport'

interface ToastItem {
	id: string
	isLeaving: boolean
	message: string
	tone: ToastTone
}

const MAX_VISIBLE_TOASTS = 3
const TOAST_EXIT_DURATION_MS = 220
const TOAST_DURATIONS: Record<ToastTone, number> = {
	error: 5200,
	info: 3800,
	success: 3200
}

export const ToastProvider = ({ children }: PropsWithChildren) => {
	const nextIdRef = useRef(0)
	const autoDismissTimersRef = useRef(new Map<string, number>())
	const removalTimersRef = useRef(new Map<string, number>())
	const toastsRef = useRef<ToastItem[]>([])
	const [toasts, setToasts] = useState<ToastItem[]>([])

	useEffect(() => {
		toastsRef.current = toasts
	}, [toasts])

	const removeToast = useCallback((id: string) => {
		const autoDismissTimer = autoDismissTimersRef.current.get(id)

		if (autoDismissTimer) {
			window.clearTimeout(autoDismissTimer)
			autoDismissTimersRef.current.delete(id)
		}

		const removalTimer = removalTimersRef.current.get(id)

		if (removalTimer) {
			window.clearTimeout(removalTimer)
			removalTimersRef.current.delete(id)
		}

		setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
	}, [])

	const dismissToast = useCallback(
		(id: string) => {
			const autoDismissTimer = autoDismissTimersRef.current.get(id)

			if (autoDismissTimer) {
				window.clearTimeout(autoDismissTimer)
				autoDismissTimersRef.current.delete(id)
			}

			if (removalTimersRef.current.has(id)) {
				return
			}

			setToasts((currentToasts) =>
				currentToasts.map((toast) =>
					toast.id === id ? { ...toast, isLeaving: true } : toast
				)
			)

			const removalTimer = window.setTimeout(() => {
				removeToast(id)
			}, TOAST_EXIT_DURATION_MS)

			removalTimersRef.current.set(id, removalTimer)
		},
		[removeToast]
	)

	const pushToast = useCallback(
		({ durationMs, message, tone = 'info' }: ToastOptions) => {
			const visibleToasts = toastsRef.current.filter((toast) => !toast.isLeaving)

			if (visibleToasts.length >= MAX_VISIBLE_TOASTS) {
				dismissToast(visibleToasts[0].id)
			}

			const id = String(++nextIdRef.current)
			const nextToast: ToastItem = {
				id,
				isLeaving: false,
				message,
				tone
			}

			setToasts((currentToasts) => [...currentToasts, nextToast])

			const timeoutId = window.setTimeout(() => {
				dismissToast(id)
			}, durationMs ?? TOAST_DURATIONS[tone])

			autoDismissTimersRef.current.set(id, timeoutId)

			return id
		},
		[dismissToast, toastsRef]
	)

	useEffect(
		() => () => {
			for (const timeoutId of autoDismissTimersRef.current.values()) {
				window.clearTimeout(timeoutId)
			}

			for (const timeoutId of removalTimersRef.current.values()) {
				window.clearTimeout(timeoutId)
			}

			autoDismissTimersRef.current.clear()
			removalTimersRef.current.clear()
		},
		[]
	)

	const value = useMemo<ToastContextValue>(
		() => ({
			dismissToast,
			error: (message, durationMs) =>
				pushToast({
					durationMs,
					message,
					tone: 'error'
				}),
			info: (message, durationMs) =>
				pushToast({
					durationMs,
					message,
					tone: 'info'
				}),
			pushToast,
			success: (message, durationMs) =>
				pushToast({
					durationMs,
					message,
					tone: 'success'
				})
		}),
		[dismissToast, pushToast]
	)

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastViewport toasts={toasts} onDismiss={dismissToast} />
		</ToastContext.Provider>
	)
}
