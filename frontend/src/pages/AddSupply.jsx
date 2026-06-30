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
import CustomersInput from '../components/CustomersInput.jsx';
import { fetchCurrentAccount } from '../hooks/axiosApis.js';

const materialsData = [
	{ name: 'Cast' },
	{ name: 'Mix' },
	{ name: 'Special' },
	{ name: 'Bundle' },
];

const AddSupply = () => {
	const { user } = useContext(AuthContext);
	const [description, setDescription] = useState('');
	const { id } = useParams();
	const { data, isLoading, error } = useQuery({
		queryKey: ['tcustomers', id],
		queryFn: async () => fetchCurrentAccount({ user, id }),
	});
	const [loading, setIsLoading] = useState(false);
	const [name, setName] = useState('');
	const [vehicleNumber, setVehicleNumber] = useState('');
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
		{
			product: 'Bundle',
			qty: '',
			rate: '',
			cost: 0,
		},
	]);
	const [date, setDate] = useState('');
	const [minDate, setMinDate] = useState('');
	const [maxDate, setMaxDate] = useState('');
	const [dateError, setDateError] = useState('');
	const [month, setMonth] = useState('');
	useEffect(() => {
		if (data) {
			const normalizedMonth = new Date(
				new Date(data?.account?.month).getFullYear(),
				new Date(data?.account?.month).getMonth(),
				1,
			);
			// console.log(data);
			const month = normalizedMonth.toLocaleDateString('en-GB', {
				month: 'long',
				year: 'numeric',
			});
			setMonth(month);
			// Set minimum date to the 1st of the month
			const min = new Date(
				normalizedMonth.getFullYear(),
				normalizedMonth.getMonth(),
				1,
			);
			setMinDate(min?.toISOString().split('T')[0]);

			// Set maximum date to the last day of the month
			const max = new Date(
				normalizedMonth.getFullYear(),
				normalizedMonth.getMonth() + 1,
				1,
			);
			setMaxDate(max.toISOString().split('T')[0]);
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

	const addMaterials = () => {
		// 1. Get the list of product names already in the state
		const usedProducts = materials.map((item) => item.product);

		// 2. Find the first product from materialsData that hasn't been added yet
		const nextProduct = materialsData.find(
			(dataItem) => !usedProducts.includes(dataItem.name),
		);

		// 3. If none left, do nothing (or optionally show a message)
		if (!nextProduct) return;

		// 4. Add the new material with the product name and default values
		setMaterials((prev) => [
			...prev,
			{
				product: nextProduct.name,
				qty: '',
				rate: '',
				cost: 0,
			},
		]);
	};

	const removeMaterial = (indexToRemove) => {
		if (materials.length <= 1) return;
		setMaterials((prevMaterials) =>
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
				updatedMaterials[index].error = 'Please add rate';
			} else {
				updatedMaterials[index].cost = material.qty * material.rate;
			}
			productNames.add(material.product);
		});

		setMaterials(updatedMaterials);

		if (isValid) {
			if (!date) {
				setDateError('Please add a valid Date');
				return toast.error('Please select a valid date within the month.');
			}
			setDateError('');
			if (!name.trim()) {
				return toast.error('Please add customer name');
			}
			if (!vehicleNumber.trim()) {
				return toast.error('Please add vehicel Number');
			}
			setIsLoading(true);
			// Make API call
			const data = {
				materials,
				name,
				date,
				description,
				total,
				vehicleNumber,
				accountId: id,
			};
			// console.log('data', data);
			axios
				.post(`${apiUrl}/supplies`, data, config)
				.then((res) => {
					if (res.data) {
						console.log(res.data);
						toast.success('Supply added successfully');
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
		} else {
			return toast.error('Validation failed. Please correct the errors.');
		}
	};

	return (
		<>
			<main className="w-full py-3 pl-7 pr-5  flex flex-col space-y-3">
				<div className="">
					<h4 className="font-semibold text-lg text-primary">New Order</h4>
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
					<div className="space-y-5 p-4">
						<div className="p-2 ">
							<div className="flex justify-between">
								<h4 className="text-sm mb-0 font-semibold text-black">
									Products
								</h4>

								<button
									onClick={addMaterials}
									className="text-center rounded-sm h-8 w-8 bg-green-50 hover:bg-green-500 text-green-500 hover:text-green-50 flex items-center justify-center"
								>
									<FaPlus className="text-xl" />
								</button>
							</div>
							{materials.map((item, index) => (
								<div
									key={index}
									className={` p-2 mt-2 rounded-sm ${
										item.error ? 'border border-b border-red-300 ' : ''
									}`}
								>
									<div className="grid sm:grid-cols-2 lg:grid-cols-4 w-full gap-3">
										<div className="mb-2">
											<p className="mb-0 text-base text-black">Materials</p>
											<select
												className="input w-full h-[44px] rounded-md border border-gray px-1 text-base"
												value={item.product}
												defaultValue="Cast"
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
										<div className="mb-2">
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
						<div className="mb-5 md:flex justify-between gap-2 items-center">
							<div className="w-full md:w-1/2">
								<label className="mb-0 text-base text-blue-500">
									Total material cost<span className="text-red">*</span>
								</label>
								<div className="flex justify-between gap-2 items-center w-full">
									<input
										className="input w-full h-[44px] rounded-md border border-gray6 px-6 text-base"
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
										min={minDate}
										max={maxDate}
									/>
									<button
										onClick={addMaterials}
										className="text-center rounded-sm h-8 w-8 bg-green-50 hover:bg-green-500 text-green-500 hover:text-green-50 flex items-center justify-center"
									>
										<FaPlus className="text-xl" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
				{/* <!-- input --> */}
				<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-lg transition-all font-josefin p-4">
					<h4 className="text-sm mb-0 font-semibold text-black">Customer</h4>
					<div className="md:flex justify-between gap-2 items-center w-full">
						<CustomersInput
							customer={name}
							setCustomer={setName}
							data={data?.customers || []}
						/>
						<div className="my-2 w-full md:w-1/2 md:mt-0">
							<label htmlFor="vehicelNo" className="mb-0 text-base text-black">
								Vehicel No. <span className="text-red-500">*</span>
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
						<span>Add Order</span>
						<i className="fa-solid fa-delete text-2xl text-primary"></i>
					</button>
				</div>
			</main>
			{isLoading || (loading && <Loader />)}
		</>
	);
};

export default AddSupply;
