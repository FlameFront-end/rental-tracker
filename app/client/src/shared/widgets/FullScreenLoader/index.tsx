import styles from './FullScreenLoader.module.scss'

export const FullScreenLoader = () => {
	return (
		<div className={styles.wrapper} aria-label='Loading' role='status'>
			<div className={styles.spinner} aria-hidden='true' />
		</div>
	)
}
