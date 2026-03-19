import { X } from 'lucide-react'

import {
	useEffect,
	useRef,
	useState,
	type MouseEvent,
	type PropsWithChildren,
	type TouchEvent
} from 'react'
import { createPortal } from 'react-dom'

import { useI18n } from '@/app/i18n/use-i18n'
import { useTelegramBackButton } from '@/app/telegram/telegram-back-button'

import styles from './ScreenSheet.module.scss'

interface ScreenSheetProps extends PropsWithChildren {
	onClose: () => void
	open: boolean
	showCloseButton?: boolean
}

const SWIPE_CLOSE_DISTANCE_PX = 120
const SWIPE_CLOSE_VELOCITY = 0.6
const SWIPE_START_TOLERANCE_PX = 10

const ScreenSheet = ({ children, onClose, open, showCloseButton = true }: ScreenSheetProps) => {
	const { t } = useI18n()
	const bodyRef = useRef<HTMLDivElement | null>(null)
	const touchGestureRef = useRef({
		canDrag: false,
		isDragging: false,
		lastY: 0,
		lastTime: 0,
		startX: 0,
		startY: 0,
		startTime: 0
	})
	const [dragOffset, setDragOffset] = useState(0)
	const [isDragging, setIsDragging] = useState(false)

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

	useEffect(() => {
		if (!open) {
			setDragOffset(0)
			setIsDragging(false)
		}
	}, [open])

	if (!open) {
		return null
	}

	const handleContentClick = (event: MouseEvent<HTMLElement>) => {
		event.stopPropagation()
	}

	const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
		const touch = event.touches[0]
		const targetNode = event.target as Node | null
		const startedOutsideScrollBody = targetNode ? !bodyRef.current?.contains(targetNode) : false
		const bodyScrollTop = bodyRef.current?.scrollTop ?? 0

		touchGestureRef.current = {
			canDrag: startedOutsideScrollBody || bodyScrollTop <= 0,
			isDragging: false,
			lastY: touch.clientY,
			lastTime: performance.now(),
			startX: touch.clientX,
			startY: touch.clientY,
			startTime: performance.now()
		}
	}

	const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
		const gesture = touchGestureRef.current

		if (!gesture.canDrag) {
			return
		}

		const touch = event.touches[0]
		const deltaY = touch.clientY - gesture.startY
		const deltaX = touch.clientX - gesture.startX

		if (!gesture.isDragging) {
			if (deltaY <= SWIPE_START_TOLERANCE_PX || Math.abs(deltaY) <= Math.abs(deltaX)) {
				return
			}

			gesture.isDragging = true
			setIsDragging(true)
		}

		if (event.cancelable) {
			event.preventDefault()
		}

		gesture.lastY = touch.clientY
		gesture.lastTime = performance.now()
		setDragOffset(Math.max(0, deltaY))
	}

	const resetSwipeState = () => {
		touchGestureRef.current = {
			canDrag: false,
			isDragging: false,
			lastY: 0,
			lastTime: 0,
			startX: 0,
			startY: 0,
			startTime: 0
		}
		setIsDragging(false)
	}

	const handleTouchEnd = () => {
		const gesture = touchGestureRef.current

		if (!gesture.isDragging) {
			resetSwipeState()
			return
		}

		const distance = Math.max(0, gesture.lastY - gesture.startY)
		const duration = Math.max(1, gesture.lastTime - gesture.startTime)
		const velocity = distance / duration
		const shouldClose =
			distance >= SWIPE_CLOSE_DISTANCE_PX || velocity >= SWIPE_CLOSE_VELOCITY

		resetSwipeState()
		setDragOffset(0)

		if (shouldClose) {
			onClose()
		}
	}

	const dragProgress = Math.min(dragOffset / SWIPE_CLOSE_DISTANCE_PX, 1)

	return createPortal(
		<div className={styles.backdrop} onClick={onClose}>
			<section
				className={`${styles.sheet} ${isDragging ? styles.sheetDragging : ''}`.trim()}
				role='dialog'
				aria-modal='true'
				onClick={handleContentClick}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				onTouchCancel={handleTouchEnd}
				style={{
					opacity: 1 - dragProgress * 0.12,
					transform: `translateY(${dragOffset}px)`
				}}
			>
				{showCloseButton ? (
					<button
						type='button'
						className={styles.closeButton}
						aria-label={t('common.closePanel')}
						onClick={onClose}
					>
						<X size={18} strokeWidth={1.9} aria-hidden='true' />
					</button>
				) : null}
				<div ref={bodyRef} className={styles.body}>
					{children}
				</div>
			</section>
		</div>,
		document.body
	)
}

export default ScreenSheet
