const parseReceiptText = (text) => {
	const lines = text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	// Parse first line
	const firstLineParts = lines[0].split(' ');
	const dateStr = firstLineParts[0];
	const vehicle = firstLineParts.slice(1).join(' ').replace(':-', '').trim();

	// Parse second line
	const customer = lines[1].split('~')[1].trim();

	// Parse items
	const items = [];
	let i = 2;
	while (i < lines.length && !lines[i].startsWith('TOTAL:')) {
		const line = lines[i];
		// Example: M~19,900kg*809 =N16,099,100
		const match = line.match(/^([MCS])~([\d,]+)kg\*(\d+) =N([\d,]+)$/);
		if (match) {
			const typeMap = {
				M: 'Mix',
				C: 'Cast',
				S: 'Special',
				S: 'Carbody',
			};
			const type = typeMap[match[1]];
			const weight = parseFloat(match[2].replace(/,/g, ''));
			const rate = parseFloat(match[3]);
			const amount = parseFloat(match[4].replace(/,/g, ''));
			items.push({ type, weight, rate, amount });
		}
		i++;
	}

	// Parse total
	const totalLine = lines[i]; // This is the line with TOTAL
	const total = parseFloat(totalLine.split('N')[1].replace(/,/g, ''));

	// Skip the next line which is "Less:-"
	i += 2; // because after total, we have "Less:-" and then the next line is expenses

	// Parse expenses and deposit
	const expensesLine = lines[i];
	const expenses = parseFloat(
		expensesLine.split('~')[0].replace('N', '').replace(/,/g, ''),
	);
	i++;
	const depositLine = lines[i];
	const deposit = parseFloat(
		depositLine.split('~')[0].replace('N', '').replace(/,/g, ''),
	);
	i++;
	// Parse balance
	const balanceLine = lines[i];
	const balance = parseFloat(balanceLine.split('N')[1].replace(/,/g, ''));

	// Construct the object
	const [day, month, year] = dateStr.split('/');
	const date = new Date(`${year}-${month}-${day}`);

	return {
		date,
		vehicle,
		customer,
		items,
		total,
		less: {
			expenses,
			deposit,
		},
		balance,
	};
};

export default parseReceiptText;
