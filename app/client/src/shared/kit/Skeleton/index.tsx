import type { CSSProperties, HTMLAttributes } from 'react'

import clsx from 'clsx'

import styles from './Skeleton.module.scss'

interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
	height?: CSSProperties['height']
	radius?: CSSProperties['borderRadius']
	width?: CSSProperties['width']
}

const Skeleton = ({
	className,
	height,
	radius,
	style,
	width,
	...props
}: SkeletonProps) => {
	return (
		<div
			{...props}
			aria-hidden='true'
			className={clsx(styles.skeleton, className)}
			style={{
				borderRadius: radius,
				height,
				width,
				...style
			}}
		/>
	)
}

export default Skeleton
