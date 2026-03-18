import { NavLink } from 'react-router-dom'

import clsx from 'clsx'

import { useI18n } from '@/app/i18n/use-i18n'

import styles from './SectionTabs.module.scss'

interface SectionTabItem {
	label: string
	to: string
}

interface SectionTabsProps {
	items: SectionTabItem[]
}

const SectionTabs = ({ items }: SectionTabsProps) => {
	const { t } = useI18n()

	return (
		<nav className={styles.tabs} aria-label={t('nav.primary')}>
			{items.map((item) => (
				<NavLink
					key={item.to}
					to={item.to}
					className={({ isActive }) =>
						clsx(styles.tab, {
							[styles.active]: isActive
						})
					}
				>
					{item.label}
				</NavLink>
			))}
		</nav>
	)
}

export default SectionTabs
