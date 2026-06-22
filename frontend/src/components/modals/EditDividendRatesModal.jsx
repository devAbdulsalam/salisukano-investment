/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useQueryClient, useMutation } from '@tanstack/react-query';

import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';

import { months } from '../../data';
const EditDividendRatesModal = ({
	show,
	setShow,
	selectedRate,
	selectedYear,
}) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();

	const currentYear = new Date().getFullYear();

	const [percentage, setPercentage] = useState('');

	const [description, setDescription] = useState('');

	const [year, setYear] = useState(selectedYear);

	const [month, setMonth] = useState('');

	useEffect(() => {
		if (show) {
			setPercentage(selectedRate?.percentage || '');

			setDescription(selectedRate?.description || '');

			setMonth(selectedRate?.month || '');

			setYear(selectedRate?.year || selectedYear || currentYear);
		}
	}, [show, selectedRate, selectedYear, currentYear]);

	const apiUrl = import.meta.env.VITE_API_URL;

	const mutation = useMutation({
		mutationFn: async (payload) => {
			return axios.post(`${apiUrl}/shareholders/dividend-rate`, payload, {
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

			toast.success(
				selectedRate?._id
					? 'Dividend rate updated successfully'
					: 'Dividend rate created successfully',
			);

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
			description: description.trim(),
		});
	};

	const isSubmitting = mutation.isPending;

	return (
		<Modal show={show}>
			<div className="transform text-left align-middle transition-all font-josefin overflow-hidden rounded-2xl bg-white shadow-xl w-full min-w-[280px] md:min-w-[450px]">
				<div className="p-5">
					<div className="flex justify-between items-center mb-4">
						<h2 className="font-semibold text-lg text-blue-600">
							{selectedRate?._id
								? 'Edit Dividend Rate'
								: 'Create Dividend Rate'}
						</h2>

						<button
							onClick={() => setShow(false)}
							disabled={isSubmitting}
							className="p-1 rounded-full bg-red-100 hover:bg-red-200"
						>
							<HiXMark className="text-xl text-red-600" />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<label className="block mb-1 text-left">Year</label>

								<select
									value={year}
									onChange={(e) => setYear(e.target.value)}
									className="w-full border rounded-md p-2"
									disabled={isSubmitting}
								>
									{Array.from(
										{
											length: 15,
										},
										(_, index) => year - 5 + index,
									).map((yr) => (
										<option key={yr} value={yr}>
											{yr}
										</option>
									))}
								</select>
							</div>

							<div>
								<label className="block mb-1 text-left">Month</label>

								<select
									value={month}
									onChange={(e) => setMonth(e.target.value)}
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

						<div>
							<label className="block mb-1 text-left">
								Dividend Percentage (%)
							</label>

							<input
								type="number"
								min="0"
								step="0.01"
								value={percentage}
								onChange={(e) => setPercentage(e.target.value)}
								className="w-full border rounded-md p-2"
								disabled={isSubmitting}
							/>
						</div>

						<div>
							<label className="block mb-1 text-left">Description</label>

							<textarea
								rows="3"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								className="w-full border rounded-md p-2"
								disabled={isSubmitting}
							/>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
						>
							{isSubmitting
								? 'Saving...'
								: selectedRate?._id
									? 'Update Dividend Rate'
									: 'Create Dividend Rate'}
						</button>
					</form>
				</div>
			</div>
		</Modal>
	);
};

export default EditDividendRatesModal;
