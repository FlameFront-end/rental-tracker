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
	type ConfirmContextValue,
	type ConfirmOptions
} from './confirm.context'
import ConfirmDialog from '@/shared/widgets/ConfirmDialog'

interface ConfirmState {
	cancelText: string
	confirmText: string
	description?: string
	title: string
	tone: 'default' | 'danger'
}

const DEFAULT_OPTIONS = {
	cancelText: 'Cancel',
	confirmText: 'Confirm',
	tone: 'default'
} satisfies Pick<ConfirmState, 'cancelText' | 'confirmText' | 'tone'>

export const ConfirmProvider = ({ children }: PropsWithChildren) => {
	const resolveRef = useRef<((value: boolean) => void) | null>(null)
	const [dialog, setDialog] = useState<ConfirmState | null>(null)

	const closeDialog = useCallback((result: boolean) => {
		resolveRef.current?.(result)
		resolveRef.current = null
		setDialog(null)
	}, [])

	const confirm = useCallback((options: ConfirmOptions) => {
		if (resolveRef.current) {
			resolveRef.current(false)
			resolveRef.current = null
		}

		return new Promise<boolean>((resolve) => {
			resolveRef.current = resolve
			setDialog({
				cancelText: options.cancelText ?? DEFAULT_OPTIONS.cancelText,
				confirmText: options.confirmText ?? DEFAULT_OPTIONS.confirmText,
				description: options.description,
				title: options.title,
				tone: options.tone ?? DEFAULT_OPTIONS.tone
			})
		})
	}, [])

	useEffect(
		() => () => {
			resolveRef.current?.(false)
			resolveRef.current = null
		},
		[]
	)

	const value = useMemo<ConfirmContextValue>(
		() => ({
			confirm
		}),
		[confirm]
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
				tone={dialog?.tone ?? DEFAULT_OPTIONS.tone}
				onCancel={() => closeDialog(false)}
				onConfirm={() => closeDialog(true)}
			/>
		</ConfirmContext.Provider>
	)
}
