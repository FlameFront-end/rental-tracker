import type { ReactNode } from 'react'

import clsx from 'clsx'
import { SearchX, TriangleAlert } from 'lucide-react'

import { useI18n } from '@/app/i18n/use-i18n'

import styles from './FullErrorScreen.module.scss'

interface FullErrorScreenAction {
	label: string
	onClick: () => void
	variant?: 'primary' | 'secondary'
}

interface FullErrorScreenProps {
	actions?: FullErrorScreenAction[]
	detail?: ReactNode
	eyebrow?: string
	message: ReactNode
	statusCode?: string
	title: string
	tone?: 'error' | 'not-found'
}

const SignalIcon = ({ tone }: { tone: 'error' | 'not-found' }) =>
	tone === 'error' ? (
		<TriangleAlert size={30} strokeWidth={1.9} aria-hidden='true' className={styles.signalIcon} />
	) : (
		<SearchX size={30} strokeWidth={1.9} aria-hidden='true' className={styles.signalIcon} />
	)

export const FullErrorScreen = ({
	actions = [],
	detail,
	eyebrow,
	message,
	statusCode,
	title,
	tone = 'error'
}: FullErrorScreenProps) => {
	const { t } = useI18n()

	return (
		<section className={styles.screen}>
			<div className={styles.glowPrimary} />
			<div className={styles.glowSecondary} />

			<div className={styles.shell}>
				<div className={clsx(styles.panel, styles[tone])}>
					<div className={styles.topRow}>
						<div className={styles.signalWrap}>
							<SignalIcon tone={tone} />
						</div>
						{statusCode ? <span className={styles.statusCode}>{statusCode}</span> : null}
					</div>

					{eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
					<h1 className={styles.title}>{title}</h1>
					<div className={styles.message}>{message}</div>

					{actions.length > 0 ? (
						<div className={styles.actions}>
							{actions.map((action) => (
								<button
									key={action.label}
									type='button'
									className={clsx(
										styles.action,
										action.variant === 'secondary'
											? styles.actionSecondary
											: styles.actionPrimary
									)}
									onClick={action.onClick}
								>
									{action.label}
								</button>
							))}
						</div>
					) : null}

					{detail ? (
						<div className={styles.detailBlock}>
							<span className={styles.detailLabel}>{t('common.technicalDetail')}</span>
							<div className={styles.detail}>{detail}</div>
						</div>
					) : null}
				</div>
			</div>
		</section>
	)
}
