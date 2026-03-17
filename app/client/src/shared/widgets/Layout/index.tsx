import type { PropsWithChildren } from 'react'

import Header from '@/shared/widgets/Header'

import styles from './Layout.module.scss'

interface LayoutProps extends PropsWithChildren {
	title: string
	subtitle?: string
}

const Layout = ({ title, subtitle, children }: LayoutProps) => {
	return (
		<div className={styles.shell}>
			<div className={styles.container}>
				<Header title={title} subtitle={subtitle} />
				<main>{children}</main>
			</div>
		</div>
	)
}

export default Layout
