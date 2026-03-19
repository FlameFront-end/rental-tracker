import { useState } from 'react'

import { Navigate, useLocation } from 'react-router-dom'

import { useI18n } from '@/app/i18n/use-i18n'
import { useAuthSession } from '@/app/session/use-auth-session'
import { getStoredLastRoute } from '@/app/telegram/app-storage'
import { getSafeRedirectTarget, getStartAppTarget } from '@/app/telegram/startapp'
import AuthStateCard from '@/features/auth/components/AuthStateCard'
import { ROUTES } from '@/shared/model'
import { Layout } from '@/shared/widgets'

import styles from './auth.module.scss'

const AuthPage = () => {
	const { t } = useI18n()
	const location = useLocation()
	const {
		canUseDevelopmentLogin,
		error,
		hasSubscriptionAccess,
		isTelegramEnvironment,
		loginForDev,
		loginWithTelegramInitData,
		status
	} = useAuthSession()
	const [isSubmitting, setIsSubmitting] = useState(false)

	if (status === 'authenticated') {
		return (
			<Navigate
				to={
					hasSubscriptionAccess
						? getSafeRedirectTarget(location.state?.from) ??
							getStartAppTarget() ??
							getStoredLastRoute() ??
							ROUTES.DASHBOARD
						: ROUTES.SUBSCRIPTION
				}
				replace
			/>
		)
	}

	const handleDevLogin = async () => {
		setIsSubmitting(true)

		try {
			await loginForDev()
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleTelegramRetry = async () => {
		setIsSubmitting(true)

		try {
			await loginWithTelegramInitData()
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Layout
			title={t('auth.title')}
			subtitle={t('auth.subtitle')}
		>
			<section className={styles.grid}>
				<AuthStateCard
					eyebrow={t('auth.startEyebrow')}
					title={
						isTelegramEnvironment
							? t('auth.telegramTitle')
							: t('auth.localTitle')
					}
					description={
						<>
							{error ? <p className={styles.error}>{error}</p> : null}
							{isTelegramEnvironment ? (
								<p>
									{t('auth.telegramDescription')}
								</p>
							) : (
								<p>
									{t('auth.localDescription')}
								</p>
							)}
						</>
					}
					actions={
						<>
							{isTelegramEnvironment ? (
								<button
									className={styles.button}
									type='button'
									onClick={handleTelegramRetry}
									disabled={isSubmitting || status === 'bootstrapping'}
								>
									{t('auth.enterWorkspace')}
								</button>
							) : null}
							{canUseDevelopmentLogin ? (
								<button
									className={`${styles.button} ${styles.buttonSecondary}`}
									type='button'
									onClick={handleDevLogin}
									disabled={isSubmitting || status === 'bootstrapping'}
								>
									{t('auth.continueDevMode')}
								</button>
							) : null}
						</>
					}
				/>

				<AuthStateCard
					eyebrow={t('auth.flowEyebrow')}
					title={t('auth.nextTitle')}
					description={
						<>
							<span className={styles.badge}>{t('auth.flowBadge')}</span>
							<ul className={styles.list}>
								<li>{t('auth.flowPoint1')}</li>
								<li>{t('auth.flowPoint2')}</li>
								<li>{t('auth.flowPoint3')}</li>
							</ul>
						</>
					}
				/>
			</section>
		</Layout>
	)
}

export default AuthPage
