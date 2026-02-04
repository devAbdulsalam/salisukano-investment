import { useContext, useState, useMemo, useEffect } from 'react';
import AuthContext from '../context/authContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../hooks/getError';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { MdDelete } from 'react-icons/md';
import { FaPlus } from 'react-icons/fa6';
import Loader from '../components/Loader.jsx';
import capitalizeText from '../hooks/CapitalizeText.js';

const materialsData = [{ name: 'Cast' }, { name: 'Mix' }, { name: 'Special' }];

// ----------- MAIN COMPONENT -----------
const EditCredit = () => {
	const { user, invoiceData } = useContext(AuthContext);
	const { id, creditId } = useParams(); // creditId param for editing
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	// Form state
	const [description, setDescription] = useState('');
	const [vehicleNumber, setVehicleNumber] = useState('');
	const [deposits, setDeposits] = useState([{ description: '', amount: 0 }]);
	const [materials, setMaterials] = useState([
		{ product: 'Mix', qty: '', rate: '', cost: 0 },
		{ product: 'Cast', qty: '', rate: '', cost: 0 },
		{ product: 'Special', qty: '', rate: '', cost: 0 },
	]);
	const [date, setDate] = useState('');
	const [dateError, setDateError] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!invoiceData) {
			navigate('/creditors');
		}
		// If editing, pre-fill form fields
		if (invoiceData?.invoice?.credits) {
			const { materials, date, description, vehicleNumber } =
				invoiceData.invoice.credits[0];
			const materialData = materials.map((m) => ({
				...m,
				product: capitalizeText(m.product),
			}));
			// console.log('materialData:', materialData);
			setMaterials(
				materialData?.length
					? materialData
					: [{ product: 'Mix', qty: '', rate: '', cost: 0 }],
			);
			setDate(date?.substring(0, 10) || '');
			setDescription(description || '');
			setVehicleNumber(vehicleNumber || '');
		}
		if (invoiceData?.invoice?.debits) {
			// console.log('invoiceData?.debits:', invoiceData?.invoice?.debits);
			const debits = invoiceData?.invoice?.debits.map((d) => ({
				description: d.description || '',
				amount: d.total || 0,
				...d,
			}));
			setDeposits(debits?.length ? debits : [{ description: '', amount: 0 }]);
		}
	}, [invoiceData, navigate]);

	// Cost calculations
	const total = useMemo(
		() =>
			Math.ceil(
				materials.reduce((acc, material) => acc + (+material.cost || 0), 0),
			),
		[materials],
	);
	const amount = useMemo(
		() => Math.ceil(deposits.reduce((acc, d) => acc + +(d.amount || 0), 0)),
		[deposits],
	);
	const grandTotal = useMemo(() => total - amount, [total, amount]);

	// ------- HANDLERS -------
	const handleMaterialChange = (index, field, value) => {
		setMaterials((prev) => {
			const materials = [...prev];
			materials[index] = { ...materials[index], [field]: value };
			if (
				(field === 'rate' || field === 'qty') &&
				!isNaN(value) &&
				materials[index].rate &&
				materials[index].qty
			) {
				const qty = +materials[index].qty || 0;
				const rate = +materials[index].rate || 0;
				materials[index].cost = qty * rate;
			}
			return materials;
		});
	};
	const handleDepositChange = (idx, field, value) => {
		setDeposits((prev) => {
			const arr = [...prev];
			arr[idx] = { ...arr[idx], [field]: value };
			return arr;
		});
	};

	// Add/Remove
	const addMaterial = () => {
		if (materials.length >= 3) {
			return;
		}
		setMaterials((prev) => [
			...prev,
			{ product: '', qty: '', rate: '', cost: 0 },
		]);
	};
	const removeMaterial = (index) =>
		setMaterials((prev) =>
			prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
		);
	const addDeposit = () => {
		setDeposits((prev) => [...prev, { description: '', amount: 0 }]);
	};
	const removeDeposit = (idx) =>
		setDeposits((prev) =>
			prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
		);

	// ------- SUBMIT -------
	const apiUrl = import.meta.env.VITE_API_URL;
	const config = { headers: { Authorization: `Bearer ${user?.token}` } };

	const handleSubmit = async (e) => {
		e.preventDefault();
		let isValid = true;

		// --- Validate Materials ---
		const materialsWithErrors = materials.map((material, idx, arr) => {
			let error = '';
			if (!material.product) error = 'Material required';
			else if (arr.filter((m) => m.product === material.product).length > 1)
				error = 'Duplicate material';
			else if (
				!material.qty ||
				isNaN(material.qty) ||
				Number(material.qty) <= 0
			)
				error = 'Invalid quantity';
			else if (
				!material.rate ||
				isNaN(material.rate) ||
				Number(material.rate) <= 0
			)
				error = 'Invalid rate';
			return { ...material, error };
		});

		// If errors present in materials
		if (materialsWithErrors.some((m) => m.error)) {
			isValid = false;
			setMaterials(materialsWithErrors);
		} else {
			setMaterials(materialsWithErrors.map(({ error, ...m }) => m)); // clear errors
		}

		// --- Validate Deposits ---
		const depositNames = new Set();
		const depositsWithErrors = deposits.map((deposit) => {
			let error = '';
			if (!deposit.description.trim()) error = 'Description required';
			else if (depositNames.has(deposit.description.trim()))
				error = 'Duplicate description';
			else if (
				!deposit.amount ||
				isNaN(deposit.amount) ||
				Number(deposit.amount) <= 0
			)
				error = 'Invalid amount';
			depositNames.add(deposit.description.trim());
			return { ...deposit, error };
		});
		if (depositsWithErrors.some((d) => d.error)) {
			isValid = false;
			setDeposits(depositsWithErrors);
		} else {
			setDeposits(depositsWithErrors.map(({ error, ...d }) => d)); // clear errors
		}

		// --- Validate Date and Vehicle ---
		if (!date) {
			isValid = false;
			setDateError('Select a date');
			toast.error('Please select a valid date');
		} else {
			setDateError('');
		}
		if (!vehicleNumber.trim()) {
			isValid = false;
			toast.error('Please add vehicle number');
		}

		if (!isValid) return toast.error('Please fix the errors');

		setLoading(true);

		// Form payload
		const formPayload = {
			credits: [{ ...invoiceData.invoice.credits[0], materials }],
			deposits,
			date,
			description,
			vehicleNumber,
			invoiceId: invoiceData?.invoice?._id,
		};
		console.log('formPayload:', formPayload);
		// setLoading(false);
		// navigate(`//${id}`);
		try {
			axios
				.patch(`${apiUrl}/creditors/invoices`, formPayload, config)
				.then((res) => {
					if (res.data) {
						console.log('Credit updated successfully:', res.data);
						toast.success(`Credit updated successfully`);
						queryClient.invalidateQueries({ queryKey: ['creditors'] });
						queryClient.invalidateQueries({ queryKey: ['creditors', id] });
						navigate(`/creditors`);
					}
				});
		} catch (error) {
			toast.error(getError(error));
		} finally {
			setLoading(false);
		}
	};

	// ---- PAGE RENDER ----
	return (
		<>
			<main className="w-full py-3 pl-7 pr-5 flex flex-col space-y-3">
				{/* BREADCRUMB */}
				<header>
					<h4 className="font-semibold text-lg text-primary">
						{creditId ? 'Edit Credit' : 'New Credit'}
					</h4>
					<ul className="text-tiny font-medium flex items-center space-x-2 text-text3">
						<li>
							<Link
								to="/creditors"
								className="text-blue-500/60 hover:text-blue-500"
							>
								Creditors
							</Link>
						</li>
						<li>
							<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full"></span>
						</li>
						<li>
							<Link
								to={`/creditors/${id}`}
								className="capitalize text-blue-500"
							>
								{invoiceData?.creditor?.name || ''}
							</Link>
						</li>
					</ul>
				</header>
				{/* MATERIALS */}
				<section className="overflow-hidden rounded-2xl bg-white shadow-lg font-josefin">
					<div className="space-y-5 p-4">
						<h4 className="text-sm mb-0 font-semibold text-black">Products</h4>
						{materials.map((item, idx) => (
							<div
								key={idx}
								className={`shadow p-2 mt-2 rounded-sm${
									item.error ? ' border-b border-red-300' : ''
								}`}
							>
								<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
									<div>
										<label>Materials</label>
										<select
											className="input w-full h-[44px] border px-1 text-base rounded-md"
											value={item.product}
											onChange={(e) =>
												handleMaterialChange(idx, 'product', e.target.value)
											}
										>
											<option value="">Select</option>
											{materialsData.map((data, i) => (
												<option key={i} value={data.name}>
													{data.name}
												</option>
											))}
										</select>
									</div>
									<div>
										<label>
											Quantity/tonnes <span className="text-red-500">*</span>
										</label>
										<input
											className="input w-full h-[44px] border px-2 text-base rounded-md"
											type="number"
											value={item.qty}
											onChange={(e) =>
												handleMaterialChange(idx, 'qty', e.target.value)
											}
										/>
									</div>
									<div>
										<label>
											Rate/Qty <span className="text-red-500">*</span>
										</label>
										<input
											className="input w-full h-[44px] border px-2 text-base rounded-md"
											type="number"
											value={item.rate}
											onChange={(e) =>
												handleMaterialChange(idx, 'rate', e.target.value)
											}
										/>
									</div>
									<div>
										<label>Cost</label>
										<div className="flex items-center">
											<input
												className="input w-full h-[44px] border px-2 text-base rounded-md"
												type="number"
												value={item.cost}
												readOnly
											/>
											<button
												onClick={() => removeMaterial(idx)}
												className="text-center h-10 w-10"
											>
												<MdDelete className="text-xl text-red-500" />
											</button>
										</div>
									</div>
								</div>
								{item.error && (
									<div className="text-red-500 text-center">{item.error}</div>
								)}
							</div>
						))}
						{/* Material total and date */}
						<div className="md:flex gap-2">
							<div className="w-full md:w-1/2">
								<label>Total cost*</label>
								<input
									className="input w-full h-[44px] border px-2 text-base rounded-md"
									type="number"
									value={total}
									readOnly
								/>
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
										onClick={addMaterial}
										className="hover:bg-green-500 hover:text-white bg-gray-100 text-green-500 rounded-sm w-6 h-6 flex items-center justify-center"
									>
										<FaPlus className="text-xl" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</section>
				{/* DEPOSITS */}
				<section className="overflow-hidden rounded-2xl bg-white shadow-lg font-josefin">
					<div className="space-y-5 p-4">
						<div className="p-2 ">
							<div className="flex justify-between">
								<h4 className="text-sm mb-0 font-semibold text-black">
									Deposit
								</h4>
							</div>
							{deposits.map((item, idx) => (
								<div key={idx} className="p-2">
									<div className="md:flex gap-2">
										<div className="w-full">
											<label>
												Amount<span className="text-red-600">*</span>
											</label>
											<input
												className="input w-full h-[44px] border px-2 text-base rounded-md"
												type="number"
												value={item.amount}
												onChange={(e) =>
													handleDepositChange(idx, 'amount', e.target.value)
												}
											/>
										</div>
										<div className="w-full">
											<label>
												Description<span className="text-red-600">*</span>
											</label>
											<div className="flex items-center">
												<input
													className="input w-full h-[44px] border px-2 text-base rounded-md"
													type="text"
													value={item.description}
													onChange={(e) =>
														handleDepositChange(
															idx,
															'description',
															e.target.value,
														)
													}
												/>
												<button
													onClick={() => removeDeposit(idx)}
													className="text-center h-10 w-10"
												>
													<MdDelete className="text-xl text-red-500" />
												</button>
											</div>
										</div>
									</div>
									{item.error && (
										<div className="text-red-500 text-center">{item.error}</div>
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
												onClick={addDeposit}
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
				</section>
				{/* Info / Save */}{' '}
				<section className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-lg transition-all font-josefin">
					<div className="space-y-5 p-4">
						<div className="p-2 ">
							<h4 className="text-sm mb-0 font-semibold text-black">
								Information
							</h4>
							<div className="p-2 md:flex justify-between gap-2 items-center w-full">
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
								<label>Remark</label>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="input p-2 rounded-md h-[100px] resize-none w-full border border-gray6  text-black"
								/>
								<span className="text-tiny leading-4">Add the remark.</span>
							</div>
							<button
								disabled={loading}
								className="bg-blue-500 hover:bg-blue-700 text-white font-semibold h-10 py-1 w-full rounded-md"
								onClick={handleSubmit}
							>
								{loading ? (
									<span>Loading...</span>
								) : (
									<span>{creditId ? 'Update' : 'Add'} Credit</span>
								)}
							</button>
						</div>
					</div>
				</section>
			</main>

			{loading && <Loader />}
		</>
	);
};
export default EditCredit;
