import styles from './Header.module.scss'

interface HeaderProps {
	title: string
	subtitle?: string
}

const Header = ({ title, subtitle }: HeaderProps) => {
	return (
		<header className={styles.header}>
			<h1 className={styles.title}>{title}</h1>
			{subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
		</header>
	)
}

export default Header
