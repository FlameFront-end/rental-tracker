import { Check, Languages, LogOut, MoonStar, SunMedium } from 'lucide-react'

import { useMemo, useState } from 'react'

import { useLocation } from 'react-router-dom'

import { useI18n } from '@/app/i18n/use-i18n'
import { useAuthSession } from '@/app/session/use-auth-session'
import { useTheme } from '@/app/theme/theme.context'
import {
	APP_LOCALES,
	APP_LOCALE_LABELS,
	type AppLocale,
	ROUTES
} from '@/shared/model'
import { ScreenSheet } from '@/shared/widgets'

import styles from './Header.module.scss'

interface HeaderProps {
	title: string
	subtitle?: string
}

const Header = ({ title, subtitle }: HeaderProps) => {
	const location = useLocation()
	const { logout, status } = useAuthSession()
	const { locale, setLocale, t } = useI18n()
	const { theme, toggleTheme } = useTheme()
	const [isLanguageSheetOpen, setIsLanguageSheetOpen] = useState(false)
	const showSessionControls =
		status === 'authenticated' && location.pathname !== ROUTES.AUTH
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
		setLocale(nextLocale)
		setIsLanguageSheetOpen(false)
	}

	return (
		<>
			<header className={styles.header}>
				<div className={styles.row}>
					<div className={styles.heading}>
						<span className={styles.appLabel}>{t('header.appName')}</span>
						<h1 className={styles.title}>{title}</h1>
						{subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
					</div>

					<div className={styles.actions}>
						<button
							type='button'
							className={styles.control}
							onClick={() => setIsLanguageSheetOpen(true)}
							aria-label={`${t('header.switchLanguage')}: ${APP_LOCALE_LABELS[locale]}`}
							title={`${t('header.switchLanguage')}: ${APP_LOCALE_LABELS[locale]}`}
						>
							<Languages size={18} strokeWidth={1.9} aria-hidden='true' />
						</button>
						<button
							type='button'
							className={styles.control}
							onClick={toggleTheme}
							aria-label={
								theme === 'dark'
									? t('header.switchToLightTheme')
									: t('header.switchToDarkTheme')
							}
							title={
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
						{showSessionControls ? (
							<button
								type='button'
								className={styles.control}
								onClick={logout}
								aria-label={t('header.logout')}
								title={t('header.logout')}
							>
								<LogOut size={18} strokeWidth={1.9} aria-hidden='true' />
							</button>
						) : null}
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
