import { formatDateWat, formatMonthYearWat } from '../utils/watDate';

/**
 * Backwards-compatible helper. Formats any date in West Africa Time
 * (Africa/Lagos) so the result never depends on the device timezone.
 *
 * @example formatDateString('2026-10-11') -> "Oct 11, 2026"
 */
const formatDateString = (dateStr, pattern = 'PP') =>
	formatDateWat(dateStr, pattern);

export const getMonthAndYear = (dateStr) => formatMonthYearWat(dateStr);

export default formatDateString;
