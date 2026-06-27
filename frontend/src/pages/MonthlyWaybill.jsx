import { useMemo, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown } from 'lucide-react';
import Loader from '../components/Loader';
import getError from '../hooks/getError';
import AuthContext from '../context/authContext';
import { fetchMonthlyWaybills } from '../hooks/axiosApis';
import { months } from '../data.js';

const MonthlyWaybill = () => {
	const navigate = useNavigate();
	const { user } = useContext(AuthContext);
	// Fetch invoices
	const { data, isLoading, error } = useQuery({
		queryKey: ['monthly-waybills'],
		queryFn: async () => fetchMonthlyWaybills(user),
	});

	console.log(data);
	const getMonth = (month) => {
		return months.find((m) => m.value === month)?.label;
	};

	const total = useMemo(
		() => data?.reduce((acc, item) => acc + item.total, 0),
		[data],
	);

	if (isLoading) return <Loader />;
	if (error)
		return (
			<div className="text-center text-red-500">
				Error loading invoices: {getError(error)}
			</div>
		);

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-xl md:text-3xl font-bold text-gray-800">
					Register
				</h1>
				<button
					onClick={() => navigate('/waybill')}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				>
					Register
				</button>
			</div>

			{/* Summary Cards */}
			<div className="w-full grid sm:grid-cols-2 gap-4 mb-4">
				<div className="p-5 bg-white flex flex-col rounded-xl gap-2 border border-gray-200 hover:shadow-md">
					<span className="text-gray-500 text-sm font-medium">Months</span>
					<span className="text-xl font-bold">{data.length}</span>
				</div>
				<div className="p-5 bg-white flex flex-col rounded-xl gap-2 border border-gray-200 hover:shadow-md">
					<span className="text-gray-500 text-sm font-medium">Total</span>
					<span className="text-xl font-bold">{total.toLocaleString()}</span>
				</div>
			</div>
			{/* Waybill Table */}
			<div className="bg-white rounded-md shadow overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								S/N
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
								<div className="flex items-center gap-1">
									Month
									<ArrowUpDown size={14} />
								</div>
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
								<div className="flex items-center gap-1">
									Total
									<ArrowUpDown size={14} />
								</div>
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{data?.length === 0 ? (
							<tr>
								<td colSpan="7" className="px-6 py-4 text-center text-gray-500">
									No Waybill found.
								</td>
							</tr>
						) : (
							data?.map((item, index) => (
								<tr key={item._id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{index + 1}
									</td>
									<td
										onClick={() =>
											navigate(
												`/waybills?month=${item.month}&year=${item.year}`,
											)
										}
										className="cursor-pointer px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
									>
										{`${getMonth(item.month)} ${item.year}`}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500  text-left">
										{item.total}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default MonthlyWaybill;
