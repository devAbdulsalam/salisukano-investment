/* eslint-disable react/prop-types */
import { useContext, useState } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';
import { formatMonthYearWat } from '../../utils/watDate';

const statusData = [
	{ name: 'Inactive', value: 'inactive' },
	{ name: 'Active', value: 'active' },
];

const AddModal = ({ show, setShow, setLoading, loading, account }) => {
	const { user } = useContext(AuthContext);
	const [status, setStatus] = useState('inactive');
	const apiUrl = import.meta.env.VITE_API_URL;
	const config = {
		headers: {
			Authorization: `Bearer ${user?.token}`,
		},
	};
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const month = formatMonthYearWat(account?.month);
	const handleSubmit = (e) => {
		e.preventDefault();
		if (status == account?.status) {
			setShow(false);
			return;
		}
		setLoading(true);
		setShow(false);
		try {
			axios
				.patch(
					`${apiUrl}/accounts/status`,
					{ accountId: account._id, status },
					config
				)
				.then((res) => {
					if (res.data) {
						queryClient.invalidateQueries({
							queryKey: ['dashboard', 'accounts'],
						});
						toast.success(' Account updated successfully');
					}
					setStatus('inactive');
					navigate('/companies');
				})
				.catch((error) => {
					const message = getError(error);
					toast.error(message);
				})
				.finally(() => {
					setLoading(false);
				});
		} catch (error) {
			console.log(error);
			setShow(true);
		}
	};

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[450px] max-w-2xl">
				<div className="space-y-5 p-4">
					<div className="flex justify-between">
						<div>
							<h2 className="font-semibold text-lg text-primary">
								Update Account
							</h2>
						</div>
						<button
							onClick={() => setShow(false)}
							className="m-1 p-1 py-1 shadow rounded-full bg-red-200 hover:bg-red-300 duration-150 ease-in-out"
						>
							<HiXMark className="fa-solid fa-xmark text-xl text-red-600 hover:text-red-800" />
						</button>
					</div>

					<div className="p-2 ">
						<h2 className="font-semibold text-lg text-primary">
							Change {month} from {account?.status} to{' '}
							<span
								className={`p-1 rounded-md capitalize ${
									status === 'active'
										? 'border-b bg-[#10B860] text-white'
										: 'text-[#637381]'
								}`}
							>
								{status}
							</span>
						</h2>
						<div className="mb-5">
							<p className="mb-0 text-base text-black">Materials</p>
							<select
								className="input w-full h-[44px] rounded-md border border-gray6 px-6 text-base"
								value={status}
								onChange={(e) => setStatus(e.target.value)}
							>
								{statusData?.map((data, idx) => (
									<option key={idx} value={data.value}>
										{data.name}
									</option>
								))}
							</select>
						</div>
					</div>
					<button
						disabled={loading}
						className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 py-1 w-full flex items-center justify-center rounded-md transition-all duration-500 ease-in-out"
						onClick={handleSubmit}
					>
						<span>Update Status</span>
						<i className="fa-solid fa-delete text-2xl text-primary"></i>
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default AddModal;
