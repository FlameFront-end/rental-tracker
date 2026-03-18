import type { ContextType, ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

import { I18nContext } from '@/app/i18n/i18n.context'
import { FullErrorScreen } from '@/shared/widgets'

interface ErrorBoundaryProps {
	children: ReactNode
}

interface ErrorBoundaryState {
	hasError: boolean
	message?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	public static contextType = I18nContext

	public declare context: ContextType<typeof I18nContext>

	public state: ErrorBoundaryState = {
		hasError: false,
		message: undefined
	}

	public static getDerivedStateFromError(error: Error) {
		return {
			hasError: true,
			message: error.message
		}
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('Unhandled application error', error, errorInfo)
	}

	public render() {
		if (this.state.hasError) {
			const t = this.context?.t ?? ((key: string) => key)

			return (
				<FullErrorScreen
					tone='error'
					eyebrow={t('error.appEyebrow')}
					statusCode='500'
					title={t('error.appTitle')}
					message={t('error.appMessage')}
					detail={import.meta.env.DEV ? this.state.message : undefined}
					actions={[
						{
							label: t('common.reloadApp'),
							onClick: () => window.location.reload()
						}
					]}
				/>
			)
		}

		return this.props.children
	}
}
