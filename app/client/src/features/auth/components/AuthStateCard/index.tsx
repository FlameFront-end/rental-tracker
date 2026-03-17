import type { ReactNode } from 'react'

import styles from './AuthStateCard.module.scss'

interface AuthStateCardProps {
	actions?: ReactNode
	description: ReactNode
	eyebrow: string
	title: string
}

const AuthStateCard = ({ actions, description, eyebrow, title }: AuthStateCardProps) => {
	return (
		<section className={styles.card}>
			<span className={styles.eyebrow}>{eyebrow}</span>
			<h2 className={styles.title}>{title}</h2>
			<div className={styles.description}>{description}</div>
			{actions ? <div className={styles.actions}>{actions}</div> : null}
		</section>
	)
}

export default AuthStateCard
