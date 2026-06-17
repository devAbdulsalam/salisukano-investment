/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { TriangleAlert } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';
import { months } from '../../data.js';

const ShareDividendModal = ({ show, setShow, selectedRate }) => {
	const { user } = useContext(AuthContext);

	const queryClient = useQueryClient();

	const currentYear = new Date().getFullYear();

	const [percentage, setPercentage] = useState('');

	const [year, setYear] = useState(currentYear);

	const [month, setMonth] = useState('');

	useEffect(() => {
		if (show) {
			setPercentage(selectedRate?.percentage || '');
			console.log(selectedRate);

			setMonth(selectedRate?.month || '');

			setYear(selectedRate?.year || currentYear);
		}
	}, [show, selectedRate, currentYear]);

	const apiUrl = import.meta.env.VITE_API_URL;

	const mutation = useMutation({
		mutationFn: async (payload) => {
			return axios.post(`${apiUrl}/shareholders/run-dividend`, payload, {
				headers: {
					Authorization: `Bearer ${user?.token}`,
				},
			});
		},

		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['dividend-rates'],
			});

			queryClient.invalidateQueries({
				queryKey: ['dividends'],
			});
			queryClient.invalidateQueries({
				queryKey: ['dividends', year, month],
			});

			toast.success('Dividend shared successfully');

			setShow(false);
		},

		onError: (error) => {
			toast.error(getError(error));
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();

		const parsedPercentage = parseFloat(percentage);

		if (!parsedPercentage || parsedPercentage <= 0) {
			return toast.error('Percentage must be greater than 0');
		}

		if (!month) {
			return toast.error('Please select a month');
		}

		if (!year) {
			return toast.error('Please select a year');
		}

		mutation.mutate({
			year: Number(year),
			month: Number(month),
			percentage: parsedPercentage,
		});
	};

	const getMonth = (month) => {
		return months.find((m) => m.value === month)?.label;
	};

	const isSubmitting = mutation.isPending;

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

					{/* Body */}
					<div className="mt-4">
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
									{selectedRate?.percentage}%
								</span>
							</div>
							<div className="flex justify-between border-b border-gray-200 pb-2">
								<span className="text-sm font-medium text-gray-500">Month</span>
								<span className="text-sm font-semibold text-gray-800">
									{getMonth(selectedRate?.month) || selectedRate?.month}
								</span>
							</div>
							<div className="flex justify-between  ">
								<span className="text-sm font-medium text-gray-500">Year</span>
								<span className="text-sm font-semibold text-gray-800">
									{selectedRate?.year}
								</span>
							</div>
						</div>
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
							disabled={isSubmitting}
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

export default ShareDividendModal;
