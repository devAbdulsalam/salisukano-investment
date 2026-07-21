import { useContext, useState } from 'react';
import AuthContext from '../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../hooks/getError';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

const NewAsset = () => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const apiUrl = import.meta.env.VITE_API_URL;

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [purchasePrice, setPurchasePrice] = useState('');
	const [purchaseDate, setPurchaseDate] = useState('');
	const [agentName, setAgentName] = useState('');
	const [agentPhone, setAgentPhone] = useState('');
	const [agentAddress, setAgentAddress] = useState('');
	const [serialNumber, setSerialNumber] = useState('');

	const mutation = useMutation({
		mutationFn: (payload) =>
			axios.post(`${apiUrl}/assets`, payload, {
				headers: { Authorization: `Bearer ${user?.token}` },
			}),
		onSuccess: (res) => {
			queryClient.invalidateQueries({ queryKey: ['assets'] });
			queryClient.invalidateQueries({ queryKey: ['assets-dashboard'] });
			toast.success('Asset created successfully');
			navigate(`/assets/${res.data.data._id}`);
		},
		onError: (err) => toast.error(getError(err)),
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		const price = parseFloat(purchasePrice);
		if (!name.trim()) return toast.error('Name is required');
		if (!price || price <= 0)
			return toast.error('Enter a valid purchase price');
		if (!purchaseDate) return toast.error('Purchase date is required');

		mutation.mutate({
			name: name.trim(),
			description: description.trim(),
			purchasePrice: price,
			purchaseDate,
			serialNumber,
			agent: {
				name: agentName.trim(),
				phone: agentPhone.trim(),
				address: agentAddress.trim(),
			},
		});
	};

	const isSubmitting = mutation.isPending;

	return (
		<main>
			<div className="p-3 md:p-6 bg-gray-50 min-h-screen">
				{/* Header */}
				<div className="mb-6">
					<button
						onClick={() => navigate('/assets')}
						className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-3"
					>
						<ArrowLeft size={15} /> Back to Assets
					</button>
					<h1 className="text-xl md:text-2xl font-bold text-gray-800">
						Add New Asset
					</h1>
					<p className="text-sm text-gray-500 mt-1">
						Record a new company asset
					</p>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="grid md:grid-cols-2 gap-6">
						{/* Left column */}
						<div className="space-y-5">
							{/* Basic Info */}
							<div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
								<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
									Basic Information
								</h2>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Asset Name <span className="text-red-500">*</span>
										</label>
										<input
											className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											type="text"
											value={name}
											onChange={(e) => setName(e.target.value)}
											disabled={isSubmitting}
											placeholder="e.g. Toyota Hilux, Office Generator"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Asset Number <span className="text-red-500">*</span>
										</label>
										<input
											className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											type="text"
											value={serialNumber}
											onChange={(e) => setSerialNumber(e.target.value)}
											disabled={isSubmitting}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Purchase Price (₦) <span className="text-red-500">*</span>
										</label>
										<input
											className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											type="number"
											min="0"
											step="0.01"
											value={purchasePrice}
											onChange={(e) => setPurchasePrice(e.target.value)}
											disabled={isSubmitting}
											placeholder="0.00"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Purchase Date <span className="text-red-500">*</span>
										</label>
										<input
											className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											type="date"
											value={purchaseDate}
											onChange={(e) => setPurchaseDate(e.target.value)}
											disabled={isSubmitting}
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Description
									</label>
									<textarea
										className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										rows={6}
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										disabled={isSubmitting}
										placeholder="Brief description of the asset, condition, model, etc."
									/>
								</div>
							</div>
						</div>

						{/* Right column — Agent */}
						<div className="space-y-5">
							<div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
								<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
									Agent / Supplier{' '}
									<span className="text-gray-400 font-normal normal-case">
										(optional)
									</span>
								</h2>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Name
									</label>
									<input
										className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										type="text"
										value={agentName}
										onChange={(e) => setAgentName(e.target.value)}
										disabled={isSubmitting}
										placeholder="Supplier or agent name"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Phone
									</label>
									<input
										className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										type="text"
										value={agentPhone}
										onChange={(e) => setAgentPhone(e.target.value)}
										disabled={isSubmitting}
										placeholder="e.g. 08012345678"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Address
									</label>
									<textarea
										className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										rows={2}
										value={agentAddress}
										onChange={(e) => setAgentAddress(e.target.value)}
										disabled={isSubmitting}
										placeholder="Supplier address"
									/>
								</div>
							</div>

							{/* Submit */}
							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSubmitting ? (
									<>
										<svg
											className="animate-spin h-4 w-4"
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
										Saving...
									</>
								) : (
									<>
										<Save size={16} /> Save Asset
									</>
								)}
							</button>
						</div>
					</div>
				</form>
			</div>
		</main>
	);
};

export default NewAsset;
