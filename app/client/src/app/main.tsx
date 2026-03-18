import '@/shared/styles/main.scss'

import { createRoot } from 'react-dom/client'

import { App } from './app'

const hideLaunchSplash = () => {
	const splash = document.getElementById('launch-splash')

	if (!splash) {
		return
	}

	splash.classList.add('is-hidden')

	window.setTimeout(() => {
		splash.remove()
	}, 260)
}

createRoot(document.getElementById('root')!).render(<App />)

requestAnimationFrame(() => {
	requestAnimationFrame(() => {
		hideLaunchSplash()
	})
})
