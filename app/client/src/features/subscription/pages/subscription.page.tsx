import { useMemo, useState } from 'react'

import { openTelegramLink } from '@tma.js/sdk-react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useI18n } from '@/app/i18n/use-i18n'
import { useAuthSession } from '@/app/session/use-auth-session'
import { useTelegramHaptics } from '@/app/telegram/use-telegram-haptics'
import { activateTrialSubscription } from '@/shared/api/services/auth'
import { Button } from '@/shared/kit'
import { getApiErrorMessage, getIntlLocale } from '@/shared/lib'
import { ROUTES, type AppLocale } from '@/shared/model'
import { Layout } from '@/shared/widgets'

import styles from './subscription.module.scss'

const PURCHASE_URL = 'https://t.me/Artem_Kaliganov'

const tryRun = (callback: () => void) => {
	try {
		callback()
	} catch {
		return
	}
}

const formatEndsAtLabel = (value: string | null, locale: AppLocale) => {
	if (!value) {
		return null
	}

	const date = new Date(value)

	if (Number.isNaN(date.getTime())) {
		return null
	}

	return new Intl.DateTimeFormat(getIntlLocale(locale), {
		dateStyle: 'long'
	}).format(date)
}

const SubscriptionPage = () => {
	const navigate = useNavigate()
	const { locale, t } = useI18n()
	const { error: triggerError, success } = useTelegramHaptics()
	const {
		hasSubscriptionAccess,
		isTelegramEnvironment,
		subscriptionState,
		updateCurrentUser,
		user
	} = useAuthSession()
	const [activationError, setActivationError] = useState<string | null>(null)
	const [isActivatingTrial, setIsActivatingTrial] = useState(false)
	const formattedEndsAt = useMemo(
		() => formatEndsAtLabel(user?.subscriptionEndsAt ?? null, locale),
		[locale, user?.subscriptionEndsAt]
	)

	if (!user) {
		return <Navigate to={ROUTES.AUTH} replace />
	}

	if (hasSubscriptionAccess) {
		return <Navigate to={ROUTES.DASHBOARD} replace />
	}

	const isWelcomeState = subscriptionState === 'none'
	const isTrialExpired = subscriptionState === 'trial_expired'
	const title = isTrialExpired
		? t('subscription.title.trialExpired')
		: isWelcomeState
			? t('subscription.title.welcome')
			: t('subscription.title.subscriptionExpired')
	const eyebrow = isTrialExpired
		? t('subscription.eyebrow.trialExpired')
		: isWelcomeState
			? t('subscription.eyebrow.welcome')
			: t('subscription.eyebrow.subscriptionExpired')
	const description = isTrialExpired
		? t('subscription.description.trialExpired')
		: isWelcomeState
			? t('subscription.description.welcome')
			: t('subscription.description.subscriptionExpired')

	const handleActivateTrial = async () => {
		setIsActivatingTrial(true)
		setActivationError(null)

		try {
			const nextUser = await activateTrialSubscription()

			updateCurrentUser(nextUser)
			success()
			navigate(ROUTES.DASHBOARD, { replace: true })
		} catch (error) {
			setActivationError(
				getApiErrorMessage(error, t('subscription.error.activateTrial'))
			)
			triggerError()
		} finally {
			setIsActivatingTrial(false)
		}
	}

	const handlePurchaseClick = () => {
		if (isTelegramEnvironment) {
			tryRun(() => openTelegramLink(PURCHASE_URL))
			return
		}

		if (typeof window !== 'undefined') {
			window.open(PURCHASE_URL, '_blank', 'noopener,noreferrer')
		}
	}

	return (
		<Layout
			title={t('subscription.title.page')}
			subtitle={t('subscription.subtitle.page')}
		>
			<section className={styles.page}>
				<div className={styles.hero}>
					<div className={styles.heroGlow} />
					<p className={styles.eyebrow}>{eyebrow}</p>
					<h1 className={styles.title}>{title}</h1>
					<p className={styles.description}>{description}</p>
					<div className={styles.highlights}>
						<div className={styles.highlightItem}>
							<strong>{t('subscription.hero.rentalsTitle')}</strong>
							<span>{t('subscription.hero.rentalsDescription')}</span>
						</div>
						<div className={styles.highlightItem}>
							<strong>{t('subscription.hero.calendarTitle')}</strong>
							<span>{t('subscription.hero.calendarDescription')}</span>
						</div>
						<div className={styles.highlightItem}>
							<strong>{t('subscription.hero.remindersTitle')}</strong>
							<span>{t('subscription.hero.remindersDescription')}</span>
						</div>
					</div>
				</div>

				<div className={styles.grid}>
					<article className={styles.offerCard}>
						<div className={styles.offerTop}>
							<strong className={styles.offerTitle}>
								{isWelcomeState
									? t('subscription.offer.title.trial')
									: t('subscription.offer.title.purchase')}
							</strong>
							<p className={styles.offerDescription}>
								{isWelcomeState
									? t('subscription.offer.description.trial')
									: t('subscription.offer.description.purchase')}
							</p>
							{formattedEndsAt && !isWelcomeState ? (
								<p className={styles.expiredMeta}>
									{t('subscription.offer.expiredAt', {
										date: formattedEndsAt
									})}
								</p>
							) : null}
						</div>

						<div className={styles.actions}>
							{isWelcomeState ? (
								<Button
									type='button'
									onClick={handleActivateTrial}
									disabled={isActivatingTrial}
									className={styles.primaryButton}
								>
									{isActivatingTrial
										? t('subscription.cta.activatingTrial')
										: t('subscription.cta.startTrial')}
								</Button>
							) : null}

							<Button
								type='button'
								variant={isWelcomeState ? 'secondary' : 'primary'}
								onClick={handlePurchaseClick}
								className={styles.purchaseButton}
							>
								{t('subscription.cta.buy')}
							</Button>
						</div>

						{activationError ? (
							<p className={styles.errorText}>{activationError}</p>
						) : null}
					</article>
				</div>
			</section>
		</Layout>
	)
}

export default SubscriptionPage
