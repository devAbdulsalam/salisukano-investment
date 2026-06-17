export const getEffectivePeriod = (date) => {
	const d = new Date(date);

	let month = d.getMonth() + 1;
	let year = d.getFullYear();

	if (d.getDate() >= 15) {
		month++;

		if (month > 12) {
			month = 1;
			year++;
		}
	}

	return { month, year };
};

export const getMonthName = (month) => {
	return [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	][month - 1];
};
