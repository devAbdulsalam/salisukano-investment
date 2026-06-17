/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';
import { use } from 'react';

const AddModal = ({ show, setShow, setLoading, loading, account, openbal}) => {
	const { user } = useContext(AuthContext);
	const [balance, setBalance] = useState(0);
	const apiUrl = import.meta.env.VITE_API_URL;
	const config = {
		headers: {
			Authorization: `Bearer ${user?.token}`,
		},
	};
	// console.log('account', account);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const normalizedMonth = new Date(
		new Date(account?.month).getFullYear(),
		new Date(account?.month).getMonth(),
		1
	);
	useEffect(() => {
		setBalance(openbal || 0);
	}, [openbal]);
	const month = normalizedMonth.toLocaleDateString('en-GB', {
		month: 'long',
		year: 'numeric',
	});

	const mutation = useMutation({
		mutationFn: async (data) => {
			return axios.patch(
				`${apiUrl}/accounts/opening-balance`,
				data,
				config
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['transactions', account._id],
			});
			queryClient.invalidateQueries({
				queryKey: ['dashboard', 'accounts', 'transactions'],
			});
			queryClient.invalidateQueries({
				queryKey: [
					'dashboard',
					'accounts',
					'transactions',
					'customers',
					account._id,
				],
			});
			setBalance(0);
			setBalance(0);
			toast.success(' Account updated successfully');
			setShow(false);
			setLoading(false);
		},
		onError: (error) => {
			const message = getError(error);
			toast.error(message);
		},
	});

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!month) {
			return toast.error('Month is required');
		}

		setLoading(true);
		setShow(false);
		try {
			await mutation.mutateAsync({
				accountId: account._id,
				openingBalance: balance,
			});
		} catch (error) {
			const message = getError(error);
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin min-w-[280px] md:min-w-[450px]">
				<div className="space-y-2 p-4">
					<div className="flex justify-between">
						<div>
							<h2 className="font-semibold text-lg text-primary">{month}</h2>
						</div>
						<button
							onClick={() => setShow(false)}
							className="m-1 p-1 py-1 shadow rounded-full bg-red-200 hover:bg-red-300 duration-150 ease-in-out"
						>
							<HiXMark className="fa-solid fa-xmark text-xl text-red-600 hover:text-red-800" />
						</button>
					</div>

					<div className="">
						<div className="mb-5">
							<label className="mb-0 text-base text-black">
								Update Balance
							</label>
							<input
								className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
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
						<span>Update Account</span>
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default AddModal;
