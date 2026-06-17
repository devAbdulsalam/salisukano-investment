import { useContext, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import AuthContext from '../context/authContext';

import { fetchDividends } from '../hooks/axiosApis.js';
import Loader from '../components/Loader';
import getError from '../hooks/getError';
import { useNavigate } from 'react-router-dom';
import { months } from '../data.js';
import { ArrowUpDown } from 'lucide-react';

const currency = (amount) =>
	Number(amount || 0).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

const Dividends = () => {
	const { user } = useContext(AuthContext);
	const navigate = useNavigate();

	const currentYear = new Date().getFullYear();

	const [year, setYear] = useState(currentYear);

	const [month, setMonth] = useState('');

	const [search, setSearch] = useState('');

	const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });

	const { data, isLoading, error } = useQuery({
		queryKey: ['dividends'],
		queryFn: () => fetchDividends(user),
		enabled: !!user,
	});

	const dividends = data?.dividends || data || [];

	const availableYears = useMemo(() => {
		const years = [...new Set(dividends.map((item) => item.year))];

		return years.sort((a, b) => b - a);
	}, [dividends]);


	// Sorting
	const requestSort = (key) => {
		let direction = 'asc';
		if (sortConfig.key === key && sortConfig.direction === 'asc') {
			direction = 'desc';
		} else if (sortConfig.key === key && sortConfig.direction === 'desc') {
			direction = ''; // clear sort
		}
		setSortConfig({ key, direction });
	};

	const filteredDividends = useMemo(() => {
		// 1. Filter
		let result = dividends.filter((item) => {
			const matchesYear = !year || item.year === Number(year);
			const matchesMonth = !month || item.month === Number(month);
			const matchesSearch =
				!search ||
				item.shareholder?.name?.toLowerCase().includes(search.toLowerCase());
			return matchesYear && matchesMonth && matchesSearch;
		});

		// 2. Sort (if a direction is set)
		if (sortConfig.direction) {
			result = [...result].sort((a, b) => {
				let aValue, bValue;

				// Extract the value to sort by based on the key
				switch (sortConfig.key) {
					case 'shareholder':
						aValue = a.shareholder?.name?.toLowerCase() || '';
						bValue = b.shareholder?.name?.toLowerCase() || '';
						break;
					case 'year':
					case 'month':
					case 'amount': // add any other numeric fields
						aValue = a[sortConfig.key];
						bValue = b[sortConfig.key];
						break;
					default:
						// fallback for direct properties (string or number)
						aValue = a[sortConfig.key];
						bValue = b[sortConfig.key];
				}

				// Compare values
				if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
				if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
				return 0;
			});
		}

		return result;
	}, [dividends, year, month, search, sortConfig]);

	const stats = useMemo(() => {
		const totalDividend = filteredDividends.reduce(
			(acc, item) => acc + Number(item.dividendAmount || 0),
			0,
		);

		const totalInvestment = filteredDividends.reduce(
			(acc, item) => acc + Number(item.investmentAmount || 0),
			0,
		);

		const totalShareholders = new Set(
			filteredDividends.map(
				(item) => item.shareholder?._id || item.shareholder,
			),
		).size;

		return {
			totalDividend,
			totalInvestment,
			totalShareholders,
		};
	}, [filteredDividends]);

	if (isLoading) return <Loader />;

	if (error) {
		return <div className="p-6 text-red-500">{getError(error)}</div>;
	}

	return (
		<div className="p-3 md:p-6 bg-gray-50 min-h-screen">
			{/* Header */}

			<div className="mb-6">
				<h1 className="text-2xl font-bold">Dividend Payments</h1>

				<p className="text-sm text-gray-500">
					View and monitor monthly dividend distributions
				</p>
			</div>

			{/* Filters */}

			<div className="bg-white rounded-lg shadow p-4 mb-6">
				<div className="grid md:grid-cols-4 gap-4">
					<input
						type="text"
						placeholder="Search shareholder..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="border rounded px-3 py-2"
					/>

					<select
						value={year}
						onChange={(e) => setYear(Number(e.target.value))}
						className="border rounded px-3 py-2"
					>
						{availableYears.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</select>

					<select
						value={month}
						onChange={(e) => setMonth(e.target.value)}
						className="border rounded px-3 py-2"
					>
						{months.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>

					<button
						onClick={() => {
							setMonth('');
							setSearch('');
							setYear(currentYear);
						}}
						className="bg-slate-700 text-white rounded px-4 py-2"
					>
						Reset
					</button>
				</div>
			</div>

			{/* Summary */}

			<div className="grid md:grid-cols-3 gap-4 mb-6">
				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-gray-500 text-sm">Dividend Paid</p>

					<h2 className="text-2xl font-bold text-green-600">
						₦{currency(stats.totalDividend)}
					</h2>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-gray-500 text-sm">Investment Base</p>

					<h2 className="text-2xl font-bold text-blue-600">
						₦{currency(stats.totalInvestment)}
					</h2>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-gray-500 text-sm">Shareholders Paid</p>

					<h2 className="text-2xl font-bold">{stats.totalShareholders}</h2>
				</div>
			</div>

			{/* Table */}

			<div className="bg-white rounded-lg shadow overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-gray-100">
								<th
									onClick={() => requestSort('shareholder')}
									className="p-3 text-left cursor-pointer select-none"
								>
									<div className="flex items-center gap-1">
										Shareholder
										<ArrowUpDown size={14} />
									</div>
								</th>

								<th className="p-3 text-left">Month</th>

								<th className="p-3 text-left">Rate</th>

								<th className="p-3 text-right">Investment</th>

								<th className="p-3 text-right">Dividend</th>

								<th className="p-3 text-right">Cumulative</th>
							</tr>
						</thead>

						<tbody>
							{filteredDividends.length === 0 ? (
								<tr>
									<td colSpan="6" className="p-8 text-center text-gray-500">
										No dividend record found
									</td>
								</tr>
							) : (
								filteredDividends.map((dividend) => (
									<tr key={dividend._id} className="border-t hover:bg-gray-50">
										<td
											onClick={() =>
												navigate(`/shareholders/${dividend.shareholder?._id}`)
											}
											className="p-3 font-medium"
										>
											{dividend.shareholder?.name}
										</td>

										<td className="p-3 whitespace-nowrap">
											{months.find((m) => m.value === dividend.month)?.label}{' '}
											{dividend.year}
										</td>

										<td className="p-3">{dividend.percentage}%</td>

										<td className="p-3 text-right">
											₦{currency(dividend.investmentAmount)}
										</td>

										<td className="p-3 text-right font-semibold text-green-600">
											₦{currency(dividend.dividendAmount)}
										</td>

										<td className="p-3 text-right">
											₦{currency(dividend.cumulativeDividend)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Footer Summary */}

			<div className="mt-4 flex justify-end">
				<div className="bg-green-50 border border-green-200 rounded-lg px-5 py-3">
					<p className="text-sm text-gray-600">Total Dividend Paid</p>

					<p className="text-xl font-bold text-green-700">
						₦{currency(stats.totalDividend)}
					</p>
				</div>
			</div>
		</div>
	);
};

export default Dividends;
