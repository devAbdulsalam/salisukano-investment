/* eslint-disable react/prop-types */
import { useContext, useState } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';

const AddMaintenanceModal = ({ show, setShow, assetId }) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const apiUrl = import.meta.env.VITE_API_URL;

	const [cost, setCost] = useState('');
	const [date, setDate] = useState('');
	const [remark, setRemark] = useState('');

	const resetForm = () => {
		setCost('');
		setDate('');
		setRemark('');
	};

	const mutation = useMutation({
		mutationFn: (payload) =>
			axios.post(`${apiUrl}/assets/${assetId}/maintenance`, payload, {
				headers: { Authorization: `Bearer ${user?.token}` },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['assets', assetId] });
			queryClient.invalidateQueries({ queryKey: ['assets'] });
			queryClient.invalidateQueries({ queryKey: ['assets-dashboard'] });
			toast.success('Maintenance record added');
			resetForm();
			setShow(false);
		},
		onError: (err) => toast.error(getError(err)),
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		const parsedCost = parseFloat(cost);
		if (!parsedCost || parsedCost <= 0) return toast.error('Enter a valid cost');
		if (!date) return toast.error('Date is required');
		mutation.mutate({ cost: parsedCost, date, remark: remark.trim() });
	};

	const isSubmitting = mutation.isPending;

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[280px] md:min-w-[420px]">
				<div className="p-5 space-y-3">
					<div className="flex justify-between items-start">
						<h2 className="font-semibold text-lg text-orange-500">
							Add Maintenance
						</h2>
						<button
							onClick={() => setShow(false)}
							disabled={isSubmitting}
							className="m-1 p-1 shadow rounded-full bg-red-200 hover:bg-red-300 transition-colors disabled:opacity-50"
						>
							<HiXMark className="text-xl text-red-600" />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-3">
						<div className="flex gap-3">
							<div className="flex-1">
								<label className="text-sm text-black">
									Cost (₦) <span className="text-red-600">*</span>
								</label>
								<input
									className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm mt-1"
									type="number"
									min="0"
									step="0.01"
									value={cost}
									onChange={(e) => setCost(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
							<div className="flex-1">
								<label className="text-sm text-black">
									Date <span className="text-red-600">*</span>
								</label>
								<input
									className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm mt-1"
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
						</div>

						<div>
							<label className="text-sm text-black">Remark</label>
							<textarea
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mt-1"
								rows={2}
								value={remark}
								onChange={(e) => setRemark(e.target.value)}
								disabled={isSubmitting}
								placeholder="What was done?"
							/>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="bg-orange-500 hover:bg-orange-600 text-white font-semibold h-10 w-full flex items-center justify-center rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
								'Add Maintenance'
							)}
						</button>
					</form>
				</div>
			</div>
		</Modal>
	);
};

export default AddMaintenanceModal;
