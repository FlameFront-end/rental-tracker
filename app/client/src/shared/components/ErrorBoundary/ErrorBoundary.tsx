import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

import { FullErrorScreen } from '@/shared/widgets'

import styles from './ErrorBoundary.module.scss'

interface ErrorBoundaryProps {
	children: ReactNode
}

interface ErrorBoundaryState {
	hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	public state: ErrorBoundaryState = {
		hasError: false
	}

	public static getDerivedStateFromError() {
		return { hasError: true }
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('Unhandled application error', error, errorInfo)
	}

	public render() {
		if (this.state.hasError) {
			return (
				<div className={styles.fallback}>
					<FullErrorScreen
						title='Unexpected Error'
						message='The application crashed before the page could finish rendering.'
					/>
				</div>
			)
		}

		return this.props.children
	}
}
