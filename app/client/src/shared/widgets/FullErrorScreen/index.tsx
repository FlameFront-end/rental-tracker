import type { ReactNode } from 'react'

import styles from './FullErrorScreen.module.scss'

interface FullErrorScreenProps {
	title: string
	message: ReactNode
}

export const FullErrorScreen = ({ title, message }: FullErrorScreenProps) => {
	return (
		<section className={styles.wrapper}>
			<h1 className={styles.title}>{title}</h1>
			<div className={styles.message}>{message}</div>
		</section>
	)
}
