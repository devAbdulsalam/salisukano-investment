/* eslint-disable react/prop-types */
import { useContext, useState } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import getError from '../../hooks/getError';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';
import { deleteAdvanceTransaction } from '../../hooks/axiosApis';

const AdvanceDeleteModal = ({ show, setShow, customerId, transaction }) => {
	const { user } = useContext(AuthContext);
	const [loading, setLoading] = useState(false);
	const queryClient = useQueryClient();

	const handleDelete = async () => {
		setLoading(true);
		try {
			await deleteAdvanceTransaction({
				token: user?.token,
				id: customerId,
				transactionId: transaction._id,
			});
			queryClient.invalidateQueries({ queryKey: ['advance', customerId] });
			toast.success('Transaction deleted');
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
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[380px] max-w-md">
				<div className="p-5 space-y-4">
					<div className="flex justify-between items-center">
						<h2 className="font-semibold text-lg text-gray-800">
							Delete Transaction
						</h2>
						<button
							onClick={() => setShow(false)}
							className="p-1 shadow rounded-full bg-red-200 hover:bg-red-300 duration-150"
						>
							<HiXMark className="text-xl text-red-600" />
						</button>
					</div>
					<p className="text-sm text-gray-600">
						Are you sure you want to delete this transaction? Running balances
						will be recalculated automatically. This action cannot be undone.
					</p>
					<div className="flex gap-3">
						<button
							onClick={() => setShow(false)}
							className="flex-1 border border-gray-300 text-gray-700 h-10 rounded-md text-sm hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							disabled={loading}
							onClick={handleDelete}
							className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white h-10 rounded-md text-sm font-medium transition-colors"
						>
							{loading ? 'Deleting…' : 'Delete'}
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default AdvanceDeleteModal;
