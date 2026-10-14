import { formatDateWat } from '../utils/watDate';

/**
 * Backwards-compatible helper. All dates are rendered in West Africa Time
 * (Africa/Lagos) so the output is identical on every device, regardless of the
 * user's system timezone.
 *
 * @example formatDate('2026-10-11') -> "Oct 11, 2026"
 */
const formatDate = (input, pattern = 'PP') => formatDateWat(input, pattern);

export default formatDate;
