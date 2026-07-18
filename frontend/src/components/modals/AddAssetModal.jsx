/* eslint-disable react/prop-types */
import { useContext, useState } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';

const AddAssetModal = ({ show, setShow }) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const apiUrl = import.meta.env.VITE_API_URL;

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [purchasePrice, setPurchasePrice] = useState('');
	const [purchaseDate, setPurchaseDate] = useState('');
	const [agentName, setAgentName] = useState('');
	const [agentPhone, setAgentPhone] = useState('');
	const [agentAddress, setAgentAddress] = useState('');

	const resetForm = () => {
		setName('');
		setDescription('');
		setPurchasePrice('');
		setPurchaseDate('');
		setAgentName('');
		setAgentPhone('');
		setAgentAddress('');
	};

	const mutation = useMutation({
		mutationFn: (payload) =>
			axios.post(`${apiUrl}/assets`, payload, {
				headers: { Authorization: `Bearer ${user?.token}` },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['assets'] });
			queryClient.invalidateQueries({ queryKey: ['assets-dashboard'] });
			toast.success('Asset created successfully');
			resetForm();
			setShow(false);
		},
		onError: (err) => toast.error(getError(err)),
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		const price = parseFloat(purchasePrice);
		if (!name.trim()) return toast.error('Name is required');
		if (!price || price <= 0) return toast.error('Enter a valid purchase price');
		if (!purchaseDate) return toast.error('Purchase date is required');

		mutation.mutate({
			name: name.trim(),
			description: description.trim(),
			purchasePrice: price,
			purchaseDate,
			agent: {
				name: agentName.trim(),
				phone: agentPhone.trim(),
				address: agentAddress.trim(),
			},
		});
	};

	const isSubmitting = mutation.isPending;

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[280px] md:min-w-[520px] max-w-lg">
				<div className="p-5 space-y-3">
					{/* Header */}
					<div className="flex justify-between items-start">
						<h2 className="font-semibold text-lg text-blue-500">Add Asset</h2>
						<button
							onClick={() => setShow(false)}
							disabled={isSubmitting}
							className="m-1 p-1 shadow rounded-full bg-red-200 hover:bg-red-300 transition-colors disabled:opacity-50"
						>
							<HiXMark className="text-xl text-red-600" />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-3">
						{/* Name & Purchase Price */}
						<div className="flex gap-3">
							<div className="flex-1">
								<label className="text-sm text-black">
									Name <span className="text-red-600">*</span>
								</label>
								<input
									className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm mt-1"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									disabled={isSubmitting}
									placeholder="e.g. Toyota Hilux"
								/>
							</div>
							<div className="flex-1">
								<label className="text-sm text-black">
									Purchase Price (₦) <span className="text-red-600">*</span>
								</label>
								<input
									className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm mt-1"
									type="number"
									min="0"
									step="0.01"
									value={purchasePrice}
									onChange={(e) => setPurchasePrice(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
						</div>

						{/* Purchase Date */}
						<div>
							<label className="text-sm text-black">
								Purchase Date <span className="text-red-600">*</span>
							</label>
							<input
								className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm mt-1"
								type="date"
								value={purchaseDate}
								onChange={(e) => setPurchaseDate(e.target.value)}
								disabled={isSubmitting}
							/>
						</div>

						{/* Description */}
						<div>
							<label className="text-sm text-black">Description</label>
							<textarea
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mt-1"
								rows={2}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								disabled={isSubmitting}
								placeholder="Brief description of the asset"
							/>
						</div>

						{/* Agent Section */}
						<div>
							<p className="text-sm font-medium text-gray-700 mb-2">
								Agent / Supplier (optional)
							</p>
							<div className="flex gap-3">
								<div className="flex-1">
									<label className="text-xs text-gray-600">Name</label>
									<input
										className="w-full h-[38px] rounded-md border border-gray-300 px-3 text-sm mt-1"
										type="text"
										value={agentName}
										onChange={(e) => setAgentName(e.target.value)}
										disabled={isSubmitting}
									/>
								</div>
								<div className="flex-1">
									<label className="text-xs text-gray-600">Phone</label>
									<input
										className="w-full h-[38px] rounded-md border border-gray-300 px-3 text-sm mt-1"
										type="text"
										value={agentPhone}
										onChange={(e) => setAgentPhone(e.target.value)}
										disabled={isSubmitting}
									/>
								</div>
							</div>
							<div className="mt-2">
								<label className="text-xs text-gray-600">Address</label>
								<input
									className="w-full h-[38px] rounded-md border border-gray-300 px-3 text-sm mt-1"
									type="text"
									value={agentAddress}
									onChange={(e) => setAgentAddress(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 w-full flex items-center justify-center rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<span className="inline-flex items-center gap-2">
									<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
									Saving...
								</span>
							) : (
								'Add Asset'
							)}
						</button>
					</form>
				</div>
			</div>
		</Modal>
	);
};

export default AddAssetModal;
