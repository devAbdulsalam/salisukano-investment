/* eslint-disable react/prop-types */
import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../hooks/getError';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import Loader from '../components/Loader.jsx';
import CustomersInput from '../components/CustomersInput.jsx';
import { fetchTransaction } from '../hooks/axiosApis.js';
import { toInputDateWat } from '../utils/watDate';

const EditPayment = () => {
	const { user } = useContext(AuthContext);
	const [loading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();
	const { id } = useParams();
	const { data, isLoading, error } = useQuery({
		queryKey: ['transactions', id],
		queryFn: () => fetchTransaction({ user, id }),
	});
	const [name, setName] = useState('');
	const [amount, setAmount] = useState(0);
	const [description, setDescription] = useState('');
	const [date, setDate] = useState('');
	const [dateError, setDateError] = useState('');

	const apiUrl = import.meta.env.VITE_API_URL;
	const config = {
		headers: {
			Authorization: `Bearer ${user?.token}`,
		},
	};
	const navigate = useNavigate();

	useEffect(() => {
		if (data) {
			setName(data?.name);
			setAmount(data?.total || data?.debit);
			setDescription(data?.description);
			console.log('data?.date', data?.date);
			setDate(toInputDateWat(data?.date) || data?.date);
		}
		if (error) {
			toast.error(error?.message);
		}
	}, [data, error]);

	const mutation = useMutation({
		mutationFn: async (data) => {
			return axios.patch(`${apiUrl}/payments/${id}`, data, config);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['dashboard', 'accounts', 'customers', id],
			});
			queryClient.invalidateQueries({
				queryKey: [
					'supplies',
					'transactions',
					'accounts',
					'dashboard',
					'tcustomers',
				],
			});

			toast.success(' Payment created successfully');
			setIsLoading(false);
			navigate(`/transactions/${id}`);
		},
		onError: (error) => {
			const message = getError(error);
			toast.error(message);
		},
	});

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!amount) {
			return toast.error('Amount error. Please valid amount.');
		}
		if (!name) {
			return toast.error('Name error. Please add a customer name');
		}
		if (!date) {
			return setDateError('Date error. Please add Transaction date');
		}
		setIsLoading(true);
		// Make API call
		const data = { name, date, total: amount, description };

		try {
			await mutation.mutateAsync(data);
		} catch (error) {
			const message = getError(error);
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<main className="w-full py-3 pl-7 pr-5  flex flex-col space-y-3">
				<div>
					<h4 className="font-semibold text-lg text-primary">Edit Payment</h4>
					<ul className="text-tiny font-medium flex items-center space-x-2 text-text3">
						<li className="breadcrumb-item text-muted">
							<Link
								to={`/accounts/${data?.accountId}`}
								className="text-blue-500/60 hover:text-blue-500"
							>
								Transaction info
							</Link>
						</li>
						<li className="breadcrumb-item flex items-center">
							<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full"></span>
						</li>
						<li className="breadcrumb-item capitalize text-blue-500 hover:text-blue-500/50 cursor-pointer">
							<Link to={`/transactions/${id}`}>{id?.substring(0, 8)}</Link>
						</li>
					</ul>
				</div>
				<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-lg transition-all font-josefin">
					<div className="w-full md:flex items-start p-4 gap-2">
						<div className="mb-1 w-full md:w-1/2">
							<label
								htmlFor="amount"
								className="text-sm mb-0 font-semibold text-black"
							>
								Amount <span className="text-red-500">*</span>
							</label>

							<input
								className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
								type="number"
								id="amount"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
							/>
							<span className="text-tiny leading-4">Enter Payment Amount.</span>
						</div>
						<div
							className={`w-full md:w-1/2 mt-2 md:mt-0 ${
								dateError ? 'border-b border-red-500' : ''
							}`}
						>
							<label className="mb-0 text-base text-black">
								Date<span className="text-red-500">*</span>
							</label>
							<div className="flex justify-between gap-2 items-center w-full">
								<input
									className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
								/>
							</div>
						</div>
					</div>
				</div>
				{/* <!-- input --> */}
				<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-lg transition-all font-josefin p-4">
					<h4 className="text-sm mb-0 font-semibold text-black">Customer</h4>
					<CustomersInput customer={name} setCustomer={setName} data={[]} />
					<div className="mb-1">
						<label htmlFor="remark" className="text-black">
							Remark
						</label>
						<textarea
							id="remark"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="input p-2 rounded-md h-[200px] resize-none w-full border border-gray6  text-black"
						></textarea>
						<span className="text-tiny leading-4">Add the remark.</span>
					</div>
					<button
						disabled={loading}
						className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 py-1 w-full flex items-center justify-center rounded-md transition-all duration-500 ease-in-out"
						onClick={handleSubmit}
					>
						<span>Update Payment</span>
						<i className="fa-solid fa-delete text-2xl text-primary"></i>
					</button>
				</div>
			</main>
			{isLoading || (loading && <Loader />)}
		</>
	);
};

export default EditPayment;
