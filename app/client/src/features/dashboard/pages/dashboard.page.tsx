import { useHealthCheck } from '@/shared/api/services/health'
import { env } from '@/shared/model'
import { Layout } from '@/shared/widgets'

import styles from './dashboard.module.scss'

const DashboardPage = () => {
	const { data, isLoading, isError, error } = useHealthCheck()

	return (
		<Layout
			title='Rental Tracker'
			subtitle='Foundation step is ready. Client, API wiring, and PostgreSQL-backed server scaffold are in place.'
		>
			<section className={styles.grid}>
				<article className={styles.card}>
					<span className={styles.label}>Frontend</span>
					<h2>React + Vite</h2>
					<p>The client uses the target app/features/shared/types architecture.</p>
				</article>

				<article className={styles.card}>
					<span className={styles.label}>API Base URL</span>
					<h2>{env.API_URL}</h2>
					<p>Configured through Vite env with a local fallback for development.</p>
				</article>

				<article className={styles.card}>
					<span className={styles.label}>Backend Health</span>
					{isLoading ? <h2>Checking...</h2> : null}
					{!isLoading && !isError ? <h2>{data?.status === 'ok' ? 'Connected' : 'Unknown'}</h2> : null}
					{!isLoading && !isError ? (
						<p>
							Database: <strong>{data?.database}</strong>
							<br />
							Environment: <strong>{data?.environment}</strong>
						</p>
					) : null}
					{isError ? <p>{error instanceof Error ? error.message : 'Backend is unavailable.'}</p> : null}
				</article>
			</section>
		</Layout>
	)
}

export default DashboardPage
