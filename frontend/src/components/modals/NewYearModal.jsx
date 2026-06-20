/* eslint-disable react/prop-types */
import { useContext, useState, useMemo, useCallback } from 'react';
import AuthContext from '../../context/authContext.jsx';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError.js';
import { TriangleAlert } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal.jsx';
import { HiXMark } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';

const NewYearModal = ({
	show,
	setShow,
	closingBalance,
	year: selectedYear,
	shareholder,
}) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(selectedYear || currentYear);

	const apiUrl = import.meta.env.VITE_API_URL;

	const mutation = useMutation({
		mutationFn: async (payload) => {
			return axios.post(
				`${apiUrl}/shareholders/new-financial-year/${shareholder._id}`,
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
			toast.success('New financial year started successfully');
			setShow(false);
		},
		onError: (error) => {
			toast.error(getError(error));
		},
	});

	const handleSubmit = useCallback(
		(e) => {
			e.preventDefault();

			if (!closingBalance || isNaN(closingBalance)) {
				return toast.error('Valid closing balance is required');
			}

			mutation.mutate({
				year: Number(year),
				shareholderId: shareholder._id,
				closingBalance: Number(closingBalance),
			});
		},
		[year, closingBalance, mutation, shareholder?._id],
	);

	const isSubmitting = mutation.isPending;

	const yearOptions = useMemo(
		() =>
			Array.from({ length: 15 }, (_, i) => currentYear - 5 + i).map((yr) => (
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
							New Financial Year
						</h2>
						<button
							onClick={() => setShow(false)}
							disabled={isSubmitting}
							className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
							aria-label="Close modal"
						>
							<HiXMark className="h-5 w-5" />
						</button>
					</div>

					<form onSubmit={handleSubmit}>
						<div className="mt-4">
							<label
								htmlFor="year-select"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Select Financial Year
							</label>
							<select
								id="year-select"
								value={year}
								onChange={(e) => setYear(Number(e.target.value))}
								className="w-full border rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
								disabled={isSubmitting}
							>
								{yearOptions}
							</select>
						</div>

						<div className="mt-4">
							<p className="text-sm text-gray-600">
								You are about to start a new financial year for{' '}
								<strong>{shareholder?.name || 'Shareholder'}</strong>.
							</p>
							<div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-4">
								<div className="flex justify-between border-b border-gray-200 pb-2">
									<span className="text-sm font-medium text-gray-500">
										Opening Balance (carried forward)
									</span>
									<span className="text-sm font-semibold text-blue-600">
										{closingBalance?.toLocaleString() ?? 'N/A'}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm font-medium text-gray-500">
										New Year
									</span>
									<span className="text-sm font-semibold">{year}</span>
								</div>
							</div>
						</div>

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
								type="submit"
								disabled={!closingBalance || isSubmitting}
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
										Processing...
									</>
								) : (
									'Start New Year'
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</Modal>
	);
};

// NewYearModal.propTypes = {
// 	show: PropTypes.bool.isRequired,
// 	setShow: PropTypes.func.isRequired,
// 	closingBalance: PropTypes.number,
// 	year: PropTypes.number,
// 	shareholder: PropTypes.shape({
// 		_id: PropTypes.string.isRequired,
// 		name: PropTypes.string,
// 	}).isRequired,
// };

export default NewYearModal;
