import { Check, Languages, MoonStar, Settings, SunMedium } from 'lucide-react'

import { useMemo, useState } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'

import { useI18n } from '@/app/i18n/use-i18n'
import { useAuthSession } from '@/app/session/use-auth-session'
import { useTelegramHaptics } from '@/app/telegram/use-telegram-haptics'
import { useTheme } from '@/app/theme/theme.context'
import {
	APP_LOCALES,
	APP_LOCALE_LABELS,
	type AppLocale,
	ROUTES
} from '@/shared/model'
import { ScreenSheet } from '@/shared/widgets'

import styles from './Header.module.scss'

const Header = () => {
	const location = useLocation()
	const navigate = useNavigate()
	const { isTelegramEnvironment, profile, status, user } = useAuthSession()
	const { locale, setLocale, t } = useI18n()
	const { theme, toggleTheme } = useTheme()
	const { selectionChanged } = useTelegramHaptics()
	const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false)
	const isWorkspaceRoute =
		status === 'authenticated' && location.pathname !== ROUTES.AUTH
	const isSettingsRoute = location.pathname === ROUTES.SETTINGS
	const displayName =
		profile?.displayName ??
		(isWorkspaceRoute
			? isTelegramEnvironment
				? `ID ${user?.telegramId ?? ''}`
				: t('header.devAccount')
			: t('header.appName'))
	const avatarLabel = profile?.initials ?? (isWorkspaceRoute ? 'TG' : 'RT')
	const languageOptions = useMemo(
		() =>
			APP_LOCALES.map((optionLocale) => ({
				code: optionLocale.toUpperCase(),
				label: APP_LOCALE_LABELS[optionLocale],
				value: optionLocale
			})),
		[]
	)

	const handleSelectLocale = (nextLocale: AppLocale) => {
		if (nextLocale !== locale) {
			selectionChanged()
		}
		setLocale(nextLocale)
		setIsLanguageSheetOpen(false)
	}

	return (
		<>
			<header className={styles.header}>
				<div className={styles.row}>
					<div className={styles.identity}>
						<div className={styles.avatar} aria-hidden='true'>
							{profile?.photoUrl ? (
								<img src={profile.photoUrl} alt='' className={styles.avatarImage} />
							) : (
								<span className={styles.avatarFallback}>{avatarLabel}</span>
							)}
						</div>
						<strong className={styles.name}>{displayName}</strong>
					</div>

					<div className={styles.actions}>
						{isWorkspaceRoute ? (
							<button
								type='button'
								className={styles.control}
								onClick={() => {
									if (!isSettingsRoute) {
										selectionChanged()
										navigate(ROUTES.SETTINGS)
									}
								}}
								aria-label={t('header.openSettings')}
							>
								<Settings size={18} strokeWidth={1.9} aria-hidden='true' />
							</button>
						) : null}
						<button
							type='button'
							className={styles.control}
							onClick={() => setIsLanguageSheetOpen(true)}
							aria-label={`${t('header.switchLanguage')}: ${APP_LOCALE_LABELS[locale]}`}
						>
							<Languages size={18} strokeWidth={1.9} aria-hidden='true' />
						</button>
						<button
							type='button'
							className={styles.control}
							onClick={() => {
								selectionChanged()
								toggleTheme()
							}}
							aria-label={
								theme === 'dark'
									? t('header.switchToLightTheme')
									: t('header.switchToDarkTheme')
							}
						>
							{theme === 'dark' ? (
								<SunMedium size={18} strokeWidth={1.9} aria-hidden='true' />
							) : (
								<MoonStar size={18} strokeWidth={1.9} aria-hidden='true' />
							)}
						</button>
					</div>
				</div>
			</header>

			<ScreenSheet open={isLanguageSheetOpen} onClose={() => setIsLanguageSheetOpen(false)}>
				<div className={styles.languageSheet}>
					<div className={styles.languageHeader}>
						<span className={styles.languageEyebrow}>{t('header.languageEyebrow')}</span>
						<h2 className={styles.languageTitle}>{t('header.languageTitle')}</h2>
					</div>

					<div className={styles.languageList}>
						{languageOptions.map((option) => {
							const isActive = option.value === locale

							return (
								<button
									key={option.value}
									type='button'
									className={`${styles.languageOption} ${isActive ? styles.languageOptionActive : ''}`}
									onClick={() => handleSelectLocale(option.value)}
								>
									<div className={styles.languageOptionCopy}>
										<span className={styles.languageCode}>{option.code}</span>
										<div className={styles.languageMeta}>
											<strong>{option.label}</strong>
											<span>
												{isActive ? t('common.selected') : t('header.tapToSwitchLanguage')}
											</span>
										</div>
									</div>
									<span className={styles.languageCheck}>
										{isActive ? <Check size={18} strokeWidth={2.1} aria-hidden='true' /> : null}
									</span>
								</button>
							)
						})}
					</div>
				</div>
			</ScreenSheet>
		</>
	)
}

export default Header
