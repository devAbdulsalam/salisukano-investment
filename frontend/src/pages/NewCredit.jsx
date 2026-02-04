/* eslint-disable react/prop-types */
import { useContext, useState, useMemo, useEffect } from 'react';
import AuthContext from '../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../hooks/getError';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
// import { HiXMark } from 'react-icons/hi2';
import { MdDelete } from 'react-icons/md';
import { FaPlus } from 'react-icons/fa6';
import Loader from '../components/Loader.jsx';
import { fetchCreditor, fetchCustomers } from '../hooks/axiosApis.js';

const materialsData = [{ name: 'Cast' }, { name: 'Mix' }, { name: 'Special' }];

const NewCredit = () => {
	const { user } = useContext(AuthContext);
	const [description, setDescription] = useState('');
	const { id } = useParams();
	const { data, isLoading, error } = useQuery({
		queryKey: ['creditors', id],
		queryFn: async () => fetchCreditor({ user, id }),
	});
	const { data: companies } = useQuery({
		queryKey: ['customers'],
		queryFn: async () => fetchCustomers(user),
	});
	const [loading, setIsLoading] = useState(false);
	const [vehicleNumber, setVehicleNumber] = useState('');
	const [companyId, setCompanyId] = useState('');
	const [deposits, setDeposits] = useState([
		{
			description: '',
			amount: 0,
		},
	]);
	const [materials, setMaterials] = useState([
		{
			product: 'Mix',
			qty: '',
			rate: '',
			cost: 0,
		},
		{
			product: 'Cast',
			qty: '',
			rate: '',
			cost: 0,
		},
		{
			product: 'Special',
			qty: '',
			rate: '',
			cost: 0,
		},
	]);
	const [date, setDate] = useState('');
	const [dateError, setDateError] = useState('');
	useEffect(() => {
		if (data) {
			console.log(data);
		}
		if (error) {
			console.log(error);
			toast.error(error?.message);
		}
	}, [data, error]);

	const total = useMemo(() => {
		return Math.ceil(
			materials.reduce((acc, material) => acc + material.cost, 0),
		);
	}, [materials]);

	const amount = useMemo(() => {
		return Math.ceil(
			deposits.reduce((acc, deposit) => acc + Math.ceil(deposit.amount), 0),
		);
	}, [deposits]);
	const grandTotal = useMemo(() => {
		return Math.ceil(total) - Math.ceil(amount);
	}, [total, amount]);

	const handleMaterialChange = (index, field, value) => {
		setMaterials((prevMaterials) => {
			const updatedMaterials = [...prevMaterials];
			const material = updatedMaterials[index];
			material[field] = value;
			if (field === 'rate' || field === 'qty') {
				material.cost = material.qty * material.rate || 0;
			}
			return updatedMaterials;
		});
	};
	const handleDepositeChange = (index, field, value) => {
		setDeposits((prevDeposits) => {
			const updatedDeposits = [...prevDeposits];
			updatedDeposits[index] = {
				...updatedDeposits[index],
				[field]: value,
			};
			return updatedDeposits;
		});
	};

	const addMaterials = () => {
		if (materials.length >= 3) return;
		setMaterials((prevMaterials) => [
			...prevMaterials,
			{ product: '', qty: '', rate: '', cost: 0 },
		]);
	};

	const removeMaterial = (indexToRemove) => {
		if (materials.length <= 1) return;
		setMaterials((prevMaterials) =>
			prevMaterials.filter((_, index) => index !== indexToRemove),
		);
	};
	const removeDeposit = (indexToRemove) => {
		if (deposits.length <= 0) return;
		setDeposits((prevMaterials) =>
			prevMaterials.filter((_, index) => index !== indexToRemove),
		);
	};

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

		let isValid = true;
		const updatedMaterials = materials.map((material) => ({
			...material,
			error: '',
		}));

		const productNames = new Set();
		updatedMaterials.forEach((material, index) => {
			if (productNames.has(material.product)) {
				isValid = false;
				updatedMaterials[index].error = 'This material is already added';
			} else if (!material.product) {
				isValid = false;
				updatedMaterials[index].error = 'Please fill material';
			} else if (!material.qty || isNaN(material.qty) || material.qty <= 0) {
				isValid = false;
				updatedMaterials[index].error = 'Add quantity';
			} else if (!material.rate || isNaN(material.rate) || material.rate <= 0) {
				isValid = false;
				updatedMaterials[index].error = 'Please add price';
			} else {
				updatedMaterials[index].cost = material.qty * material.rate;
			}
			productNames.add(material.product);
		});
		setMaterials(updatedMaterials);
		if (deposits?.length) {
			const updatedDeposits = deposits.map((deposit) => ({
				...deposit,
				error: '',
			}));

			const depositNames = new Set();

			const validatedDeposits = updatedDeposits.map((deposit) => {
				let error = '';

				if (Number(deposit.amount) <= 0) {
					error = 'Amount must be greater than 0.';
					isValid = false;
				} else if (depositNames.has(deposit.description.trim())) {
					error = 'Duplicate description.';
					isValid = false;
				} else if (!deposit.description.trim()) {
					error = 'Description is required.';
					isValid = false;
				} else {
					depositNames.add(deposit.description.trim());
				}

				return { ...deposit, error };
			});

			setDeposits(validatedDeposits);
		}

		if (isValid) {
			if (!date) {
				setDateError('Please add a valid Date');
				return toast.error('Please select a valid date within the month.');
			}
			setDateError('');
			if (!vehicleNumber.trim()) {
				return toast.error('Please add vehicel Number');
			}
			if (!companyId.trim()) {
				return toast.error('Please select a company');
			}
			setIsLoading(true);
			// Make API call
			const data = {
				materials,
				date,
				description,
				total,
				vehicleNumber,
				accountId: id,
				deposits,
				creditorId: id,
				companyId,
			};
			// console.log('data', data);
			axios
				.post(`${apiUrl}/creditors/${id}`, data, config)
				.then((res) => {
					if (res.data) {
						console.log(res.data);
						toast.success('Credit added successfully');
					}
					queryClient.invalidateQueries({
						queryKey: [
							'supplies',
							'transactions',
							'accounts',
							'dashboard',
							'tcustomers',
							'creditors',
							id,
						],
					});
					navigate(`/creditors/${id}`);
				})
				.catch((error) => {
					const message = getError(error);
					toast.error(message);
				})
				.finally(() => {
					setIsLoading(false);
				});
		} else {
			return toast.error('Validation failed. Please correct the errors.');
		}
	};

	return (
		<>
			<main className="w-full py-3 pl-7 pr-5  flex flex-col space-y-3">
				<div className="">
					<h4 className="font-semibold text-lg text-primary">New Credit</h4>
					<ul className="text-tiny font-medium flex items-center space-x-2 text-text3">
						<li className="breadcrumb-item text-muted">
							<Link
								to={`/creditors`}
								className="text-blue-500/60 hover:text-blue-500"
							>
								Creditors
							</Link>
						</li>
						<li className="breadcrumb-item flex items-center">
							<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full"></span>
						</li>
						<li className="breadcrumb-item capitalize text-blue-500 hover:text-blue-500/50 cursor-pointer">
							<Link to={`/creditors/${id}`}>{data?.creditor?.name}</Link>
						</li>
					</ul>
				</div>
				<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-lg transition-all font-josefin">
					<div className="space-y-5 p-4">
						<div className="p-2 ">
							<div className="flex justify-between">
								<h4 className="text-sm mb-0 font-semibold text-black">
									Products
								</h4>
							</div>
							{materials.map((item, index) => (
								<div
									key={index}
									className={`shadow p-2 mt-2 rounded-sm ${
										item.error ? 'border-b border-red-300 ' : ''
									}`}
								>
									<div className="grid sm:grid-cols-2 lg:grid-cols-4 w-full gap-3">
										<div className="mb-2">
											<p className="mb-0 text-base text-black">Materials</p>
											<select
												className="input w-full h-[44px] rounded-md border border-gray px-1 text-base"
												value={item.product}
												defaultValue={'Cast'}
												onChange={(e) =>
													handleMaterialChange(index, 'product', e.target.value)
												}
											>
												{/* <option value="">Select Material</option> */}
												{materialsData.map((data, idx) => (
													<option key={idx} value={data.name}>
														{data.name}
													</option>
												))}
											</select>
										</div>
										<div className="mb-2">
											<p className="mb-0 text-base text-black">
												Quantity/tonnes. <span className="text-red-500">*</span>
											</p>
											<input
												className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
												type="number"
												placeholder="10000"
												value={item.qty}
												onChange={(e) =>
													handleMaterialChange(index, 'qty', e.target.value)
												}
											/>
										</div>
										<div className="mb-2">
											<label className="mb-0 text-base text-black">
												Rate/Qty. <span className="text-red-500">*</span>
											</label>
											<input
												className="input w-full h-[44px] rounded-md border border-gray px-2 text-base"
												type="number"
												placeholder="100"
												value={item.rate}
												onChange={(e) =>
													handleMaterialChange(index, 'rate', e.target.value)
												}
											/>
										</div>
										<div className="mb-2 ">
											<p className="mb-0 text-base text-black">Cost</p>
											<div className="flex justify-center items-center">
												<input
													className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
													type="number"
													disabled
													value={item.cost}
												/>
												<button
													onClick={() => removeMaterial(index)}
													className="text-center pl-3 py-2 h-10 w-10"
												>
													<MdDelete className="text-xl text-red-500 hover:text-red-200" />
												</button>
											</div>
										</div>
									</div>
									{item.error && (
										<div className="text-red-500 text-center mt-1">
											{item.error}
										</div>
									)}
								</div>
							))}
						</div>
						<div className="p-2 mb-5 md:flex justify-between gap-2 items-center">
							<div className="w-full md:w-1/2">
								<label className="mb-0 text-base ">
									Total cost<span className="text-red"> *</span>
								</label>
								<div className="flex justify-between gap-2 items-center w-full">
									<input
										className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
										type="number"
										value={total}
										readOnly
										disabled
									/>
								</div>
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
									<button
										onClick={addMaterials}
										className="hover:bg-green-500 hover:text-white bg-gray-100 text-green-500 rounded-sm w-6 h-6 flex items-center justify-center"
									>
										<FaPlus className="text-xl" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* Deposit */}

				<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-lg transition-all font-josefin">
					<div className="space-y-5 p-4">
						<div className="p-2 ">
							<div className="flex justify-between">
								<h4 className="text-sm mb-0 font-semibold text-black">
									Deposit
								</h4>
							</div>
							{deposits?.map((item, index) => (
								<div key={index} className="p-2 ">
									<div className="md:flex gap-2 ">
										<div className="w-full">
											<label className="mb-0 text-base text-black">
												Amount <span className="text-red-600">*</span>
											</label>
											<input
												className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
												type="number"
												value={item.amount}
												onChange={(e) =>
													handleDepositeChange(index, 'amount', e.target.value)
												}
											/>
										</div>
										<div className="mb-2 w-full">
											<label className="mb-0 text-base text-black">
												Description <span className="text-red-600">*</span>
											</label>
											<div className="flex justify-center items-center">
												<input
													className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
													type="text"
													value={item.description}
													onChange={(e) =>
														handleDepositeChange(
															index,
															'description',
															e.target.value,
														)
													}
												/>
												<button
													onClick={() => removeDeposit(index)}
													className="text-center pl-3 py-2 h-10 w-10"
												>
													<MdDelete className="text-xl text-red-500 hover:text-red-200" />
												</button>
											</div>
										</div>
									</div>
									{item.error && (
										<p className="text-red-500 text-center mt-1">
											{item.error}
										</p>
									)}
								</div>
							))}
							<div className="p-2 ">
								<div className="md:flex gap-2 items-center justify-between">
									<div className="w-full">
										<label className="mb-0 text-base text-black">
											Total deposit
										</label>
										<div className="w-full flex gap-2 items-center justify-between">
											<input
												className="input w-full h-[44px] rounded-md border border-gray6 lg:px-2 text-base"
												type="number"
												value={amount}
												readOnly
												disabled
											/>
											<button
												onClick={() =>
													setDeposits([
														...deposits,
														{ amount: 0, description: '' },
													])
												}
												className="py-2 px-4 w-fit hover:bg-green-500 hover:text-white bg-gray-100 text-green-500 rounded-sm  flex items-center justify-center"
											>
												Add <FaPlus className="text-lg w-6 h-6" />
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* <!-- input --> */}
				<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-lg transition-all font-josefin">
					<div className="space-y-5 p-4">
						<div className="p-2 ">
							<h4 className="text-sm mb-0 font-semibold text-black">
								Information
							</h4>
							<div className="p-2 md:flex justify-between gap-2 items-center w-full">
								<div className="w-full mb-2">
									<p className="mb-0 text-base text-black">Select Company</p>
									<select
										className="input w-full h-[44px] rounded-md border border-gray px-1 text-base"
										onChange={(e) => setCompanyId(e.target.value)}
									>
										{companies?.map((data) => (
											<option key={data._id} value={data._id}>
												{data.name}
											</option>
										))}
									</select>
								</div>
								<div className="mb-2 w-full">
									<label className="mb-0 text-base text-blue-500">
										Grand Total
									</label>
									<input
										className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
										type="text"
										value={grandTotal}
										readOnly
										disabled
									/>
								</div>
								<div className="my-2 w-full md:w-1/2 md:mt-0">
									<label
										htmlFor="vehicelNo"
										className="mb-0 text-base text-black"
									>
										Vehicel/Desc. <span className="text-red-500">*</span>
									</label>
									<input
										className="input w-full h-[44px] rounded-md border border-gray6 px-2 text-base"
										type="text"
										placeholder="KN9009"
										value={vehicleNumber}
										onChange={(e) => setVehicleNumber(e.target.value)}
									/>
								</div>
							</div>
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
								{loading ? (
									<span>Loading...</span>
								) : (
									<>
										<span>Add Order</span>
										<i className="fa-solid fa-delete text-2xl text-primary"></i>
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			</main>
			{isLoading || (loading && <Loader />)}
		</>
	);
};

export default NewCredit;
