/* eslint-disable react/prop-types */
import { useContext, useState } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import getError from '../../hooks/getError';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';
import { createAdvanceCredit } from '../../hooks/axiosApis';

const AdvanceCreditModal = ({ show, setShow, customerId }) => {
	const { user } = useContext(AuthContext);
	const [amount, setAmount] = useState('');
	const [date, setDate] = useState('');
	const [description, setDescription] = useState('');
	const [remark, setRemark] = useState('');
	const [loading, setLoading] = useState(false);

	const queryClient = useQueryClient();

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!amount || isNaN(amount) || Number(amount) <= 0) {
			return toast.error('Amount must be a valid positive number');
		}
		if (!date) {
			return toast.error('Date is required');
		}
		setLoading(true);
		try {
			await createAdvanceCredit({
				token: user?.token,
				id: customerId,
				payload: { amount: Number(amount), date, description, remark },
			});
			queryClient.invalidateQueries({ queryKey: ['advance', customerId] });
			toast.success('Credit entry added successfully');
			setAmount('');
			setDate('');
			setDescription('');
			setRemark('');
			setShow(false);
		} catch (error) {
			const message = getError(error);
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[450px] max-w-2xl">
				<div className="space-y-2 p-4">
					<div className="flex justify-between items-center">
						<h2 className="font-semibold text-lg text-green-600">
							New Credit Entry
						</h2>
						<button
							onClick={() => setShow(false)}
							className="m-1 p-1 shadow rounded-full bg-red-200 hover:bg-red-300 duration-150"
						>
							<HiXMark className="text-xl text-red-600 hover:text-red-800" />
						</button>
					</div>

					<div className="p-2 space-y-3">
						<div className="md:flex gap-2">
							<div className="flex-1 mb-2">
								<label className="mb-1 block text-sm font-medium text-gray-700">
									Amount (₦) <span className="text-red-600">*</span>
								</label>
								<input
									className="input w-full h-[44px] rounded-md border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
									type="number"
									min="0"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									placeholder="0.00"
								/>
							</div>
							<div className="flex-1 mb-2">
								<label className="mb-1 block text-sm font-medium text-gray-700">
									Date <span className="text-red-600">*</span>
								</label>
								<input
									className="input w-full h-[44px] rounded-md border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
								/>
							</div>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">
								Description
							</label>
							<input
								className="input w-full h-[44px] rounded-md border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
								type="text"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="e.g. Advance payment for October supply"
							/>
						</div>

						<div>
							<label className="mb-1 block text-sm font-medium text-gray-700">
								Remark
							</label>
							<textarea
								placeholder="Optional remark..."
								value={remark}
								onChange={(e) => setRemark(e.target.value)}
								className="input p-2 rounded-md h-[100px] resize-none w-full border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
							/>
						</div>
					</div>

					<button
						disabled={loading}
						className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold h-10 w-full flex items-center justify-center rounded-md transition-all duration-300"
						onClick={handleSubmit}
					>
						{loading ? 'Saving…' : 'Save Credit'}
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default AdvanceCreditModal;
