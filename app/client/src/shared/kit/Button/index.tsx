import {
	forwardRef,
	type ButtonHTMLAttributes,
	type PropsWithChildren
} from 'react'

import clsx from 'clsx'

import styles from './Button.module.scss'

interface ButtonProps
	extends PropsWithChildren,
		ButtonHTMLAttributes<HTMLButtonElement> {
	size?: 'sm' | 'md'
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ children, className, size = 'md', variant = 'primary', ...props }, ref) => {
		return (
			<button
				ref={ref}
				className={clsx(styles.button, styles[variant], styles[size], className)}
				{...props}
			>
				{children}
			</button>
		)
	}
)

Button.displayName = 'Button'

export default Button
