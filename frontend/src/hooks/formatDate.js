import moment from 'moment';

import { format } from 'date-fns'; // import { formatPrice } from '../hooks/formatPrice';
import { TZDate } from '@date-fns/tz';

const WAT_TIMEZONE = 'Africa/Lagos';

const formatDate = (input) => {
	let date;
	// console.log('date input', input);
	// Try ISO: 2025-04-15
	// Parse manually to avoid UTC-midnight interpretation which shifts the date
	// depending on the client's local timezone.
	if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
		const [year, month, day] = input.split('-').map(Number);
		date = new Date(year, month - 1, day); // local midnight, timezone-agnostic
	}
	// Handle dd/mm/yyyy format (always day first)
	else if (typeof input === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
		const [day, month, year] = input.split('/').map(Number);
		date = new Date(year, month - 1, day); // local midnight, timezone-agnostic
	}

	// 03/05/2025
	// 15/2025/05
	// 2025/05/15
	else if (typeof input === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(input)) {
		// Parse manually to avoid UTC-midnight interpretation
		const [a, b, c] = input.split('/').map(Number);
		// a is always the 4-digit year in this branch
		const monthFirst = b <= 12;
		const [month, day] = monthFirst ? [b, c] : [c, b];
		date = new Date(a, month - 1, day); // local midnight, timezone-agnostic
	} else {
		date = new Date(input);
	}

	// Convert to West Africa Time
	const zonedDate = new TZDate(date, WAT_TIMEZONE);

	// Format as: Jan 1, 2025
	return moment(zonedDate).format('ll');
	// format(zonedDate, 'MMM d, yyyy');
};

export default formatDate;


