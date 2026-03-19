let activeScrollLocks = 0
let savedBodyOverflow = ''
let savedDocumentOverflow = ''

export const lockDocumentScroll = () => {
	const { body, documentElement } = document

	if (activeScrollLocks === 0) {
		savedBodyOverflow = body.style.overflow
		savedDocumentOverflow = documentElement.style.overflow
	}

	activeScrollLocks += 1
	body.style.overflow = 'hidden'
	documentElement.style.overflow = 'hidden'

	return () => {
		activeScrollLocks = Math.max(activeScrollLocks - 1, 0)

		if (activeScrollLocks > 0) {
			return
		}

		body.style.overflow = savedBodyOverflow
		documentElement.style.overflow = savedDocumentOverflow
		savedBodyOverflow = ''
		savedDocumentOverflow = ''
	}
}
