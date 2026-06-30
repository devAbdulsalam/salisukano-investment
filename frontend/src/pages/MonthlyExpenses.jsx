import { useMemo, useContext, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import Loader from '../components/Loader';
import AuthContext from '../context/authContext';
import { fetchMonthlyExpenses } from '../hooks/axiosApis';
import { months } from '../data.js';
import getError from '../hooks/getError';

const getMonthLabel = (monthNum) =>
	months.find((m) => m.value === monthNum)?.label ?? '';

/** Derive a numeric sort value for a row given the active sort key. */
const getSortValue = (item, key) => {
	if (key === 'month') return item.year * 100 + item.month; // chronological order
	return item[key] ?? 0;
};

const MonthlyExpenses = () => {
	const navigate = useNavigate();
	const { user } = useContext(AuthContext);

	const [sortConfig, setSortConfig] = useState({
		key: 'month',
		direction: 'desc',
	});

	const {
		data = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ['monthly-expenses'],
		queryFn: () => fetchMonthlyExpenses(user),
		enabled: !!user,
	});

	// Grand total across all months
	const grandTotal = useMemo(
		() => data.reduce((acc, item) => acc + (item.total || 0), 0),
		[data],
	);

	// Highest spending month
	const peakMonth = useMemo(
		() =>
			data.reduce(
				(max, item) => (item.total > (max?.total ?? 0) ? item : max),
				null,
			),
		[data],
	);

	// Sorting — cycles asc → desc → back to default (month desc)
	const requestSort = useCallback((key) => {
		setSortConfig((prev) => {
			if (prev.key !== key) return { key, direction: 'asc' };
			if (prev.direction === 'asc') return { key, direction: 'desc' };
			return { key: 'month', direction: 'desc' }; // reset to default
		});
	}, []);

	const sortedData = useMemo(() => {
		if (!sortConfig.key) return data;
		return [...data].sort((a, b) => {
			const aVal = getSortValue(a, sortConfig.key);
			const bVal = getSortValue(b, sortConfig.key);
			if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
			return 0;
		});
	}, [data, sortConfig]);

	/** Returns the appropriate sort icon for a column header. */
	const SortIcon = ({ colKey }) => {
		if (sortConfig.key !== colKey)
			return <ArrowUpDown size={14} className="text-gray-400" />;
		return sortConfig.direction === 'asc' ? (
			<ArrowUp size={14} className="text-blue-500" />
		) : (
			<ArrowDown size={14} className="text-blue-500" />
		);
	};

	if (isLoading) return <Loader />;
	if (error)
		return (
			<div className="p-6 text-center text-red-500">
				Failed to load monthly expenses: {getError(error)}
			</div>
		);

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-xl md:text-2xl font-bold text-gray-800">
					Monthly Expenses
				</h1>
				<button
					onClick={() => navigate('/expenses')}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				>
					All Expenses
				</button>
			</div>

			{/* Summary Cards */}
			<div className="w-full grid sm:grid-cols-3 gap-4 mb-6">
				<div className="p-5 bg-white flex flex-col rounded-xl gap-2 border border-gray-200 hover:shadow-md">
					<span className="text-gray-500 text-sm font-medium">
						Total Months
					</span>
					<span className="text-xl font-bold">{data.length}</span>
				</div>
				<div className="p-5 bg-white flex flex-col rounded-xl gap-2 border border-gray-200 hover:shadow-md">
					<span className="text-gray-500 text-sm font-medium">Grand Total</span>
					<span className="text-xl font-bold">
						₦{grandTotal.toLocaleString()}
					</span>
				</div>
				<div className="p-5 bg-white flex flex-col rounded-xl gap-2 border border-gray-200 hover:shadow-md">
					<span className="text-gray-500 text-sm font-medium">
						Highest Month
					</span>
					<span className="text-xl font-bold">
						{peakMonth
							? `${getMonthLabel(peakMonth.month)} ${peakMonth.year}`
							: '—'}
					</span>
					{peakMonth && (
						<span className="text-sm text-gray-400">
							₦{peakMonth.total.toLocaleString()}
						</span>
					)}
				</div>
			</div>

			{/* Table */}
			<div className="bg-white rounded-md shadow overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								S/N
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
								<div
									onClick={() => requestSort('month')}
									className="flex items-center gap-1 cursor-pointer select-none"
								>
									Month
									<SortIcon colKey="month" />
								</div>
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer cursor-pointer select-none">
								<div
									onClick={() => requestSort('count')}
									className="flex items-center gap-1"
								>
									No. of Records
									<SortIcon colKey="count" />
								</div>
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
								<div
									onClick={() => requestSort('total')}
									className="flex items-center gap-1"
								>
									Total (₦)
									<SortIcon colKey="total" />
								</div>
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{data.length === 0 ? (
							<tr>
								<td colSpan={4} className="px-6 py-8 text-center text-gray-500">
									No expense records found.
								</td>
							</tr>
						) : (
							sortedData.map((item, index) => (
								<tr
									key={`${item.year}-${item.month}`}
									className="hover:bg-gray-50 cursor-pointer"
									onClick={() =>
										navigate(`/expenses?month=${item.month}&year=${item.year}`)
									}
								>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{index + 1}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">
										{getMonthLabel(item.month)} {item.year}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{item.count}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
										{(item.total || 0).toLocaleString()}
									</td>
								</tr>
							))
						)}
					</tbody>
					{data.length > 0 && (
						<tfoot className="bg-gray-50 border-t border-gray-200">
							<tr>
								<td
									colSpan={3}
									className="px-6 py-3 text-sm font-bold text-gray-700 text-right"
								>
									Grand Total
								</td>
								<td className="px-6 py-3 text-sm font-bold text-gray-900">
									{grandTotal.toLocaleString()}
								</td>
							</tr>
						</tfoot>
					)}
				</table>
			</div>
		</div>
	);
};

export default MonthlyExpenses;
