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

const AddCommissionModal = ({
	show,
	setShow,
	net,
	commission,
	setCommission,
}) => {
	const [loading, setLoading] = useState(false);
	const { user } = useContext(AuthContext);
	const apiUrl = import.meta.env.VITE_API_URL;
	const config = {
		headers: {
			Authorization: `Bearer ${user?.token}`,
		},
	};
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const handleSubmit = (e) => {
		e.preventDefault();
		if (!commission) {
			return toast.error('Commission is required');
		}
		setLoading(true);
		setShow(false);
		try {
			axios
				.post(`${apiUrl}/waybills/commission`, { net, commission }, config)
				.then((res) => {
					if (res.data) {
						queryClient.invalidateQueries({
							queryKey: ['dashboard', 'waybills', 'customers'],
						});
						toast.success('Account created successfully');
					}
					navigate('/waybills');
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
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin max-w-2xl  md:min-w-[450px]">
				<div className="space-y-5 p-4">
					<div className="flex justify-between">
						<div>
							<p className="font-semibold text-lg text-primary">
								Add Incentive
							</p>
						</div>
						<button
							onClick={() => setShow(false)}
							className="m-1 p-1 py-1 shadow rounded-full bg-red-200 hover:bg-red-300 duration-150 ease-in-out"
						>
							<HiXMark className="fa-solid fa-xmark text-xl text-red-600 hover:text-red-800" />
						</button>
					</div>

					<div className="flex flex-col gap-2 p-2 ">
						<div className="mb-5">
							<label className="mb-0 text-base text-black">
								Net<span className="text-red-500">*</span>
							</label>
							<input
								className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
								type="tel"
								value={net}
								disabled
							/>
						</div>
						<div className="mb-5">
							<label className="mb-0 text-base text-black">
								Commission <span className="text-red-500">*</span>
							</label>
							<input
								className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
								type="number"
								value={commission}
								onChange={(e) => setCommission(e.target.value)}
							/>
							<span className="text-tiny leading-4">
								Enter commission amount.
							</span>
						</div>

						<h2 className="text-sm text-gray-500 font-bold text-center">
							Total amount: {commission * net}
						</h2>
					</div>
					<button
						disabled={loading}
						className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 py-1 w-full flex items-center justify-center rounded-md transition-all duration-500 ease-in-out"
						onClick={() => {
							setShow(false);
							toast.success('Incentive updated successfully');
						}}
					>
						{loading ? 'Loading...' : 'Add Incentive'}
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default AddCommissionModal;
