/* eslint-disable react/prop-types */
import { useContext, useState, useMemo, useCallback, useEffect } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';

const TopupModal = ({ show, setShow, shareholder, isTopup }) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();

	// console.log('shareholder', shareholder);
	// Form state
	const [amount, setAmount] = useState('');
	const [date, setDate] = useState('');
	const [description, setDescription] = useState('');

	const apiUrl = import.meta.env.VITE_API_URL;

	// Derived values
	const url = useMemo(
		() =>
			isTopup
				? `${apiUrl}/shareholders/${shareholder?._id}/topup`
				: `${apiUrl}/shareholders/${shareholder?._id}/withdraw`,
		[apiUrl, isTopup, shareholder?._id],
	);

	const modalTitle = useMemo(
		() => (isTopup ? 'Topup Investment' : 'Withdraw Investment'),
		[isTopup],
	);

	const newBalance = useMemo(() => {
		const base = shareholder?.currentInvestment || 0;
		const delta = parseFloat(amount) || 0;
		return isTopup ? base + delta : base - delta;
	}, [isTopup, shareholder?.currentInvestment, amount]);

	// Reset form
	const resetForm = useCallback(() => {
		setAmount('');
		setDate('');
		setDescription('');
	}, []);

	// Close modal and reset
	const handleClose = useCallback(() => {
		setShow(false);
		resetForm();
	}, [setShow, resetForm]);

	// Reset when modal is closed externally (e.g., backdrop click)
	useEffect(() => {
		if (!show) {
			resetForm();
		}
	}, [show, resetForm]);

	// Mutation
	const mutation = useMutation({
		mutationFn: (payload) =>
			axios.post(url, payload, {
				headers: { Authorization: `Bearer ${user?.token}` },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['shareholders', shareholder._id],
			});
			queryClient.invalidateQueries({ queryKey: ['shareholders'] });
			queryClient.invalidateQueries({
				queryKey: ['shareholders', 'dashboard'],
			});
			toast.success(
				isTopup
					? 'Top‑up added successfully'
					: 'Withdrawal processed successfully',
			);
			resetForm();
			setShow(false);
		},
		onError: (error) => {
			toast.error(getError(error));
		},
	});

	const isSubmitting = mutation.isPending;

	// Submit handler
	const handleSubmit = useCallback(
		(e) => {
			e.preventDefault();

			const parsedAmount = parseFloat(amount);
			if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
				return toast.error('Please enter a valid positive amount');
			}
			if (!date) {
				return toast.error('Please select a date');
			}
			if (!description.trim()) {
				return toast.error('Please enter a description');
			}

			// Optional: prevent withdrawal if balance would go negative
			if (!isTopup && parsedAmount > (shareholder?.currentInvestment || 0)) {
				return toast.error('Insufficient balance for this withdrawal');
			}

			mutation.mutate({
				amount: parsedAmount,
				date,
				description: description.trim(),
			});
		},
		[
			amount,
			date,
			description,
			isTopup,
			shareholder?.currentInvestment,
			mutation,
		],
	);

	// If shareholder is missing, show nothing (or an error)
	if (!shareholder) {
		return null;
	}

	return (
		<Modal show={show} onBackdropClick={handleClose}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[280px] md:min-w-[450px]">
				<div className="space-y-2 p-4">
					{/* Header */}
					<div className="flex justify-between items-start">
						<h2 className="font-semibold text-lg text-blue-500">
							{modalTitle}
						</h2>
						<button
							onClick={handleClose}
							disabled={isSubmitting}
							className="m-1 p-1 shadow rounded-full bg-red-200 hover:bg-red-300 transition-colors disabled:opacity-50"
							aria-label="Close modal"
						>
							<HiXMark className="text-xl text-red-600" />
						</button>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} noValidate>
						<div className="p-2">
							<div className="md:flex gap-2">
								<div className="mb-2 flex-1">
									<label htmlFor="amount" className="text-base text-black">
										Amount <span className="text-red-600">*</span>
									</label>
									<input
										id="amount"
										className="input w-full h-[44px] rounded-md border border-gray-300 px-4 text-base"
										type="number"
										min="0"
										step="0.01"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										disabled={isSubmitting}
										required
									/>
								</div>
								<div className="mb-2 flex-1">
									<label htmlFor="date" className="text-base text-black">
										Date <span className="text-red-600">*</span>
									</label>
									<input
										id="date"
										className="input w-full h-[44px] rounded-md border border-gray-300 px-4 text-base"
										type="date"
										value={date}
										onChange={(e) => setDate(e.target.value)}
										disabled={isSubmitting}
										required
									/>
								</div>
							</div>
							<div className="mb-2">
								<label htmlFor="description" className="text-base text-black">
									Description <span className="text-red-600">*</span>
								</label>
								<textarea
									id="description"
									className="input w-full rounded-md border border-gray-300 px-4 py-2 text-base"
									rows={3}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									disabled={isSubmitting}
									required
								/>
							</div>
						</div>

						<div className="px-2 pb-2">
							<p className="text-sm text-gray-600">
								New Balance:{' '}
								<span className="font-semibold text-gray-800">
									₦{newBalance.toFixed(2)}
								</span>
							</p>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 py-1 w-full flex items-center justify-center rounded-md transition-all duration-500 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<span className="inline-flex items-center">
									<svg
										className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
									Submitting...
								</span>
							) : isTopup ? (
								'Topup'
							) : (
								'Withdraw'
							)}
						</button>
					</form>
				</div>
			</div>
		</Modal>
	);
};

export default TopupModal;
