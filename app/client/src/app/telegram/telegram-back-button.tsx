import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type PropsWithChildren
} from 'react'

import { backButton } from '@tma.js/sdk-react'

interface TelegramBackButtonContextValue {
	enabled: boolean
	registerHandler: (id: symbol, handler: VoidFunction) => VoidFunction
}

interface TelegramBackButtonProviderProps extends PropsWithChildren {
	enabled: boolean
}

interface TelegramBackButtonHandler {
	handler: VoidFunction
	id: symbol
}

const TelegramBackButtonContext = createContext<TelegramBackButtonContextValue | null>(null)

const tryRun = (callback: VoidFunction) => {
	try {
		callback()
	} catch {
		return
	}
}

export const TelegramBackButtonProvider = ({
	children,
	enabled
}: TelegramBackButtonProviderProps) => {
	const handlersRef = useRef<TelegramBackButtonHandler[]>([])
	const [handlerCount, setHandlerCount] = useState(0)

	useEffect(() => {
		if (!enabled) {
			handlersRef.current = []
			setHandlerCount(0)
			return
		}

		const offClick = (() => {
			try {
				return backButton.onClick(() => {
					const topHandler = handlersRef.current[handlersRef.current.length - 1]

					topHandler?.handler()
				})
			} catch {
				return undefined
			}
		})()

		return () => {
			offClick?.()
			handlersRef.current = []
			setHandlerCount(0)
			tryRun(() => backButton.hide())
		}
	}, [enabled])

	useEffect(() => {
		if (!enabled) {
			return
		}

		if (handlerCount > 0) {
			tryRun(() => backButton.show())
			return
		}

		tryRun(() => backButton.hide())
	}, [enabled, handlerCount])

	const value = useMemo<TelegramBackButtonContextValue>(
		() => ({
			enabled,
			registerHandler: (id, handler) => {
				handlersRef.current = [
					...handlersRef.current.filter((entry) => entry.id !== id),
					{
						handler,
						id
					}
				]
				setHandlerCount(handlersRef.current.length)

				return () => {
					handlersRef.current = handlersRef.current.filter((entry) => entry.id !== id)
					setHandlerCount(handlersRef.current.length)
				}
			}
		}),
		[enabled]
	)

	return (
		<TelegramBackButtonContext.Provider value={value}>
			{children}
		</TelegramBackButtonContext.Provider>
	)
}

export const useTelegramBackButton = (enabled: boolean, onBack: VoidFunction) => {
	const context = useContext(TelegramBackButtonContext)
	const handlerIdRef = useRef(Symbol('telegram-back-button'))
	const onBackRef = useRef(onBack)

	useEffect(() => {
		onBackRef.current = onBack
	}, [onBack])

	useEffect(() => {
		if (!enabled || !context?.enabled) {
			return
		}

		return context.registerHandler(handlerIdRef.current, () => {
			onBackRef.current()
		})
	}, [context, enabled])
}
