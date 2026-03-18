import { createContext, useContext } from 'react'

export type ConfirmTone = 'default' | 'danger'

export interface ConfirmOptions {
	cancelText?: string
	confirmText?: string
	description?: string
	title: string
	tone?: ConfirmTone
}

export interface ConfirmContextValue {
	confirm: (options: ConfirmOptions) => Promise<boolean>
}

export const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export const useConfirmContext = () => {
	const context = useContext(ConfirmContext)

	if (!context) {
		throw new Error('useConfirm must be used within ConfirmProvider.')
	}

	return context
}
