import type { PropsWithChildren } from 'react'

import Header from '@/shared/widgets/Header'

import styles from './Layout.module.scss'

interface LayoutProps extends PropsWithChildren {
	title: string
	subtitle?: string
}

const Layout = ({ children }: LayoutProps) => {
	return (
		<div className={styles.shell}>
			<div className={styles.glowPrimary} />
			<div className={styles.glowSecondary} />
			<div className={styles.container}>
				<Header />
				<main className={styles.content}>{children}</main>
			</div>
		</div>
	)
}

export default Layout
