import type { CSSProperties } from 'react'

import { NavLink, useLocation } from 'react-router-dom'

import clsx from 'clsx'

import { useI18n } from '@/app/i18n/use-i18n'
import { useTelegramHaptics } from '@/app/telegram/use-telegram-haptics'
import { APP_SECTION_ITEMS } from '@/shared/model'

import styles from './AppNavigation.module.scss'

const AppNavigation = () => {
	const location = useLocation()
	const { t } = useI18n()
	const { selectionChanged } = useTelegramHaptics()
	const activeIndex = Math.max(
		APP_SECTION_ITEMS.findIndex((item) => location.pathname.startsWith(item.to)),
		0
	)

	return (
		<nav
			className={styles.navigation}
			aria-label={t('nav.primary')}
			style={
				{
					'--active-index': activeIndex,
					'--item-count': APP_SECTION_ITEMS.length
				} as CSSProperties
			}
		>
			<span className={styles.indicator} aria-hidden='true' />
			{APP_SECTION_ITEMS.map((item) => (
				<NavLink
					key={item.to}
					to={item.to}
					onClick={() => {
						if (!location.pathname.startsWith(item.to)) {
							selectionChanged()
						}
					}}
					className={({ isActive }) =>
						clsx(styles.link, {
							[styles.active]: isActive
						})
					}
				>
					<span className={styles.label}>{t(item.labelKey)}</span>
				</NavLink>
			))}
		</nav>
	)
}

export default AppNavigation
