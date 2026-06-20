import React, { useContext, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import AuthContext from '../context/authContext';
import EditDividendRatesModal from '../components/modals/EditDividendRatesModal.jsx';
import ShareDividendModal from '../components/modals/ShareDividendModal.jsx';

import { fetchDividendRates } from '../hooks/axiosApis.js';
import Loader from '../components/Loader';
import getError from '../hooks/getError';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Pencil } from 'lucide-react';
import formatDate from '../hooks/formatDate.js';
import { months } from '../data.js';

const DividendRatesPage = () => {
	const { year: selectedYear } = useParams();
	const { user } = useContext(AuthContext);

	const currentYear = new Date().getFullYear();
	const navigate = useNavigate();

	const [year, setYear] = useState(selectedYear || currentYear);
	const [isEditModal, setIsEditModal] = useState(false);
	const [selectedRate, setSelectedRate] = useState(null);
	const [showModal, setShowModal] = useState(false);

	const { data, isLoading, error } = useQuery({
		queryKey: ['dividend-rates', year],
		queryFn: () => fetchDividendRates(user, year),
		enabled: !!user,
	});

	const rates = data?.data || [];

	const stats = useMemo(() => {
		const totalMonths = rates.length;

		const averageRate =
			totalMonths > 0
				? rates.reduce((acc, item) => acc + Number(item.percentage), 0) /
					totalMonths
				: 0;

		const highestRate =
			totalMonths > 0 ? Math.max(...rates.map((item) => item.percentage)) : 0;

		const lowestRate =
			totalMonths > 0 ? Math.min(...rates.map((item) => item.percentage)) : 0;

		return {
			totalMonths,
			averageRate,
			highestRate,
			lowestRate,
		};
	}, [rates]);

	const yearlyRates = useMemo(() => {
		const result = [];

		for (let month = 1; month <= 12; month++) {
			const found = rates.find((rate) => rate.month === month);

			result.push({
				month,
				name: months[month - 1],
				percentage: found?.percentage || null,
				id: found?._id,
				_id: found?._id,
				year: found?.year,
				processedAt: found?.processedAt,
				status: found?.status,
				description: found?.description,
			});
		}

		return result;
	}, [rates]);

	const getMonth = (month) => {
		return months.find((m) => m.value === month)?.label;
	};

	if (isLoading) {
		return <Loader />;
	}

	if (error) {
		return <div className="p-6 text-red-500">{getError(error)}</div>;
	}

	const handleEdit = (item) => {
		setSelectedRate(item);
		setIsEditModal(true);
	};

	return (
		<div className="p-3 md:p-6 bg-gray-50 min-h-screen">
			{/* Header */}

			<div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold">Dividend Rates</h1>

					<p className="text-gray-500 text-sm">
						Manage monthly dividend percentages
					</p>
				</div>
				{/* <div>
					<button
						onClick={() => navigate('/dividends')}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Dividend Payments
					</button>
				</div> */}
			</div>

			{/* Summary Cards */}

			<div className="grid md:grid-cols-4 gap-4 mb-6">
				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-500">Months Configured</p>

					<h2 className="text-2xl font-bold">
						{stats.totalMonths}
						/12
					</h2>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-500">Average Rate</p>

					<h2 className="text-2xl font-bold text-blue-600">
						{stats.averageRate.toFixed(2)}%
					</h2>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-500">Highest Rate</p>

					<h2 className="text-2xl font-bold text-green-600">
						{stats.highestRate}%
					</h2>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-500">Lowest Rate</p>

					<h2 className="text-2xl font-bold text-orange-600">
						{stats.lowestRate}%
					</h2>
				</div>
			</div>

			{/* Rates Table */}

			<div className="bg-white rounded-lg shadow overflow-hidden p-2">
				<div className="flex justify-between items-center px-4 py-3">
					<div className=" ">
						<h2 className="font-semibold">
							<span className="hidden md:inline">{year} </span>
							Dividend Rates
						</h2>
					</div>
					<select
						value={year}
						onChange={(e) => {
							setYear(Number(e.target.value));
							navigate(`/dividend-rates/${e.target.value}`);
						}}
						className="border rounded px-3 py-2 bg-white"
					>
						{Array.from(
							{ length: 10 },
							(_, index) => currentYear - 5 + index,
						).map((yr) => (
							<option key={yr} value={yr}>
								{yr}
							</option>
						))}
					</select>
				</div>

				<div className="overflow-x-auto px-4">
					<table className="w-full rounded-lg border border-gray-200">
						<thead>
							<tr className="bg-gray-100">
								<th className="p-3 text-left">Month</th>

								<th className="p-3 text-left whitespace-nowrap">Dividend %</th>

								<th className="p-3 text-left whitespace-nowrap">
									Processed At
								</th>

								<th className="p-3 text-left">Status</th>

								<th className="p-3 text-left">Action</th>
							</tr>
						</thead>

						<tbody>
							{yearlyRates.map((item) => (
								<tr key={item.month} className="border-t hover:bg-gray-50">
									<td className="p-3">{getMonth(item.month)}</td>

									<td className="p-3 font-medium">
										{item.percentage !== null ? `${item.percentage}%` : '-'}
									</td>

									<td className="p-3 text-gray-500 text-sm">
										{item.processedAt ? formatDate(item?.processedAt) : '-'}
									</td>

									<td className="p-3">
										{item.status === 'completed' ? (
											<span className="text-green-600 font-medium ">
												Completed
											</span>
										) : item.status === 'pending' ? (
											<span className="text-orange-500 font-medium">
												Pending
											</span>
										) : (
											<span className="text-red-500 font-medium whitespace-nowrap">
												Not set
											</span>
										)}
									</td>

									{item.status === 'completed' ? (
										<td className="flex text-green-400">
											<button className="p-3 text-gray-500 text-sm">
												<Check className="h-4 w-4 " />
											</button>
										</td>
									) : (
										<td className="flex">
											<button
												onClick={() => handleEdit(item)}
												className="p-3 text-gray-500 text-sm"
											>
												<Pencil className="h-4 w-4" />
											</button>
											{item.status === 'pending' ? (
												<button
													onClick={() => {
														setSelectedRate(item);
														setShowModal(true);
													}}
													className="p-3 text-gray-500 text-sm"
												>
													<Check className="h-4 w-4 " />
												</button>
											) : null}
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<EditDividendRatesModal
				show={isEditModal}
				setShow={setIsEditModal}
				setLoading={() => {}}
				loading={false}
				selectedRate={selectedRate}
				selectedYear={year}
				onClose={() => setSelectedRate(null)}
			/>
			<ShareDividendModal
				show={showModal}
				setShow={setShowModal}
				selectedRate={selectedRate}
			/>
		</div>
	);
};

export default DividendRatesPage;
