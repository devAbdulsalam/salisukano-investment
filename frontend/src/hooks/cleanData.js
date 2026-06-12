import { getRandomRGBColor } from './getRandomColor';
export function cleanData(data) {
	// Extract unique dates and categories
	const uniqueDates = [...new Set(data.map((item) => item.date))];
	const uniqueCategories = [...new Set(data.map((item) => item.category))];

	// Create labels array
	const labels = uniqueDates;

	// Create datasets array
	const datasets = uniqueCategories.map((category) => {
		const dataPoints = uniqueDates.map((date) => {
			const matchingItem = data.find(
				(item) => item.date === date && item.category === category,
			);
			return matchingItem ? matchingItem.totalSales : 0;
		});
		const color = getRandomRGBColor();
		return {
			label: category,
			name: category,
			data: dataPoints,
			backgroundColor: `rgba(${color}, 0.2)`,
			borderColor: `rgb(${color})`,
			borderWidth: 1,
		};
	});

	return {
		labels: labels,
		datasets: datasets,
	};
}
export function cleanSuppliesData(data) {
	// Extract unique dates and categories
	const uniqueDates = [...new Set(data.map((item) => item.date))];
	const uniqueItems = [...new Set(data.map((item) => item.name))];

	// Create labels array
	const labels = uniqueDates;

	// Create datasets array
	const datasets = uniqueItems.map((name) => {
		const dataPoints = uniqueDates.map((date) => {
			const matchingItem = data.find(
				(item) => item.date === date && item.name === name,
			);
			return matchingItem ? matchingItem.totalCost : 0;
		});
		const color = getRandomRGBColor();
		return {
			label: name,
			name: name,
			data: dataPoints,
			backgroundColor: `rgba(${color}, 0.2)`,
			borderColor: `rgb(${color})`,
			borderWidth: 1,
		};
	});

	return {
		labels: labels,
		datasets: datasets,
	};
}
export const cleanSumarryData = (data) => {
	if (data.length > 0) {
		const labels = data.map((item) => item.category);
		const datasets = [
			{
				label: 'Cost',
				data: data.map((item) => item.cost),
				backgroundColor: `rgba(${getRandomRGBColor()}, 0.2)`,
				borderColor: `rgb(${getRandomRGBColor()})`,
			},
			{
				label: 'Expense',
				data: data.map((item) => item.totalExpense),
				backgroundColor: `rgba(${getRandomRGBColor()}, 0.2)`,
				borderColor: `rgb(${getRandomRGBColor()})`,
			},
			{
				label: 'Total',
				data: data.map((item) => item.totalCost),
				backgroundColor: `rgba(${getRandomRGBColor()}, 0.2)`,
				borderColor: `rgb(${getRandomRGBColor()})`,
			},
		];
		// const datasets = data.map((item) => {

		// 	return (data = {
		// 		label: item.category,
		// 		data: [item.cost, item.totalExpense, item.totalCost],
		// 		backgroundColor: `rgba(${color}, 0.2)`,
		// 		borderColor: `rgb(${color})`,
		// 		borderWidth: 1,
		// 	});
		// });

		return { labels, datasets };
	}
};
export const cleanTransactionsData = (data) => {
	if (data.length > 0) {
		const labels = data.map((item) => item.createdAt);
		const datasets = [
			{
				label: 'amount',
				data: data.map((item) => item.amount),
			},
		];

		return { labels, datasets };
	}
};

export const cleanTableData = (transactions) => {
	return transactions?.map((transaction, index) => {
		// Assuming materials contain 'mix', 'cast', and 'special' in different objects.
		const mixMaterial =
			transaction.materials?.find((material) => material.product === 'mix') ||
			{};
		const castMaterial =
			transaction.materials?.find((material) => material.product === 'cast') ||
			{};
		const specialMaterial =
			transaction.materials?.find(
				(material) => material.product === 'special',
			) || {};
		const bundleMaterial =
			transaction.materials?.find(
				(material) => material.product === 'bundle',
			) || {};

		return {
			_id: transaction._id,
			sn: index + 1,
			date: new Date(
				transaction.date || transaction.createdAt,
			).toLocaleDateString(), // Format date
			name: transaction.name || '-',
			vehicleNumber: transaction.vehicleNumber || '-',
			mixQuantity: mixMaterial.qty || '-', // Mix data
			mixPrice: mixMaterial.rate || '-',
			mixTotal: mixMaterial.cost || '-',
			castQuantity: castMaterial.qty || '-', // Cast data
			castPrice: castMaterial.rate || '-',
			castTotal: castMaterial.cost || '-',
			specialQuantity: specialMaterial.qty || '-', // Special data
			specialPrice: specialMaterial.rate || '-',
			specialTotal: specialMaterial.cost || '-',
			bundleQuantity: bundleMaterial.qty || '-', // bundle data
			bundlePrice: bundleMaterial.rate || '-',
			bundleTotal: bundleMaterial.cost || '-',
			credit: transaction.credit || '-',
			debit: transaction.debit || '-',
			balance: transaction.balance || '-',
			description: transaction.description || '-',
		};
	});
};
export const cleanCreditorsData = (transactions) => {
	return transactions?.map((transaction) => {
		// Assuming materials contain 'mix', 'cast', and 'special' in different objects.
		const mixMaterial =
			transaction.materials?.find((material) => material.product === 'mix') ||
			{};
		const castMaterial =
			transaction.materials?.find((material) => material.product === 'cast') ||
			{};
		const specialMaterial =
			transaction.materials?.find(
				(material) => material.product === 'special',
			) || {};
		const bundleMaterial =
			transaction.materials?.find(
				(material) => material.product === 'bundle',
			) || {};

		return {
			_id: transaction._id,
			creditorId: transaction.creditorId,
			date: new Date(
				transaction.date || transaction.createdAt,
			).toLocaleDateString(), // Format date
			vehicleNumber: transaction.vehicleNumber || '-',
			mixQuantity: mixMaterial.qty || '-', // Mix data
			mixPrice: mixMaterial.rate || '-',
			mixTotal: mixMaterial.cost || '-',
			castQuantity: castMaterial.qty || '-', // Cast data
			castPrice: castMaterial.rate || '-',
			castTotal: castMaterial.cost || '-',
			specialQuantity: specialMaterial.qty || '-', // Special data
			specialPrice: specialMaterial.rate || '-',
			specialTotal: specialMaterial.cost || '-',
			bundleQuantity: bundleMaterial.qty || '-', // bundle data
			bundlePrice: bundleMaterial.rate || '-',
			bundleTotal: bundleMaterial.cost || '-',
			total: transaction.total || '-',
			credit: transaction.credit || '-',
			debit: transaction.debit || '-',
			balance: transaction.balance || '-',
			description: transaction.description || '-',
		};
	});
};
export const formatDataForExcel = (transactions) => {
	const formattedData = [];

	transactions.forEach((transaction) => {
		if (transaction.materials && transaction.materials.length > 0) {
			transaction.materials.forEach((material) => {
				formattedData.push({
					Transaction_Name: transaction.name,
					Description: transaction.description,
					Material_Product: material.product,
					Material_Rate: material.rate,
					Material_Qty: material.qty,
					Material_Cost: material.cost,
					Credit: transaction.credit,
					Debit: transaction.debit,
					Total: transaction.total,
					Balance: transaction.balance,
					Date: transaction.createdAt,
				});
			});
		} else {
			formattedData.push({
				Transaction_Name: transaction.name,
				Description: transaction.description,
				Material_Product: null,
				Material_Rate: null,
				Material_Qty: null,
				Material_Cost: null,
				Total: transaction.total,
				Credit: transaction.credit,
				Debit: transaction.debit,
				Balance: transaction.balance,
				Date: transaction.createdAt,
			});
		}
	});

	return formattedData;
};
