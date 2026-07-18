/* eslint-disable react/prop-types */
import { useContext, useState } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';

const currency = (v) =>
	Number(v || 0).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

const SellAssetModal = ({ show, setShow, asset }) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const apiUrl = import.meta.env.VITE_API_URL;

	const [salePrice, setSalePrice] = useState('');
	const [saleDate, setSaleDate] = useState('');

	const totalCost = asset
		? asset.purchasePrice +
		  (asset.maintenances || []).reduce((s, m) => s + m.cost, 0)
		: 0;

	const previewMargin =
		salePrice && !isNaN(parseFloat(salePrice))
			? parseFloat(salePrice) - totalCost
			: null;

	const mutation = useMutation({
		mutationFn: (payload) =>
			axios.post(`${apiUrl}/assets/${asset._id}/sell`, payload, {
				headers: { Authorization: `Bearer ${user?.token}` },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['assets', asset._id] });
			queryClient.invalidateQueries({ queryKey: ['assets'] });
			queryClient.invalidateQueries({ queryKey: ['assets-dashboard'] });
			toast.success('Asset marked as sold');
			setSalePrice('');
			setSaleDate('');
			setShow(false);
		},
		onError: (err) => toast.error(getError(err)),
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		const price = parseFloat(salePrice);
		if (!price || price <= 0) return toast.error('Enter a valid sale price');
		mutation.mutate({ salePrice: price, saleDate: saleDate || undefined });
	};

	const isSubmitting = mutation.isPending;

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[280px] md:min-w-[420px]">
				<div className="p-5 space-y-3">
					<div className="flex justify-between items-start">
						<h2 className="font-semibold text-lg text-blue-600">Sell Asset</h2>
						<button
							onClick={() => setShow(false)}
							disabled={isSubmitting}
							className="m-1 p-1 shadow rounded-full bg-red-200 hover:bg-red-300 transition-colors disabled:opacity-50"
						>
							<HiXMark className="text-xl text-red-600" />
						</button>
					</div>

					{asset && (
						<div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
							<p className="font-medium text-gray-800">{asset.name}</p>
							<p className="text-gray-500">
								Total Cost (purchase + maintenance):{' '}
								<span className="font-semibold text-gray-700">
									₦{currency(totalCost)}
								</span>
							</p>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-3">
						<div className="flex gap-3">
							<div className="flex-1">
								<label className="text-sm text-black">
									Sale Price (₦) <span className="text-red-600">*</span>
								</label>
								<input
									className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm mt-1"
									type="number"
									min="0"
									step="0.01"
									value={salePrice}
									onChange={(e) => setSalePrice(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
							<div className="flex-1">
								<label className="text-sm text-black">Sale Date</label>
								<input
									className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm mt-1"
									type="date"
									value={saleDate}
									onChange={(e) => setSaleDate(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
						</div>

						{previewMargin !== null && (
							<div
								className={`rounded-lg p-3 text-sm font-medium ${
									previewMargin >= 0
										? 'bg-green-50 text-green-700'
										: 'bg-red-50 text-red-700'
								}`}
							>
								Projected Margin:{' '}
								{previewMargin >= 0 ? '+' : ''}₦{currency(previewMargin)}
								{totalCost > 0 && (
									<span className="ml-2 font-normal opacity-75">
										({((previewMargin / totalCost) * 100).toFixed(1)}%)
									</span>
								)}
							</div>
						)}

						<p className="text-xs text-gray-500">
							This action will mark the asset as sold and cannot be easily
							reversed.
						</p>

						<button
							type="submit"
							disabled={isSubmitting}
							className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 w-full flex items-center justify-center rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<span className="inline-flex items-center gap-2">
									<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
									Processing...
								</span>
							) : (
								'Confirm Sale'
							)}
						</button>
					</form>
				</div>
			</div>
		</Modal>
	);
};

export default SellAssetModal;
