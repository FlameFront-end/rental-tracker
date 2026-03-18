import { X } from 'lucide-react'

import { useEffect, type MouseEvent, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'

import { useI18n } from '@/app/i18n/use-i18n'
import { useTelegramBackButton } from '@/app/telegram/telegram-back-button'

import styles from './ScreenSheet.module.scss'

interface ScreenSheetProps extends PropsWithChildren {
	onClose: () => void
	open: boolean
}

const ScreenSheet = ({ children, onClose, open }: ScreenSheetProps) => {
	const { t } = useI18n()

	useTelegramBackButton(open, onClose)

	useEffect(() => {
		if (!open) {
			return
		}

		const { body } = document
		const previousOverflow = body.style.overflow

		body.style.overflow = 'hidden'

		return () => {
			body.style.overflow = previousOverflow
		}
	}, [open])

	if (!open) {
		return null
	}

	const handleContentClick = (event: MouseEvent<HTMLElement>) => {
		event.stopPropagation()
	}

	return createPortal(
		<div className={styles.backdrop} onClick={onClose}>
			<section
				className={styles.sheet}
				role='dialog'
				aria-modal='true'
				onClick={handleContentClick}
			>
				<button
					type='button'
					className={styles.closeButton}
					aria-label={t('common.closePanel')}
					onClick={onClose}
				>
					<X size={18} strokeWidth={1.9} aria-hidden='true' />
				</button>
				<div className={styles.body}>{children}</div>
			</section>
		</div>,
		document.body
	)
}

export default ScreenSheet
