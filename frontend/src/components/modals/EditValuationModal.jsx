/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';

// record = { _id, valuation, valuationDate, remark }
const EditValuationModal = ({ show, setShow, assetId, record }) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const apiUrl = import.meta.env.VITE_API_URL;

	const [valuation, setValuation] = useState('');
	const [valuationDate, setValuationDate] = useState('');
	const [remark, setRemark] = useState('');

	useEffect(() => {
		if (record) {
			setValuation(record.valuation ?? '');
			setValuationDate(
				record.valuationDate ? record.valuationDate.split('T')[0] : '',
			);
			setRemark(record.remark ?? '');
		}
	}, [record]);

	const mutation = useMutation({
		mutationFn: (payload) =>
			axios.patch(
				`${apiUrl}/assets/${assetId}/valuation/${record._id}`,
				payload,
				{ headers: { Authorization: `Bearer ${user?.token}` } },
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['assets', assetId] });
			queryClient.invalidateQueries({ queryKey: ['assets'] });
			queryClient.invalidateQueries({ queryKey: ['assets-dashboard'] });
			toast.success('Valuation updated');
			setShow(false);
		},
		onError: (err) => toast.error(getError(err)),
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		const val = parseFloat(valuation);
		if (!val || val <= 0) return toast.error('Enter a valid valuation amount');
		if (!valuationDate) return toast.error('Valuation date is required');
		mutation.mutate({ valuation: val, valuationDate, remark: remark.trim() });
	};

	const isSubmitting = mutation.isPending;

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[280px] md:min-w-[420px]">
				<div className="p-5 space-y-3">
					<div className="flex justify-between items-start">
						<h2 className="font-semibold text-lg text-green-600">
							Edit Valuation
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
									Current Value (₦) <span className="text-red-600">*</span>
								</label>
								<input
									className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
									type="number"
									min="0"
									step="0.01"
									value={valuation}
									onChange={(e) => setValuation(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
							<div className="flex-1">
								<label className="text-sm text-black">
									Valuation Date <span className="text-red-600">*</span>
								</label>
								<input
									className="w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
									type="date"
									value={valuationDate}
									onChange={(e) => setValuationDate(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
						</div>

						<div>
							<label className="text-sm text-black">Remark</label>
							<textarea
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
								rows={2}
								value={remark}
								onChange={(e) => setRemark(e.target.value)}
								disabled={isSubmitting}
								placeholder="e.g. Annual appraisal"
							/>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="bg-green-600 hover:bg-green-700 text-white font-semibold h-10 w-full flex items-center justify-center rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
								'Save Changes'
							)}
						</button>
					</form>
				</div>
			</div>
		</Modal>
	);
};

export default EditValuationModal;
