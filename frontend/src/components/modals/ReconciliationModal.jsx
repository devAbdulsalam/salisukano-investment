/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import getError from '../../hooks/getError';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark, HiPlus, HiTrash } from 'react-icons/hi2';
import { createReconciliationApi, updateReconciliationApi } from '../../hooks/axiosApis';
import moment from 'moment';

// Pass `reconciliation` prop to enter edit mode
const ReconciliationModal = ({ show, setShow, customerId, reconciliation }) => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const isEdit = Boolean(reconciliation);

	const [month, setMonth] = useState('');
	const [totalFromLedger, setTotalFromLedger] = useState('');
	const [lessBank, setLessBank] = useState('');
	const [deductions, setDeductions] = useState([{ description: '', amount: '' }]);
	const [notes, setNotes] = useState('');
	const [preparedBy, setPreparedBy] = useState('Salisu Kano');

	// Pre-fill when editing
	useEffect(() => {
		if (reconciliation) {
			setMonth(moment(reconciliation.month).format('YYYY-MM'));
			setTotalFromLedger(String(reconciliation.totalFromLedger ?? ''));
			setLessBank(String(reconciliation.lessBank ?? ''));
			setDeductions(
				reconciliation.deductions?.length
					? reconciliation.deductions.map((d) => ({
							description: d.description,
							amount: String(d.amount),
					  }))
					: [{ description: '', amount: '' }]
			);
			setNotes(reconciliation.notes ?? '');
			setPreparedBy(reconciliation.preparedBy ?? 'Salisu Kano');
		} else {
			resetForm();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reconciliation]);

	const createMutation = useMutation({
		mutationFn: (payload) => createReconciliationApi({ user, payload }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reconciliations', customerId] });
			toast.success('Reconciliation created');
			resetForm();
			setShow(false);
		},
		onError: (error) => toast.error(getError(error)),
	});

	const updateMutation = useMutation({
		mutationFn: (payload) =>
			updateReconciliationApi({ user, id: reconciliation._id, payload }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reconciliations', customerId] });
			queryClient.invalidateQueries({
				queryKey: ['reconciliation', reconciliation._id],
			});
			toast.success('Reconciliation updated');
			setShow(false);
		},
		onError: (error) => toast.error(getError(error)),
	});

	const resetForm = () => {
		setMonth('');
		setTotalFromLedger('');
		setLessBank('');
		setDeductions([{ description: '', amount: '' }]);
		setNotes('');
		setPreparedBy('Salisu Kano');
	};

	const addDeduction = () =>
		setDeductions((prev) => [...prev, { description: '', amount: '' }]);

	const removeDeduction = (i) =>
		setDeductions((prev) => prev.filter((_, idx) => idx !== i));

	const updateDeduction = (i, field, value) =>
		setDeductions((prev) =>
			prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d))
		);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!month) return toast.error('Month is required');
		if (!totalFromLedger) return toast.error('Total from Ledger is required');

		const cleanDeductions = deductions
			.filter((d) => d.description.trim() && d.amount !== '')
			.map((d) => ({
				description: d.description.trim(),
				amount: Number(d.amount),
			}));

		const payload = {
			customerId,
			month,
			totalFromLedger: Number(totalFromLedger),
			lessBank: Number(lessBank) || 0,
			deductions: cleanDeductions,
			notes,
			preparedBy,
		};

		if (isEdit) {
			updateMutation.mutate(payload);
		} else {
			createMutation.mutate(payload);
		}
	};

	const isSubmitting = createMutation.isPending || updateMutation.isPending;

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[300px] md:min-w-[540px] max-h-[90vh] overflow-y-auto">
				<div className="space-y-2 p-5">
					{/* Header */}
					<div className="flex justify-between items-start">
						<h2 className="font-semibold text-lg text-blue-500">
							{isEdit ? 'Edit Reconciliation' : 'New Reconciliation'}
						</h2>
						<button
							onClick={() => {
								setShow(false);
								if (!isEdit) resetForm();
							}}
							disabled={isSubmitting}
							className="m-1 p-1 shadow rounded-full bg-red-200 hover:bg-red-300 transition-colors disabled:opacity-50"
						>
							<HiXMark className="text-xl text-red-600" />
						</button>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Month + Prepared By */}
						<div className="md:flex gap-3">
							<div className="flex-1 mb-2">
								<label className="text-sm font-medium text-gray-700">
									Month <span className="text-red-500">*</span>
								</label>
								<input
									type="month"
									className="mt-1 input w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm"
									value={month}
									onChange={(e) => setMonth(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
							<div className="flex-1 mb-2">
								<label className="text-sm font-medium text-gray-700">
									Prepared By
								</label>
								<input
									type="text"
									className="mt-1 input w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm"
									value={preparedBy}
									onChange={(e) => setPreparedBy(e.target.value)}
									disabled={isSubmitting}
								/>
							</div>
						</div>

						{/* Total from Ledger */}
						<div>
							<label className="text-sm font-medium text-gray-700">
								Total From Ledger @ Company (₦){' '}
								<span className="text-red-500">*</span>
							</label>
							<input
								type="number"
								min="0"
								step="0.01"
								className="mt-1 input w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm"
								value={totalFromLedger}
								onChange={(e) => setTotalFromLedger(e.target.value)}
								disabled={isSubmitting}
							/>
						</div>

						{/* Less: Bank @ SKIL */}
						<div>
							<label className="text-sm font-medium text-gray-700">
								Less: Bank @ SKIL (₦)
							</label>
							<input
								type="number"
								min="0"
								step="0.01"
								className="mt-1 input w-full h-[42px] rounded-md border border-gray-300 px-3 text-sm"
								value={lessBank}
								onChange={(e) => setLessBank(e.target.value)}
								disabled={isSubmitting}
							/>
						</div>

						{/* Additional Deductions */}
						<div>
							<div className="flex justify-between items-center mb-1">
								<label className="text-sm font-medium text-gray-700">
									Less: Additional Deductions
								</label>
								<button
									type="button"
									onClick={addDeduction}
									disabled={isSubmitting}
									className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
								>
									<HiPlus /> Add Line
								</button>
							</div>
							<div className="space-y-2">
								{deductions.map((d, i) => (
									<div key={i} className="flex gap-2 items-center">
										<input
											type="text"
											placeholder="Description (e.g. K.C Contractor)"
											className="flex-1 input h-[38px] rounded-md border border-gray-300 px-3 text-sm"
											value={d.description}
											onChange={(e) =>
												updateDeduction(i, 'description', e.target.value)
											}
											disabled={isSubmitting}
										/>
										<input
											type="number"
											min="0"
											step="0.01"
											placeholder="Amount"
											className="w-32 input h-[38px] rounded-md border border-gray-300 px-3 text-sm"
											value={d.amount}
											onChange={(e) =>
												updateDeduction(i, 'amount', e.target.value)
											}
											disabled={isSubmitting}
										/>
										{deductions.length > 1 && (
											<button
												type="button"
												onClick={() => removeDeduction(i)}
												disabled={isSubmitting}
												className="text-red-400 hover:text-red-600"
											>
												<HiTrash />
											</button>
										)}
									</div>
								))}
							</div>
						</div>

						{/* Notes */}
						<div>
							<label className="text-sm font-medium text-gray-700">
								Notes (optional)
							</label>
							<textarea
								rows={2}
								className="mt-1 input w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								disabled={isSubmitting}
							/>
						</div>

						<button
							type="submit"
							disabled={isSubmitting}
							className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 w-full flex items-center justify-center rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<span className="inline-flex items-center gap-2">
									<svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
									{isEdit ? 'Updating...' : 'Saving...'}
								</span>
							) : isEdit ? (
								'Update Reconciliation'
							) : (
								'Create Reconciliation'
							)}
						</button>
					</form>
				</div>
			</div>
		</Modal>
	);
};

export default ReconciliationModal;
