/* eslint-disable react/prop-types */
import { useContext, useState, useMemo, useCallback, useEffect } from 'react';
import AuthContext from '../../context/authContext.jsx';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError.js';
import { TriangleAlert } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal.jsx';
import { HiXMark } from 'react-icons/hi2';
import { months } from '../../data.js';
import { useNavigate } from 'react-router-dom';

const ShareholderDividendModal = ({
	show,
	setShow,
	dividendRates,
	shareholder,
}) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth() + 1; // months are 1-indexed in your data

	// console.log('dividendRates', dividendRates);

	// Local state for selected period
	const [year, setYear] = useState(currentYear);
	const [month, setMonth] = useState(currentMonth);

	// Reset to current period when modal opens
	useState(() => {
		if (show) {
			setYear(currentYear);
			setMonth(currentMonth);
		}
	}, [show, currentYear, currentMonth]); // but we cannot use useState for effect, use useEffect

	// Better: use useEffect to reset on show
	useEffect(() => {
		if (show) {
			setYear(currentYear);
			setMonth(currentMonth);
		}
	}, [show, currentYear, currentMonth]);

	// Derive the selected rate from the given rates and current period
	const selectedRate = useMemo(() => {
		if (!dividendRates) return null;
		return (
			dividendRates.find(
				(item) => item.month === month && item.year === year,
			) || null
		);
	}, [dividendRates, month, year]);

	const apiUrl = import.meta.env.VITE_API_URL;

	const mutation = useMutation({
		mutationFn: async (payload) => {
			return axios.post(
				`${apiUrl}/shareholders/run-dividend/${shareholder._id}`,
				payload,
				{
					headers: {
						Authorization: `Bearer ${user?.token}`,
					},
				},
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['shareholders'] });
			queryClient.invalidateQueries({
				queryKey: ['shareholders', shareholder._id],
			});
			queryClient.invalidateQueries({ queryKey: ['dividend-rates'] });
			queryClient.invalidateQueries({ queryKey: ['dividends'] });
			queryClient.invalidateQueries({ queryKey: ['dividends', year, month] });
			toast.success('Dividend shared successfully');
			setShow(false);
		},
		onError: (error) => {
			toast.error(getError(error));
		},
	});

	const handleSubmit = useCallback(
		(e) => {
			e.preventDefault();

			if (!selectedRate) {
				return toast.error('No dividend rate found for the selected period');
			}

			const percentage = selectedRate.percentage;
			if (!percentage || percentage <= 0) {
				return toast.error('Invalid percentage for this rate');
			}

			mutation.mutate({
				year: Number(year),
				month: Number(month),
				percentage: percentage,
				shareholderId: shareholder._id,
			});
		},
		[selectedRate, year, month, mutation],
	);

	const isSubmitting = mutation.isPending;

	// Generate year options once
	const yearOptions = useMemo(
		() =>
			Array.from({ length: 10 }, (_, i) => currentYear - 2 + i).map((yr) => (
				<option key={yr} value={yr}>
					{yr}
				</option>
			)),
		[currentYear],
	);

	return (
		<Modal show={show}>
			<div className="transform text-left align-middle transition-all font-josefin overflow-hidden rounded-2xl bg-white shadow-xl w-full min-w-[280px] md:min-w-[450px]">
				<div className="p-5">
					<div className="flex items-center justify-between">
						<h2 className="text-xl font-semibold leading-6 text-green-600 flex items-center gap-2">
							<TriangleAlert className="h-6 w-6 text-green-500" />
							Share Dividend
						</h2>
						<button
							onClick={() => setShow(false)}
							disabled={isSubmitting}
							className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
						>
							<HiXMark className="h-5 w-5" />
						</button>
					</div>

					<div className="grid md:grid-cols-2 gap-4 mt-4">
						<div>
							<label className="block mb-1 text-left">Year</label>
							<select
								value={year}
								onChange={(e) => setYear(Number(e.target.value))}
								className="w-full border rounded-md p-2"
								disabled={isSubmitting}
							>
								{yearOptions}
							</select>
						</div>

						<div>
							<label className="block mb-1 text-left">Month</label>
							<select
								value={month}
								onChange={(e) => setMonth(Number(e.target.value))}
								className="w-full border rounded-md p-2"
								disabled={isSubmitting}
							>
								<option value="">Select Month</option>
								{months.map((item) => (
									<option key={item.value} value={item.value}>
										{item.label}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Body */}
					<div className="mt-4">
						{!selectedRate ? (
							<div className="bg-yellow-50 p-4 rounded-md">
								<p className="text-sm text-yellow-800">
									No dividend rate exists for this period. Please create one
									first.
								</p>
								<button
									onClick={() => {
										setShow(false);
										navigate('/dividend-rates');
									}}
									className="mt-2 text-sm font-medium text-green-600 hover:underline"
								>
									Go to Dividend Rates
								</button>
							</div>
						) : (
							<>
								<p className="text-sm text-gray-600">
									Are you sure you want to share the dividend for the following
									period?
								</p>
								<div className="mt-4 space-y-3 rounded-lg bg-gray-50 p-4">
									<div className="flex justify-between border-b border-gray-200 pb-2">
										<span className="text-sm font-medium text-gray-500">
											Percentage
										</span>
										<span className="text-sm font-semibold text-blue-600">
											{selectedRate.percentage}%
										</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm font-medium text-gray-500">
											Period
										</span>
										<span className="text-sm font-semibold">
											{months.find((m) => m.value === month)?.label} {year}
										</span>
									</div>
								</div>
							</>
						)}
					</div>

					{/* Actions */}
					<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button
							type="button"
							onClick={() => setShow(false)}
							disabled={isSubmitting}
							className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSubmit}
							disabled={!selectedRate || isSubmitting}
							className="inline-flex justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<>
									<svg
										className="mr-2 h-4 w-4 animate-spin text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
										/>
									</svg>
									Sharing...
								</>
							) : (
								'Share Dividend'
							)}
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default ShareholderDividendModal;
