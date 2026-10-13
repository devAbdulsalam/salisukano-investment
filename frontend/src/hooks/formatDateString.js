// Parse a date string safely, avoiding UTC-midnight shift by using
// the multi-argument Date constructor (always local midnight).
const parseDateSafe = (dateStr) => {
	if (!dateStr) return new Date(dateStr);
	// ISO YYYY-MM-DD
	if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
		const [y, m, d] = dateStr.split('-').map(Number);
		return new Date(y, m - 1, d);
	}
	// dd/MM/yyyy
	if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
		const [d, m, y] = dateStr.split('/').map(Number);
		return new Date(y, m - 1, d);
	}
	// yyyy/MM/dd
	if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
		const [y, m, d] = dateStr.split('/').map(Number);
		return new Date(y, m - 1, d);
	}
	// Fallback: full ISO datetime strings (include time zone info) are fine
	return new Date(dateStr);
};

const formatDateString = (dateStr) => {
	const date = parseDateSafe(dateStr);
	const options = { month: 'short', day: 'numeric', year: 'numeric' };
	return date.toLocaleDateString('en-NG', options);
};

export const getMonthAndYear = (dateStr) => {
	try {
		// Create a Date object from the invoice date
		const dateObj = parseDateSafe(dateStr);

		// Validate the date
		if (isNaN(dateObj)) {
			throw new Error('Invalid date format');
		}

		// Format to show only month and year in 'en-NG' locale
		const formattedDate = dateObj.toLocaleDateString('en-NG', {
			month: 'long', // Full month name (e.g., December)
			year: 'numeric', // Full year (e.g., 2025)
		});

		console.log(formattedDate); // Output: "December 2025"
	} catch (error) {
		console.error('Error formatting date:', error.message);
	}
};

export default formatDateString;
