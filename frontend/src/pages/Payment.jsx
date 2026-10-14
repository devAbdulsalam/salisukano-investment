/* eslint-disable react/prop-types */
import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../hooks/getError';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Loader from '../components/Loader.jsx';
import CustomersInput from '../components/CustomersInput.jsx';
import { fetchCurrentAccount } from '../hooks/axiosApis.js';
import { formatMonthYearWat, watMonthBoundsInput } from '../utils/watDate';

const NewPayment = () => {
	const { user } = useContext(AuthContext);
	const [description, setDescription] = useState('');
	const [loading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();
	const { id } = useParams();
	const { data, isLoading, error } = useQuery({
		queryKey: ['tcustomers'],
		queryFn: async () => fetchCurrentAccount({ user, id }),
	});
	const [name, setName] = useState('');
	const [amount, setAmount] = useState(0);

	const apiUrl = import.meta.env.VITE_API_URL;
	const config = {
		headers: {
			Authorization: `Bearer ${user?.token}`,
		},
	};
	const navigate = useNavigate();
	const [date, setDate] = useState('');
	const [minDate, setMinDate] = useState('');
	const [maxDate, setMaxDate] = useState('');
	const [dateError, setDateError] = useState('');
	const [month, setMonth] = useState('');
	useEffect(() => {
		if (data) {
			// Month label and bounds are derived in WAT so they stay correct
			// regardless of the user's device timezone.
			setMonth(formatMonthYearWat(data?.account?.month));
			const { min, max } = watMonthBoundsInput(data?.account?.month);
			setMinDate(min);
			setMaxDate(max);
		}
		if (error) {
			console.log(error);
			toast.error(error?.message);
		}
	}, [data, error]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!amount) {
			return toast.error('Amount error. Please valid amount.');
		}
		if (!date) {
			setDateError('Please add a valid Date');
			return toast.error('Please select a valid date within the month.');
		}
		setDateError('');
		if (!name) {
			return toast.error('Name error. Please add a customer name');
		}
		setIsLoading(true);
		// Make API call
		const data = { name, total: amount, date, description, accountId: id };
		// console.log('data', data);
		axios
			.post(`${apiUrl}/payments`, data, config)
			.then((res) => {
				if (res.data) {
					console.log(res.data);
					toast.success('Payment added successfully');
				}
				queryClient.invalidateQueries({
					queryKey: [
						'supplies',
						'transactions',
						'accounts',
						'dashboard',
						'tcustomers',
						id,
					],
				});
				navigate(`/accounts/${id}`);
			})
			.catch((error) => {
				const message = getError(error);
				toast.error(message);
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	return (
		<>
			<main className="w-full py-3 pl-7 pr-5  flex flex-col space-y-3">
				<div className="">
					<h4 className="font-semibold text-lg text-primary">New Payment</h4>
					<ul className="text-tiny font-medium flex items-center space-x-2 text-text3">
						<li className="breadcrumb-item text-muted">
							<Link
								to={`/companies/${data?.customer?._id}`}
								className="text-blue-500/60 hover:text-blue-500"
							>
								{data?.customer?.name}
							</Link>
						</li>
						<li className="breadcrumb-item flex items-center">
							<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full"></span>
						</li>
						<li className="breadcrumb-item capitalize text-blue-500 hover:text-blue-500/50 cursor-pointer">
							<Link to={`/accounts/${id}`}>{month}</Link>
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
									min={minDate}
									max={maxDate}
								/>
							</div>
						</div>
					</div>
				</div>
				{/* <!-- input --> */}
				<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-lg transition-all font-josefin p-4">
					<h4 className="text-sm mb-0 font-semibold text-black">Customer</h4>
					<CustomersInput
						customer={name}
						setCustomer={setName}
						data={data?.customers || []}
					/>
					<div className="mb-1">
						<label className="text-black">Remark</label>
						<textarea
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
						<span>Add Payment</span>
						<i className="fa-solid fa-delete text-2xl text-primary"></i>
					</button>
				</div>
			</main>
			{isLoading || (loading && <Loader />)}
		</>
	);
};

export default NewPayment;
