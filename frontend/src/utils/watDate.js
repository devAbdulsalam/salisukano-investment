import { formatInTimeZone } from 'date-fns-tz';

/**
 * Centralised, timezone-safe date handling for the whole app.
 *
 * West Africa Time (WAT) is UTC+1 and, unlike most regions, does not observe
 * daylight saving, so its offset never changes. Every date shown to a user must
 * be rendered in WAT regardless of the device/OS/browser timezone of whoever is
 * looking at the screen.
 *
 * Rules:
 *  - Calendar-only values ("2026-10-11", "11/10/2026", "2026/10/11") describe a
 *    day, not an instant. They are anchored to a fixed UTC instant so that
 *    formatting them in WAT always yields the exact same calendar day.
 *  - Values that already carry timezone information (ISO strings with `Z` or an
 *    offset, Date objects, epoch numbers) describe an instant and are converted
 *    to WAT for display.
 *  - "Naive" datetimes without a timezone ("2026-10-11T13:45") are treated as
 *    WAT wall-clock time.
 */

export const WAT_TIMEZONE = 'Africa/Lagos';

// WAT never changes (no DST), so a fixed offset is safe and deterministic.
const WAT_OFFSET_MS = 60 * 60 * 1000;

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DMY_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const YMD_SLASH_RE = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
const NAIVE_DATETIME_RE =
	/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/;

const pad = (value) => String(value).padStart(2, '0');

/**
 * Convert any accepted date input into a Date instant.
 * Returns null for empty/invalid values so callers can render a fallback.
 */
export function toWatDate(value) {
	if (value === null || value === undefined || value === '') return null;

	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	if (typeof value === 'number') {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? null : date;
	}

	if (typeof value !== 'string') return null;

	const trimmed = value.trim();
	let match;

	if ((match = trimmed.match(DATE_ONLY_RE))) {
		// Anchor to UTC midnight. Formatting in WAT (+1h) keeps the same day on
		// every device, unlike `new Date(y, m, d)` which is device-local.
		return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
	}
	if ((match = trimmed.match(DMY_RE))) {
		return new Date(Date.UTC(+match[3], +match[2] - 1, +match[1]));
	}
	if ((match = trimmed.match(YMD_SLASH_RE))) {
		return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
	}
	if ((match = trimmed.match(NAIVE_DATETIME_RE))) {
		// No timezone supplied: interpret the wall clock as WAT.
		return new Date(
			Date.UTC(
				+match[1],
				+match[2] - 1,
				+match[3],
				+match[4],
				+match[5],
				+(match[6] || 0),
			) - WAT_OFFSET_MS,
		);
	}

	const date = new Date(trimmed);
	return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a date in WAT, e.g. formatDateWat('2026-10-11') -> "Oct 11, 2026". */
export function formatDateWat(value, pattern = 'PP') {
	const date = toWatDate(value);
	if (!date) return '-';
	return formatInTimeZone(date, WAT_TIMEZONE, pattern);
}

/** Format a date + time in WAT. */
export function formatDateTimeWat(value, pattern = 'd MMM yyyy, HH:mm') {
	const date = toWatDate(value);
	if (!date) return '-';
	return formatInTimeZone(date, WAT_TIMEZONE, pattern);
}

/** Format only the month/year in WAT, e.g. "October 2026". */
export function formatMonthYearWat(value, pattern = 'MMMM yyyy') {
	const date = toWatDate(value);
	if (!date) return '-';
	return formatInTimeZone(date, WAT_TIMEZONE, pattern);
}

/** Current date/time in WAT (never the device clock). */
export function nowWat(pattern = 'd MMM yyyy, HH:mm') {
	return formatInTimeZone(new Date(), WAT_TIMEZONE, pattern);
}

/** Today's calendar date in WAT formatted as `yyyy-MM-dd`. */
export function todayInputWat() {
	return formatInTimeZone(new Date(), WAT_TIMEZONE, 'yyyy-MM-dd');
}

/** Value for an `<input type="date">`, guaranteed to be WAT based. */
export function toInputDateWat(value) {
	const date = toWatDate(value);
	if (!date) return '';
	return formatInTimeZone(date, WAT_TIMEZONE, 'yyyy-MM-dd');
}

/** Value for an `<input type="month">` (yyyy-MM), guaranteed WAT based. */
export function toInputMonthWat(value) {
	const date = toWatDate(value);
	if (!date) return '';
	return formatInTimeZone(date, WAT_TIMEZONE, 'yyyy-MM');
}

/** The WAT year and 1-based month for a given value. */
export function getWatMonth(value) {
	const date = toWatDate(value);
	if (!date) return null;
	return {
		year: +formatInTimeZone(date, WAT_TIMEZONE, 'yyyy'),
		month: +formatInTimeZone(date, WAT_TIMEZONE, 'M'),
	};
}

/**
 * First and last-day bounds of the WAT month as `<input type="date">` strings.
 * `max` is the first day of the following month (exclusive range, matching the
 * original behaviour where a payment/supply must fall inside the month).
 */
export function watMonthBoundsInput(value) {
	const parts = getWatMonth(value);
	if (!parts) return { min: '', max: '' };
	const { year, month } = parts;
	const nextYear = month === 12 ? year + 1 : year;
	const nextMonth = month === 12 ? 1 : month + 1;
	return {
		min: `${year}-${pad(month)}-01`,
		max: `${nextYear}-${pad(nextMonth)}-01`,
	};
}

export default formatDateWat;
