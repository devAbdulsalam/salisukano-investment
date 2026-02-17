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

const AddModal = ({ show, setShow, setLoading, loading }) => {
	const { user } = useContext(AuthContext);
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState('user');
	const [cPassword, setCPassword] = useState('');
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
		if (!name) {
			return toast.error('Name is required');
		}
		if (!email) {
			return toast.error('Email is required');
		}
		if (!password || !cPassword) {
			return toast.error('Password is required');
		}
		if (cPassword !== password) {
			return toast.error('Password must match');
		}
		setLoading(true);
		setShow(false);
		try {
			axios
				.post(
					`${apiUrl}/users/register`,
					{ name, email, password, role, phone },
					config,
				)
				.then((res) => {
					if (res.data) {
						queryClient.invalidateQueries({
							queryKey: ['dashboard', 'accounts', 'users'],
						});
						queryClient.invalidateQueries({
							queryKey: ['users'],
						});
						toast.success('Account created successfully');
					}
					setName('');
					setPhone('');
					setEmail('');
					setPassword('');
					setCPassword('');
					navigate('/users');
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
			const message = getError(error);
			toast.error(message);
			setShow(true);
		}
	};

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin max-w-2xl  md:min-w-[450px]">
				<div className="space-y-5 p-4">
					<div className="flex justify-between">
						<div>
							<p className="font-semibold text-lg text-primary">New User</p>
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
								Name <span className="text-red-500">*</span>
							</label>
							<input
								className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
							<span className="text-tiny leading-4">Enter name.</span>
						</div>
						<div className="mb-5">
							<label className="mb-0 text-base text-black">
								Phone <span className="text-red-500">*</span>
							</label>
							<input
								className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
							/>
						</div>
						<div className="mb-5">
							<label className="mb-0 text-base text-black">
								Email <span className="text-red-500">*</span>
							</label>
							<input
								className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
						<div className="mb-5">
							<label className="mb-0 text-base text-black">
								Role <span className="text-red-500">*</span>
							</label>
							<select
								value={role}
								onChange={(e) => setRole(e.target.value)}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="admin">Admin</option>
								<option value="secretary">Secretary</option>
								<option value="finance">Finance</option>
								<option value="operation">Operations</option>
							</select>
						</div>
						<div className="mb-5">
							<label className="mb-0 text-base text-black">
								Password <span className="text-red-500">*</span>
							</label>
							<input
								className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
								type="text"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						<div className="mb-5">
							<label className="mb-0 text-base text-black">
								Confirm Password <span className="text-red-500">*</span>
							</label>
							<input
								className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
								type="text"
								value={cPassword}
								onChange={(e) => setCPassword(e.target.value)}
							/>
						</div>
					</div>

					<button
						disabled={loading}
						className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 py-1 w-full flex items-center justify-center rounded-md transition-all duration-500 ease-in-out"
						onClick={handleSubmit}
					>
						<span>Add User</span>
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default AddModal;
