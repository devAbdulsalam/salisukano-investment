/* eslint-disable react/prop-types */
import { useContext, useState } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';

const AddShareholderModal = ({ show, setShow }) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();

	// Form state
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [date, setDate] = useState('');
	const [openingBalance, setopeningBalance] = useState('');
	const [address, setAddress] = useState('');

	const apiUrl = import.meta.env.VITE_API_URL;

	// Mutation setup
	const mutation = useMutation({
		mutationFn: (newShareholder) =>
			axios.post(`${apiUrl}/shareholders`, newShareholder, {
				headers: { Authorization: `Bearer ${user?.token}` },
			}),
		onSuccess: () => {
			// Auto-sync: invalidate queries that depend on shareholders
			queryClient.invalidateQueries({ queryKey: ['shareholders'] });
			queryClient.invalidateQueries({
				queryKey: ['shareholders', 'dashboard'],
			});
			toast.success('Shareholder created successfully');
			resetForm();
			setShow(false); // close modal
		},
		onError: (error) => {
			toast.error(getError(error));
		},
	});

	const resetForm = () => {
		setName('');
		setPhone('');
		setopeningBalance('');
		setAddress('');
		setDate('');
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		// Validation
		if (!name.trim()) {
			return toast.error('Please enter a name');
		}
		if (!phone.trim()) {
			return toast.error('Phone is required');
		}
		const parsedOpeningBalance = parseFloat(openingBalance);
		if (
			!openingBalance ||
			isNaN(parsedOpeningBalance) ||
			parsedOpeningBalance <= 0
		) {
			return toast.error('Opening Balance must be a valid positive number');
		}

		if (!date) {
			return toast.error('Please select a date');
		}
		// Fire mutation
		mutation.mutate({
			openingBalance: parsedOpeningBalance,
			address: address.trim(),
			name: name.trim(),
			phone: phone.trim(),
			date: date,
		});
	};

	const isSubmitting = mutation.isPending;

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[450px] max-w-2xl">
				<div className="space-y-2 p-4">
					{/* Header */}
					<div className="flex justify-between items-start">
						<h2 className="font-semibold text-lg text-blue-500">
							Add Shareholder
						</h2>
						<button
							onClick={() => setShow(false)}
							disabled={isSubmitting}
							className="m-1 p-1 shadow rounded-full bg-red-200 hover:bg-red-300 transition-colors disabled:opacity-50"
						>
							<HiXMark className="text-xl text-red-600" />
						</button>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit}>
						<div className="p-2">
							<div className="md:flex gap-2">
								<div className="mb-2 flex-1">
									<label className="text-base text-black">
										Name <span className="text-red-600">*</span>
									</label>
									<input
										className="input w-full h-[44px] rounded-md border border-gray-300 px-4 text-base"
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										disabled={isSubmitting}
									/>
								</div>
								<div className="mb-2 flex-1">
									<label className="text-base text-black">
										Phone <span className="text-red-600">*</span>
									</label>
									<input
										className="input w-full h-[44px] rounded-md border border-gray-300 px-4 text-base"
										type="text"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										disabled={isSubmitting}
									/>
								</div>
							</div>
							<div className="md:flex gap-2">
								<div className="mb-2 flex-1">
									<label className="text-base text-black">
										Opening Balance <span className="text-red-600">*</span>
									</label>
									<input
										className="input w-full h-[44px] rounded-md border border-gray-300 px-4 text-base"
										type="number"
										min="0"
										step="0.01"
										value={openingBalance}
										onChange={(e) => setopeningBalance(e.target.value)}
										disabled={isSubmitting}
									/>
								</div>
								<div className="mb-2 flex-1">
									<label className="text-base text-black">
										Date <span className="text-red-600">*</span>
									</label>
									<input
										className="input w-full h-[44px] rounded-md border border-gray-300 px-4 text-base"
										type="date"
										value={date}
										onChange={(e) => setDate(e.target.value)}
										disabled={isSubmitting}
									/>
								</div>
							</div>
							<div className="mb-2">
								<label className="text-base text-black">
									Address <span className="text-red-600">*</span>
								</label>
								<textarea
									className="input w-full rounded-md border border-gray-300 px-4 py-2 text-base"
									rows={3}
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
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
							) : (
								'Submit'
							)}
						</button>
					</form>
				</div>
			</div>
		</Modal>
	);
};

export default AddShareholderModal;
