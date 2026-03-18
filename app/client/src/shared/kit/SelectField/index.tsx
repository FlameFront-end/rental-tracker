import { ChevronDown } from 'lucide-react'

import {
	forwardRef,
	useEffect,
	useId,
	useRef,
	useState,
	type ChangeEvent,
	type FocusEvent,
	type InputHTMLAttributes,
	type Ref
} from 'react'

import clsx from 'clsx'

import { useI18n } from '@/app/i18n/use-i18n'

import styles from './SelectField.module.scss'

interface SelectFieldOption {
	label: string
	value: string
}

interface SelectFieldProps
	extends Omit<
		InputHTMLAttributes<HTMLInputElement>,
		'defaultValue' | 'size' | 'type' | 'value'
	> {
	defaultValue?: string
	error?: string
	hint?: string
	label: string
	options: SelectFieldOption[]
	value?: string
}

const MAX_DROPDOWN_HEIGHT = 224
const MIN_DROPDOWN_HEIGHT = 112
const VIEWPORT_PADDING = 12
const DROPDOWN_GAP = 8

const setRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
	if (typeof ref === 'function') {
		ref(value)
		return
	}

	if (ref) {
		ref.current = value
	}
}

const createChangeEvent = (name: string | undefined, value: string) =>
	({
		target: {
			name,
			value
		},
		currentTarget: {
			name,
			value
		}
	}) as ChangeEvent<HTMLInputElement>

const createBlurEvent = (name: string | undefined, value: string) =>
	({
		target: {
			name,
			value
		},
		currentTarget: {
			name,
			value
		}
	}) as FocusEvent<HTMLInputElement>

const SelectField = forwardRef<HTMLInputElement, SelectFieldProps>(
	(
		{
			className,
			defaultValue,
			disabled = false,
			error,
			hint,
			id,
			label,
			name,
			onBlur,
			onChange,
			options,
			required,
			value
		},
		ref
	) => {
		const { t } = useI18n()
		const helperText = error || hint
		const generatedId = useId()
		const inputId = id ?? `select-field-${generatedId}`
		const helperId = helperText ? `${inputId}-helper` : undefined
		const dropdownId = `${inputId}-dropdown`
		const rootRef = useRef<HTMLDivElement | null>(null)
		const [isOpen, setIsOpen] = useState(false)
		const [dropdownPlacement, setDropdownPlacement] = useState<'bottom' | 'top'>('bottom')
		const [dropdownMaxHeight, setDropdownMaxHeight] = useState(MAX_DROPDOWN_HEIGHT)
		const [internalValue, setInternalValue] = useState(
			defaultValue ?? value ?? options[0]?.value ?? ''
		)

		const selectedValue = value ?? internalValue
		const normalizedValue = options.some((option) => option.value === selectedValue)
			? selectedValue
			: options[0]?.value ?? ''
		const selectedOption =
			options.find((option) => option.value === normalizedValue) ??
			options[0] ??
			null

		useEffect(() => {
			if (!options.length) {
				return
			}

			if (normalizedValue === selectedValue) {
				return
			}

			onChange?.(createChangeEvent(name, normalizedValue))
		}, [name, normalizedValue, onChange, options.length, selectedValue])

		useEffect(() => {
			if (!isOpen) {
				return
			}

			const handlePointerDown = (event: MouseEvent | TouchEvent) => {
				if (!rootRef.current?.contains(event.target as Node)) {
					setIsOpen(false)
				}
			}

			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					setIsOpen(false)
				}
			}

			document.addEventListener('mousedown', handlePointerDown)
			document.addEventListener('touchstart', handlePointerDown)
			document.addEventListener('keydown', handleKeyDown)

			return () => {
				document.removeEventListener('mousedown', handlePointerDown)
				document.removeEventListener('touchstart', handlePointerDown)
				document.removeEventListener('keydown', handleKeyDown)
			}
		}, [isOpen])

		const emitBlur = (nextValue: string) => {
			onBlur?.(createBlurEvent(name, nextValue))
		}

		const handleTriggerClick = () => {
			if (isOpen) {
				setIsOpen(false)
				return
			}

			const controlRect = rootRef.current?.getBoundingClientRect()

			if (controlRect) {
				const availableBelow = window.innerHeight - controlRect.bottom - VIEWPORT_PADDING
				const availableAbove = controlRect.top - VIEWPORT_PADDING
				const estimatedDropdownHeight = Math.min(options.length * 56 + 12, MAX_DROPDOWN_HEIGHT)
				const shouldOpenTop =
					availableBelow < estimatedDropdownHeight && availableAbove > availableBelow
				const nextAvailableSpace = shouldOpenTop ? availableAbove : availableBelow

				setDropdownPlacement(shouldOpenTop ? 'top' : 'bottom')
				setDropdownMaxHeight(
					Math.max(
						MIN_DROPDOWN_HEIGHT,
						Math.min(nextAvailableSpace - DROPDOWN_GAP, MAX_DROPDOWN_HEIGHT)
					)
				)
			}

			setIsOpen(true)
		}

		const handleSelect = (nextValue: string) => {
			if (disabled) {
				return
			}

			if (value === undefined) {
				setInternalValue(nextValue)
			}

			onChange?.(createChangeEvent(name, nextValue))
			emitBlur(nextValue)
			setIsOpen(false)
		}

		return (
			<label className={styles.field} htmlFor={inputId}>
				<span className={styles.label}>{label}</span>

				<div ref={rootRef} className={styles.control}>
					<input
						ref={(node) => {
							setRef(ref, node)
						}}
						id={inputId}
						type='hidden'
						name={name}
						value={normalizedValue}
						required={required}
						disabled={disabled}
					/>

					<button
						type='button'
						className={clsx(
							styles.trigger,
							className,
							isOpen && styles.triggerOpen,
							error && styles.triggerError
						)}
						aria-controls={dropdownId}
						aria-describedby={helperId}
						aria-expanded={isOpen}
						aria-haspopup='listbox'
						aria-invalid={Boolean(error)}
						disabled={disabled}
						onBlur={() => emitBlur(normalizedValue)}
						onClick={handleTriggerClick}
					>
						<span className={styles.value}>{selectedOption?.label ?? t('common.select')}</span>
						<ChevronDown
							size={16}
							strokeWidth={1.9}
							aria-hidden='true'
							className={clsx(styles.chevron, isOpen && styles.chevronOpen)}
						/>
					</button>

					{isOpen ? (
						<div
							className={clsx(
								styles.dropdown,
								dropdownPlacement === 'top' && styles.dropdownTop
							)}
							id={dropdownId}
							role='listbox'
							style={{ maxHeight: `${dropdownMaxHeight}px` }}
						>
							{options.map((option) => {
								const isSelected = option.value === selectedOption?.value

								return (
									<button
										key={option.value}
										type='button'
										role='option'
										aria-selected={isSelected}
										className={clsx(
											styles.option,
											isSelected && styles.optionSelected
										)}
										onClick={() => handleSelect(option.value)}
									>
										<span>{option.label}</span>
										{isSelected ? (
											<span className={styles.optionMark}>{t('common.selected')}</span>
										) : null}
									</button>
								)
							})}
						</div>
					) : null}
				</div>

				{helperText ? (
					<span id={helperId} className={error ? styles.error : styles.hint}>
						{helperText}
					</span>
				) : null}
			</label>
		)
	}
)

SelectField.displayName = 'SelectField'

export default SelectField
