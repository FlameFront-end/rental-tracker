import { CalendarDays } from 'lucide-react'

import {
	useEffect,
	useId,
	useMemo,
	useState
} from 'react'

import {
	WheelPicker,
	WheelPickerWrapper,
	type WheelPickerOption
} from '@ncdai/react-wheel-picker'
import clsx from 'clsx'
import dayjs, { type Dayjs } from 'dayjs'

import { useI18n } from '@/app/i18n/use-i18n'
import { useTelegramHaptics } from '@/app/telegram/use-telegram-haptics'
import { getIntlLocale, getTodayDateOnly } from '@/shared/lib'
import { ScreenSheet } from '@/shared/widgets'

import styles from './DateField.module.scss'

interface DateFieldProps {
	disabled?: boolean
	error?: string
	hint?: string
	id?: string
	label: string
	max?: string
	min?: string
	onBlur?: () => void
	onChange?: (value: string) => void
	placeholder?: string
	required?: boolean
	value?: string
}

const DATE_ONLY_FORMAT = 'YYYY-MM-DD'
const PICKER_ITEM_HEIGHT = 44
const PICKER_VISIBLE_COUNT = 16
const YEAR_OFFSET_RANGE = 6

const capitalizeFirstLetter = (value: string) =>
	value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value

const normalizeDateValue = (value?: string) => {
	if (!value) {
		return ''
	}

	const normalizedValue = dayjs(value)

	return normalizedValue.isValid() && normalizedValue.format(DATE_ONLY_FORMAT) === value ? value : ''
}

const createDate = (year: number, month: number, day: number) =>
	dayjs(new Date(year, month, day)).startOf('day')

const clampDate = (date: Dayjs, min?: string, max?: string) => {
	let nextDate = date.startOf('day')

	if (min && nextDate.isBefore(dayjs(min), 'day')) {
		nextDate = dayjs(min)
	}

	if (max && nextDate.isAfter(dayjs(max), 'day')) {
		nextDate = dayjs(max)
	}

	return nextDate
}

const getPickerBaseDate = (value?: string, min?: string, max?: string) =>
	clampDate(normalizeDateValue(value) ? dayjs(value) : dayjs(), min, max)

const buildDateFromParts = (
	currentDate: Dayjs,
	parts: Partial<Record<'day' | 'month' | 'year', number>>,
	min?: string,
	max?: string
) => {
	const year = parts.year ?? currentDate.year()
	const month = parts.month ?? currentDate.month()
	const maxDayInMonth = createDate(year, month, 1).daysInMonth()
	const day = Math.min(parts.day ?? currentDate.date(), maxDayInMonth)

	return clampDate(createDate(year, month, day), min, max)
}

const DateField = ({
	disabled = false,
	error,
	hint,
	id,
	label,
	max,
	min,
	onBlur,
	onChange,
	placeholder,
	required = false,
	value
}: DateFieldProps) => {
	const { locale, t } = useI18n()
	const { selectionChanged } = useTelegramHaptics()
	const generatedId = useId()
	const fieldId = id ?? `date-field-${generatedId}`
	const labelId = `${fieldId}-label`
	const helperText = error || hint
	const helperId = helperText ? `${fieldId}-helper` : undefined
	const normalizedValue = normalizeDateValue(value)
	const normalizedMin = normalizeDateValue(min)
	const normalizedMax = normalizeDateValue(max)
	const [isPickerOpen, setIsPickerOpen] = useState(false)
	const [draftDate, setDraftDate] = useState(
		getPickerBaseDate(normalizedValue, normalizedMin, normalizedMax)
	)
	const selectedDate = normalizedValue ? dayjs(normalizedValue) : null
	const todayDate = getTodayDateOnly()
	const helperLabel = placeholder ?? t('common.select')
	const displayFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(getIntlLocale(locale), {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric'
			}),
		[locale]
	)
	const displayValue = selectedDate ? displayFormatter.format(selectedDate.toDate()) : helperLabel
	const pickerPreviewFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(getIntlLocale(locale), {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			}),
		[locale]
	)
	const monthFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(getIntlLocale(locale), {
				month: 'short'
			}),
		[locale]
	)
	const pickerPreviewValue = pickerPreviewFormatter.format(draftDate.toDate())
	const dayOptions = useMemo(
		() =>
			Array.from({ length: draftDate.daysInMonth() }, (_, index) => ({
				label: String(index + 1).padStart(2, '0'),
				value: index + 1
			})) satisfies WheelPickerOption<number>[],
		[draftDate]
	)
	const monthOptions = useMemo(
		() =>
			Array.from({ length: 12 }, (_, index) => ({
				label: capitalizeFirstLetter(
					monthFormatter.format(new Date(draftDate.year(), index, 1)).replace(/\./g, '')
				),
				value: index
			})) satisfies WheelPickerOption<number>[],
		[draftDate, monthFormatter]
	)
	const yearOptions = useMemo(() => {
		const minimumYear = normalizedMin
			? dayjs(normalizedMin).year()
			: draftDate.year() - YEAR_OFFSET_RANGE
		const maximumYear = normalizedMax
			? dayjs(normalizedMax).year()
			: draftDate.year() + YEAR_OFFSET_RANGE
		const rangeStart = Math.min(minimumYear, draftDate.year() - YEAR_OFFSET_RANGE)
		const rangeEnd = Math.max(maximumYear, draftDate.year() + YEAR_OFFSET_RANGE)

		return Array.from({ length: rangeEnd - rangeStart + 1 }, (_, index) => ({
			label: String(rangeStart + index),
			value: rangeStart + index
		})) satisfies WheelPickerOption<number>[]
	}, [draftDate, normalizedMax, normalizedMin])
	const isTodayDisabled =
		(normalizedMin && todayDate < normalizedMin) || (normalizedMax && todayDate > normalizedMax)
	const wheelClassNames = useMemo(
		() => ({
			optionItem: styles.wheelOption,
			highlightWrapper: styles.wheelHighlightWrapper,
			highlightItem: styles.wheelHighlightItem
		}),
		[]
	)

	useEffect(() => {
		if (isPickerOpen) {
			setDraftDate(getPickerBaseDate(normalizedValue, normalizedMin, normalizedMax))
		}
	}, [isPickerOpen, normalizedMax, normalizedMin, normalizedValue])

	const updateDraftPart = (part: 'day' | 'month' | 'year', nextValue: number) => {
		selectionChanged()
		setDraftDate((currentDate) =>
			buildDateFromParts(currentDate, { [part]: nextValue }, normalizedMin, normalizedMax)
		)
	}

	const openPicker = () => {
		if (disabled) {
			return
		}

		setDraftDate(getPickerBaseDate(normalizedValue, normalizedMin, normalizedMax))
		setIsPickerOpen(true)
	}

	const closePicker = () => {
		setIsPickerOpen(false)
		onBlur?.()
	}

	const handleSave = () => {
		const nextValue = draftDate.format(DATE_ONLY_FORMAT)

		if (nextValue !== normalizedValue) {
			selectionChanged()
		}

		onChange?.(nextValue)
		setIsPickerOpen(false)
		onBlur?.()
	}

	const handleToday = () => {
		if (isTodayDisabled) {
			return
		}

		selectionChanged()
		setDraftDate(dayjs(todayDate))
	}

	const handleClear = () => {
		if (required) {
			return
		}

		if (normalizedValue) {
			selectionChanged()
		}

		onChange?.('')
		setIsPickerOpen(false)
		onBlur?.()
	}

	return (
		<div className={styles.field}>
			<span id={labelId} className={styles.label}>
				{label}
			</span>

			<div className={styles.control}>
				<button
					type='button'
					className={clsx(styles.trigger, isPickerOpen && styles.triggerOpen, error && styles.triggerError)}
					aria-describedby={helperId}
					aria-expanded={isPickerOpen}
					aria-haspopup='dialog'
					aria-invalid={Boolean(error)}
					aria-labelledby={labelId}
					disabled={disabled}
					onClick={openPicker}
				>
					<span className={clsx(styles.value, !selectedDate && styles.valuePlaceholder)}>
						{displayValue}
					</span>
					<span className={styles.icon} aria-hidden='true'>
						<CalendarDays size={18} strokeWidth={1.9} />
					</span>
				</button>
			</div>

			{helperText ? (
				<span id={helperId} className={error ? styles.error : styles.hint}>
					{helperText}
				</span>
			) : null}

			<ScreenSheet open={isPickerOpen} onClose={closePicker} showCloseButton={false}>
				<div className={styles.sheetContent}>
					<div className={styles.sheetTopBar}>
						<button type='button' className={styles.sheetAction} onClick={closePicker}>
							{t('common.cancel')}
						</button>
						<div className={styles.sheetSummary}>
							<span className={styles.sheetEyebrow}>{label}</span>
							<strong className={styles.sheetValue}>{pickerPreviewValue}</strong>
						</div>
						<button
							type='button'
							className={clsx(styles.sheetAction, styles.sheetActionPrimary)}
							onClick={handleSave}
						>
							{t('common.done')}
						</button>
					</div>

					<div className={styles.pickerCard}>
						<WheelPickerWrapper className={styles.pickerWheels}>
							<div className={styles.wheelColumn}>
								<span className={styles.wheelLabel}>{t('common.day')}</span>
								<div className={styles.wheelPickerSurface}>
									<WheelPicker
										options={dayOptions}
										value={draftDate.date()}
										onValueChange={(nextDay) => updateDraftPart('day', nextDay)}
										visibleCount={PICKER_VISIBLE_COUNT}
										optionItemHeight={PICKER_ITEM_HEIGHT}
										scrollSensitivity={5}
										dragSensitivity={4}
										classNames={wheelClassNames}
									/>
								</div>
							</div>
							<div className={styles.wheelColumn}>
								<span className={styles.wheelLabel}>{t('common.month')}</span>
								<div className={styles.wheelPickerSurface}>
									<WheelPicker
										options={monthOptions}
										value={draftDate.month()}
										onValueChange={(nextMonth) => updateDraftPart('month', nextMonth)}
										visibleCount={PICKER_VISIBLE_COUNT}
										optionItemHeight={PICKER_ITEM_HEIGHT}
										scrollSensitivity={5}
										dragSensitivity={4}
										classNames={wheelClassNames}
									/>
								</div>
							</div>
							<div className={styles.wheelColumn}>
								<span className={styles.wheelLabel}>{t('common.year')}</span>
								<div className={styles.wheelPickerSurface}>
									<WheelPicker
										options={yearOptions}
										value={draftDate.year()}
										onValueChange={(nextYear) => updateDraftPart('year', nextYear)}
										visibleCount={PICKER_VISIBLE_COUNT}
										optionItemHeight={PICKER_ITEM_HEIGHT}
										scrollSensitivity={5}
										dragSensitivity={4}
										classNames={wheelClassNames}
									/>
								</div>
							</div>
						</WheelPickerWrapper>
					</div>

					<div className={styles.sheetFooter}>
						<button
							type='button'
							className={styles.footerAction}
							disabled={Boolean(isTodayDisabled)}
							onClick={handleToday}
						>
							{t('common.today')}
						</button>
						{required ? null : (
							<button
								type='button'
								className={styles.footerAction}
								disabled={!normalizedValue}
								onClick={handleClear}
							>
								{t('common.clear')}
							</button>
						)}
					</div>
				</div>
			</ScreenSheet>
		</div>
	)
}

export default DateField
