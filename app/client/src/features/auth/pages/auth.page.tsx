import { useState } from 'react'

import { Navigate } from 'react-router-dom'

import { useAuthSession } from '@/app/model/use-auth-session'
import AuthStateCard from '@/features/auth/components/AuthStateCard'
import { ROUTES, env } from '@/shared/model'
import { Layout } from '@/shared/widgets'

import styles from './auth.module.scss'

const AuthPage = () => {
	const {
		canUseDevelopmentLogin,
		error,
		isTelegramEnvironment,
		loginForDev,
		loginWithTelegramInitData,
		status
	} = useAuthSession()
	const [isSubmitting, setIsSubmitting] = useState(false)

	if (status === 'authenticated') {
		return <Navigate to={ROUTES.DASHBOARD} replace />
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
			title='Authorization'
			subtitle='The app signs users in through Telegram Mini Apps and falls back to a development login locally.'
		>
			<section className={styles.grid}>
				<AuthStateCard
					eyebrow='Session'
					title={
						isTelegramEnvironment
							? 'Signing in with Telegram Mini App'
							: 'Running outside Telegram'
					}
					description={
						<>
							<p>
								Current API: <strong>{env.API_URL}</strong>
							</p>
							{error ? <p className={styles.error}>{error}</p> : null}
							{isTelegramEnvironment ? (
								<p>
									The app found Telegram init data and can retry the server-side
									login flow if needed.
								</p>
							) : (
								<p>
									Local development uses a dev-only auth endpoint and a synthetic
									Telegram id.
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
									Retry Telegram Login
								</button>
							) : null}
							{canUseDevelopmentLogin ? (
								<button
									className={`${styles.button} ${styles.buttonSecondary}`}
									type='button'
									onClick={handleDevLogin}
									disabled={isSubmitting || status === 'bootstrapping'}
								>
									Continue in Dev Mode
								</button>
							) : null}
						</>
					}
				/>

				<AuthStateCard
					eyebrow='How It Works'
					title='Auth bootstrap'
					description={
						<>
							<span className={styles.badge}>automatic</span>
							<ul className={styles.list}>
								<li>If a valid app token exists, the client restores the session.</li>
								<li>If Telegram init data is available, the client logs in automatically.</li>
								<li>
									If the app runs locally outside Telegram, it can fall back to dev
									login with <code>{env.DEV_TELEGRAM_ID || 'no dev id configured'}</code>.
								</li>
							</ul>
						</>
					}
				/>
			</section>
		</Layout>
	)
}

export default AuthPage
