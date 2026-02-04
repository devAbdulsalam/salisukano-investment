/* eslint-disable react/prop-types */
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../../hooks/getError';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { HiXMark } from 'react-icons/hi2';

const EditModal = ({ show, setShow, setLoading, loading, customer }) => {
	const { user } = useContext(AuthContext);
	const [password, setPassword] = useState('');
	const [cPassword, setCPassword] = useState('');
	const apiUrl = import.meta.env.VITE_API_URL;

	useEffect(() => {
		setCPassword('');
		setPassword('');
	}, [customer]);
	const config = {
		headers: {
			Authorization: `Bearer ${user?.token}`,
		},
	};
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const handleSubmit = (e) => {
		e.preventDefault();
		if (!password) {
			return toast.error('Password is required');
		}
		if (!cPassword) {
			return toast.error('Confirm Password is required');
		}
		if (password !== cPassword) {
			return toast.error('Passwords must match');
		}

		setLoading(true);
		setShow(false);
		try {
			axios
				.patch(
					`${apiUrl}/users/admin-update-password`,
					{ userId: customer?._id, newPassword: password },
					config,
				)
				.then((res) => {
					if (res.data) {
						queryClient.invalidateQueries({
							queryKey: ['dashboard', 'users'],
						});
						queryClient.invalidateQueries({
							queryKey: ['users'],
						});
						toast.success('Password updated successfully');
					}
					navigate(`/users`);
				})
				.catch((error) => {
					const message = getError(error);
					toast.error(message);
				})
				.finally(() => {
					setPassword('');
					setCPassword('');
					setLoading(false);
				});
		} catch (error) {
			console.log(error);
			const message = getError(error);
			toast.error(message);
			setShow(true);
		}
	};

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin max-w-2xl md:min-w-[450px]">
				<div className="space-y-5 p-4">
					<div className="flex justify-between">
						<div>
							<p className="font-semibold text-lg text-primary">
								{customer?.name}
							</p>
							<p className="font-semibold text-sm text-primary">
								Edit Password
							</p>
						</div>
						<button
							onClick={() => setShow(false)}
							className="m-1 p-1 py-1 shadow rounded-full bg-red-200 hover:bg-red-300 duration-150 ease-in-out"
						>
							<HiXMark className="fa-solid fa-xmark text-xl text-red-600 hover:text-red-800" />
						</button>
					</div>

					<div className="mb-5">
						<label className="mb-0 text-base text-black">
							Password <span className="text-red-500">*</span>
						</label>
						<input
							className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
							type="tel"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>
					<div className="mb-5">
						<label className="mb-0 text-base text-black">
							Password <span className="text-red-500">*</span>
						</label>
						<input
							className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
							type="tel"
							value={cPassword}
							onChange={(e) => setCPassword(e.target.value)}
						/>
					</div>
					<button
						disabled={loading}
						className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 py-1 w-full flex items-center justify-center rounded-md transition-all duration-500 ease-in-out"
						onClick={handleSubmit}
					>
						<span>Update Password</span>
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default EditModal;
