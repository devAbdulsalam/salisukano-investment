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

const AddModal = ({ show, setShow, setLoading, loading, account }) => {
	const { user } = useContext(AuthContext);
	const [balance, setBalance] = useState(0);

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
		if (!balance) {
			return toast.error('Balance is required');
		}
		setLoading(true);
		setShow(false);
		try {
			axios
				.patch(
					`${apiUrl}/customers/opening-balance`,
					{ accountId: account._id, openingBalance: balance },
					config
				)
				.then((res) => {
					if (res.data) {
						queryClient.invalidateQueries({
							queryKey: ['dashboard', 'accounts'],
						});
						toast.success(' Account created successfully');
					}
					setBalance(0);
					navigate('/accounts');
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
								Update Opening Balance
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
							Account {month}
						</h2>
						<div className="mb-5">
							<label className="mb-0 text-base text-black">
								Openinig Bal. <span className="text-red-500">*</span>
							</label>
							<input
								className="input w-full h-[44px] rounded-md border border-gray6 px-6 text-base"
								type="number"
								value={balance}
								onChange={(e) => setBalance(e.target.value)}
							/>
							<span className="text-tiny leading-4">
								Balance brought forward.
							</span>
						</div>
					</div>
					<button
						disabled={loading}
						className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 py-1 w-full flex items-center justify-center rounded-md transition-all duration-500 ease-in-out"
						onClick={handleSubmit}
					>
						<span>Update Accountt</span>
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default AddModal;
