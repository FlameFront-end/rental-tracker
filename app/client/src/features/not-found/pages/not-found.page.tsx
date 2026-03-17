import { Link } from 'react-router-dom'

import { ROUTES } from '@/shared/model/routes'
import { FullErrorScreen } from '@/shared/widgets'

import styles from './not-found.module.scss'

const NotFoundPage = () => {
	return (
		<FullErrorScreen
			title='Page Not Found'
			message={
				<span className={styles.message}>
					The requested route does not exist. Go back to the <Link to={ROUTES.DASHBOARD}>dashboard</Link>.
				</span>
			}
		/>
	)
}

export default NotFoundPage
