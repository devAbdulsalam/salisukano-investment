/* eslint-disable react/prop-types */
import { useContext, useState, useMemo, useCallback, useEffect } from 'react';
import AuthContext from '../../context/authContext.jsx';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError.js';
import { TriangleAlert, Loader2 } from 'lucide-react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import Modal from './Modal.jsx';
import { HiXMark } from 'react-icons/hi2';
import { months } from '../../data.js';
import { useNavigate } from 'react-router-dom';
import { fetchDividendRates } from '../../hooks/axiosApis.js';

const ShareholderDividendModal = ({
	show,
	setShow,
	shareholder,
	year: propYear,
}) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const currentYear = new Date().getFullYear();
	const currentMonth = new Date().getMonth() + 1;

	const [year, setYear] = useState(propYear || currentYear);
	const [month, setMonth] = useState(currentMonth);

	// Reset period whenever the modal opens
	useEffect(() => {
		if (show) {
			setYear(propYear || currentYear);
			setMonth(currentMonth);
		}
	}, [show, propYear, currentYear, currentMonth]);

	// Fetch rates for the selected year — re-fetches automatically when year changes
	const {
		data: ratesData,
		isLoading: ratesLoading,
		isError: ratesError,
	} = useQuery({
		queryKey: ['dividend-rates', year],
		queryFn: () => fetchDividendRates(user, year),
		enabled: !!user && show,
		staleTime: 60 * 1000,
	});

	const rates = ratesData?.data || [];

	// Auto-derive selected rate whenever rates, year, or month change
	const selectedRate = useMemo(() => {
		if (!rates.length) return null;
		return (
			rates.find((r) => r.year === Number(year) && r.month === Number(month)) ??
			null
		);
	}, [rates, year, month]);

	const apiUrl = import.meta.env.VITE_API_URL;

	const mutation = useMutation({
		mutationFn: async (payload) =>
			axios.post(
				`${apiUrl}/shareholders/run-dividend/${shareholder._id}`,
				payload,
				{ headers: { Authorization: `Bearer ${user?.token}` } },
			),
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
		onError: (err) => toast.error(getError(err)),
	});

	const handleSubmit = useCallback(
		(e) => {
			e.preventDefault();

			if (!selectedRate) {
				return toast.error('No dividend rate found for the selected period');
			}
			if (!selectedRate.percentage || selectedRate.percentage <= 0) {
				return toast.error('Invalid percentage for this rate');
			}

			mutation.mutate({
				year: Number(year),
				month: Number(month),
				percentage: selectedRate.percentage,
				shareholderId: shareholder._id,
			});
		},
		[selectedRate, year, month, mutation, shareholder?._id],
	);

	const isSubmitting = mutation.isPending;

	const yearOptions = useMemo(
		() =>
			Array.from({ length: 10 }, (_, i) => currentYear - 2 + i),
		[currentYear],
	);

	const monthLabel = months.find((m) => m.value === Number(month))?.label ?? '';

	return (
		<Modal show={show}>
			<div className="transform text-left align-middle transition-all font-josefin overflow-hidden rounded-2xl bg-white shadow-xl w-full min-w-[280px] md:min-w-[450px]">
				<div className="p-5">
					{/* Header */}
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

					{/* Period selectors */}
					<div className="grid grid-cols-2 gap-4 mt-4">
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-700">
								Year
							</label>
							<select
								value={year}
								onChange={(e) => setYear(Number(e.target.value))}
								className="w-full border rounded-md p-2 text-sm"
								disabled={isSubmitting}
							>
								{yearOptions.map((yr) => (
									<option key={yr} value={yr}>
										{yr}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block mb-1 text-sm font-medium text-gray-700">
								Month
							</label>
							<select
								value={month}
								onChange={(e) => setMonth(Number(e.target.value))}
								className="w-full border rounded-md p-2 text-sm"
								disabled={isSubmitting}
							>
								{months
									.filter((m) => m.value !== '')
									.map((m) => (
										<option key={m.value} value={m.value}>
											{m.label}
										</option>
									))}
							</select>
						</div>
					</div>

					{/* Rate info / feedback */}
					<div className="mt-4">
						{ratesLoading ? (
							<div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
								<Loader2 className="h-4 w-4 animate-spin" />
								Loading rates for {year}…
							</div>
						) : ratesError ? (
							<div className="bg-red-50 p-4 rounded-md text-sm text-red-700">
								Failed to load dividend rates. Please try again.
							</div>
						) : !selectedRate ? (
							<div className="bg-yellow-50 p-4 rounded-md">
								<p className="text-sm text-yellow-800">
									No dividend rate exists for{' '}
									<strong>
										{monthLabel} {year}
									</strong>
									. Please create one first.
								</p>
								<button
									onClick={() => {
										setShow(false);
										navigate(`/dividend-rates/${year}`);
									}}
									className="mt-2 text-sm font-medium text-green-600 hover:underline"
								>
									Go to Dividend Rates →
								</button>
							</div>
						) : (
							<>
								<p className="text-sm text-gray-600">
									Share dividend for{' '}
									<strong>
										{monthLabel} {year}
									</strong>{' '}
									to{' '}
									<strong>
										{shareholder?.name || 'this shareholder'}
									</strong>
									?
								</p>

								<div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-4">
									<div className="flex justify-between border-b border-gray-200 pb-2">
										<span className="text-sm text-gray-500">Period</span>
										<span className="text-sm font-semibold">
											{monthLabel} {year}
										</span>
									</div>
									<div className="flex justify-between border-b border-gray-200 pb-2">
										<span className="text-sm text-gray-500">Rate</span>
										<span className="text-sm font-semibold text-blue-600">
											{selectedRate.percentage}%
										</span>
									</div>
									{selectedRate.status && (
										<div className="flex justify-between">
											<span className="text-sm text-gray-500">Status</span>
											<span
												className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
													selectedRate.status === 'completed'
														? 'bg-green-100 text-green-700'
														: 'bg-yellow-100 text-yellow-700'
												}`}
											>
												{selectedRate.status}
											</span>
										</div>
									)}
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
							disabled={!selectedRate || isSubmitting || ratesLoading}
							className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Sharing…
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
