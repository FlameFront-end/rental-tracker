import { forwardRef, type InputHTMLAttributes } from 'react'

import clsx from 'clsx'

import styles from './TextField.module.scss'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	error?: string
	hint?: string
	label: string
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
	({ className, error, hint, id, label, ...props }, ref) => {
		const helperText = error || hint

		return (
			<label className={styles.field} htmlFor={id}>
				<span className={styles.label}>{label}</span>
				<input
					ref={ref}
					id={id}
					className={clsx(styles.input, className)}
					aria-invalid={Boolean(error)}
					{...props}
				/>
				{helperText ? (
					<span className={error ? styles.error : styles.hint}>{helperText}</span>
				) : null}
			</label>
		)
	}
)

TextField.displayName = 'TextField'

export default TextField
