import { Check, MoonStar, SunMedium } from 'lucide-react'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { requestWriteAccess } from '@tma.js/sdk-react'

import { useI18n } from '@/app/i18n/use-i18n'
import { useAuthSession } from '@/app/session/use-auth-session'
import {
	getStoredRemindersWriteAccessStatus,
	hydrateStoredRemindersWriteAccessStatusIfMissing,
	persistRemindersWriteAccessStatus
} from '@/app/telegram/app-storage'
import { useTelegramBackButton } from '@/app/telegram/telegram-back-button'
import { useTelegramHaptics } from '@/app/telegram/use-telegram-haptics'
import { useToast } from '@/app/toast/use-toast'
import { useTheme, type AppTheme } from '@/app/theme/theme.context'
import {
	useNotificationsPreferencesQuery,
	useNotificationsStatusQuery,
	useUpdateNotificationsPreferencesMutation
} from '@/shared/api/services/notifications'
import { Button, Skeleton } from '@/shared/kit'
import { getApiErrorMessage } from '@/shared/lib'
import {
	APP_LOCALE_CODES,
	APP_LOCALES,
	APP_LOCALE_LABELS,
	type AppLocale,
	ROUTES
} from '@/shared/model'
import { Layout } from '@/shared/widgets'

import styles from './settings.module.scss'

const SettingsPage = () => {
	const navigate = useNavigate()
	const { locale, setLocale, t } = useI18n()
	const { isTelegramEnvironment } = useAuthSession()
	const { theme, setTheme } = useTheme()
	const { error: hapticError, selectionChanged, success } = useTelegramHaptics()
	const toast = useToast()
	const { data: notificationsStatus, isLoading: isNotificationsStatusLoading } =
		useNotificationsStatusQuery()
	const {
		data: notificationsPreferences,
		isLoading: isNotificationsPreferencesLoading
	} = useNotificationsPreferencesQuery()
	const updateNotificationsPreferences = useUpdateNotificationsPreferencesMutation()
	const [remindersError, setRemindersError] = useState<string | null>(null)
	const [remindersWriteAccessStatus, setRemindersWriteAccessStatus] = useState(() =>
		getStoredRemindersWriteAccessStatus()
	)
	const [isRequestingWriteAccess, setIsRequestingWriteAccess] = useState(false)

	const languageOptions = useMemo(
		() =>
			APP_LOCALES.map((optionLocale) => ({
				code: APP_LOCALE_CODES[optionLocale],
				label: APP_LOCALE_LABELS[optionLocale],
				value: optionLocale
			})),
		[]
	)
	const themeOptions = useMemo(
		() => [
			{
				description: t('settings.themeLightDescription'),
				icon: SunMedium,
				label: t('settings.themeLight'),
				value: 'light' as const
			},
			{
				description: t('settings.themeDarkDescription'),
				icon: MoonStar,
				label: t('settings.themeDark'),
				value: 'dark' as const
			}
		],
		[t]
	)

	useTelegramBackButton(true, () => {
		navigate(ROUTES.DASHBOARD)
	})

	useEffect(() => {
		void hydrateStoredRemindersWriteAccessStatusIfMissing((status) => {
			setRemindersWriteAccessStatus((currentStatus) => currentStatus ?? status)
		})
	}, [])

	const canRequestWriteAccess = useMemo(() => {
		if (!isTelegramEnvironment) {
			return false
		}

		try {
			return requestWriteAccess.isAvailable()
		} catch {
			return false
		}
	}, [isTelegramEnvironment])

	const isRemindersInfrastructureReady = Boolean(
		notificationsStatus?.botConfigured && notificationsStatus?.schedulerEnabled
	)
	const isRemindersWriteAccessAllowed = remindersWriteAccessStatus === 'allowed'
	const remindersHint = !isTelegramEnvironment
		? t('settings.notificationsTelegramOnly')
		: !isRemindersInfrastructureReady
			? t('settings.notificationsUnavailable')
		: !isRemindersWriteAccessAllowed && remindersWriteAccessStatus
				? t('settings.notificationsEnableHint')
				: null

	const handleSelectLocale = useCallback(
		(nextLocale: AppLocale) => {
			if (nextLocale === locale) {
				return
			}

			selectionChanged()
			setLocale(nextLocale)
		},
		[locale, selectionChanged, setLocale]
	)

	const handleSelectTheme = useCallback(
		(nextTheme: AppTheme) => {
			if (nextTheme === theme) {
				return
			}

			selectionChanged()
			setTheme(nextTheme)
		},
		[selectionChanged, setTheme, theme]
	)

	const handleEnableReminders = useCallback(async () => {
		if (!canRequestWriteAccess || !isRemindersInfrastructureReady) {
			return
		}

		setRemindersError(null)
		setIsRequestingWriteAccess(true)

		try {
			const nextStatus = await requestWriteAccess()

			persistRemindersWriteAccessStatus(nextStatus)
			setRemindersWriteAccessStatus(nextStatus)

			if (nextStatus === 'allowed') {
				success()
				toast.success(t('settings.toastRemindersEnabled'))
				return
			}

			const message = t('dashboard.remindersAccessDeclined')
			setRemindersError(message)
			toast.info(message)
		} catch (requestError) {
			hapticError()
			const message = getApiErrorMessage(
				requestError,
				t('dashboard.remindersRequestFailed')
			)
			setRemindersError(message)
			toast.error(message)
		} finally {
			setIsRequestingWriteAccess(false)
		}
	}, [
		canRequestWriteAccess,
		hapticError,
		isRemindersInfrastructureReady,
		success,
		t,
		toast
	])

	const handleTogglePreference = useCallback(
		async (field: 'reminderTodayEnabled' | 'reminderTomorrowEnabled', value: boolean) => {
			setRemindersError(null)

			try {
				await updateNotificationsPreferences.mutateAsync({
					[field]: value
				})
				success()
				toast.success(t('settings.toastNotificationsSaved'))
			} catch (updateError) {
				hapticError()
				const message = getApiErrorMessage(
					updateError,
					t('settings.notificationsSaveFailed')
				)
				setRemindersError(message)
				toast.error(message)
			}
		},
		[hapticError, success, t, toast, updateNotificationsPreferences]
	)

	return (
		<Layout title={t('settings.title')} subtitle={t('settings.subtitle')}>
			<div className={styles.page}>
				<section className={styles.sectionCard}>
					<div className={styles.sectionHeader}>
						<span className={styles.eyebrow}>{t('settings.notificationsEyebrow')}</span>
						<h2 className={styles.sectionTitle}>{t('settings.notificationsTitle')}</h2>
						<p className={styles.sectionDescription}>
							{t('settings.notificationsDescription')}
						</p>
					</div>

					{remindersHint ? <p className={styles.hint}>{remindersHint}</p> : null}
					{remindersError ? <p className={styles.error}>{remindersError}</p> : null}

					{canRequestWriteAccess && !isRemindersWriteAccessAllowed ? (
						<div className={styles.primaryAction}>
							<Button
								type='button'
								onClick={handleEnableReminders}
								disabled={
									isRequestingWriteAccess ||
									isNotificationsStatusLoading ||
									!isRemindersInfrastructureReady
								}
							>
								{isRequestingWriteAccess
									? t('dashboard.remindersRequesting')
									: t('dashboard.remindersEnableAction')}
							</Button>
						</div>
					) : null}

					<div className={styles.preferencesList}>
						{isNotificationsPreferencesLoading || !notificationsPreferences ? (
							<>
								<div className={styles.preferenceSkeleton}>
									<Skeleton className={styles.preferenceTitleSkeleton} />
									<Skeleton className={styles.preferenceCopySkeleton} />
								</div>
								<div className={styles.preferenceSkeleton}>
									<Skeleton className={styles.preferenceTitleSkeleton} />
									<Skeleton className={styles.preferenceCopySkeleton} />
								</div>
							</>
						) : (
							<>
								<label className={styles.preferenceRow}>
									<div className={styles.preferenceCopy}>
										<strong>{t('settings.notifyToday')}</strong>
										<span>{t('settings.notifyTodayDescription')}</span>
									</div>
									<input
										type='checkbox'
										className={styles.preferenceInput}
										checked={notificationsPreferences.reminderTodayEnabled}
										disabled={updateNotificationsPreferences.isPending}
										onChange={(event) => {
											void handleTogglePreference(
												'reminderTodayEnabled',
												event.target.checked
											)
										}}
									/>
									<span className={styles.preferenceToggle} aria-hidden='true' />
								</label>

								<label className={styles.preferenceRow}>
									<div className={styles.preferenceCopy}>
										<strong>{t('settings.notifyTomorrow')}</strong>
										<span>{t('settings.notifyTomorrowDescription')}</span>
									</div>
									<input
										type='checkbox'
										className={styles.preferenceInput}
										checked={notificationsPreferences.reminderTomorrowEnabled}
										disabled={updateNotificationsPreferences.isPending}
										onChange={(event) => {
											void handleTogglePreference(
												'reminderTomorrowEnabled',
												event.target.checked
											)
										}}
									/>
									<span className={styles.preferenceToggle} aria-hidden='true' />
								</label>
							</>
						)}
					</div>
				</section>

				<section className={styles.sectionCard}>
					<div className={styles.sectionHeader}>
						<span className={styles.eyebrow}>{t('settings.languageEyebrow')}</span>
						<h2 className={styles.sectionTitle}>{t('settings.languageTitle')}</h2>
						<p className={styles.sectionDescription}>
							{t('settings.languageDescription')}
						</p>
					</div>

					<div className={styles.optionList}>
						{languageOptions.map((option) => {
							const isActive = option.value === locale

							return (
								<button
									key={option.value}
									type='button'
									className={`${styles.optionCard} ${isActive ? styles.optionCardActive : ''}`}
									onClick={() => handleSelectLocale(option.value)}
									aria-pressed={isActive}
								>
									<div className={styles.optionLead}>
										<span className={styles.optionCode}>{option.code}</span>
										<div className={styles.optionCopy}>
											<strong>{option.label}</strong>
										</div>
									</div>
									<span className={styles.optionCheck} aria-hidden='true'>
										{isActive ? <Check size={18} strokeWidth={2.1} /> : null}
									</span>
								</button>
							)
						})}
					</div>
				</section>

				<section className={styles.sectionCard}>
					<div className={styles.sectionHeader}>
						<span className={styles.eyebrow}>{t('settings.themeEyebrow')}</span>
						<h2 className={styles.sectionTitle}>{t('settings.themeTitle')}</h2>
						<p className={styles.sectionDescription}>
							{t('settings.themeDescription')}
						</p>
					</div>

					<div className={styles.optionList}>
						{themeOptions.map((option) => {
							const isActive = option.value === theme
							const Icon = option.icon

							return (
								<button
									key={option.value}
									type='button'
									className={`${styles.optionCard} ${isActive ? styles.optionCardActive : ''}`}
									onClick={() => handleSelectTheme(option.value)}
									aria-pressed={isActive}
								>
									<div className={styles.optionLead}>
										<span className={styles.optionIcon} aria-hidden='true'>
											<Icon size={18} strokeWidth={1.9} />
										</span>
										<div className={styles.optionCopy}>
											<strong>{option.label}</strong>
											<span>{option.description}</span>
										</div>
									</div>
									<span className={styles.optionCheck} aria-hidden='true'>
										{isActive ? <Check size={18} strokeWidth={2.1} /> : null}
									</span>
								</button>
							)
						})}
					</div>
				</section>
			</div>
		</Layout>
	)
}

export default SettingsPage
