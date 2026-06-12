import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
	Save,
	X,
	Trash2,
	Plus,
	Minus,
	Calculator,
	AlertCircle,
	Calendar,
	Truck,
	User,
	Package,
	DollarSign,
	Receipt,
	ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invoiceAPI } from './api';

const EditInvoice = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [invoice, setInvoice] = useState(null);
	const [formData, setFormData] = useState({
		date: '',
		vehicleNumber: '',
		customerName: '',
		items: [{ type: 'Mix', weight: 0, rate: 0, amount: 0 }],
		less: {
			expenses: 0,
			deposit: 0,
		},
		total: 0,
		balance: 0,
	});

	const itemTypes = ['Mix', 'Cast', 'Special', 'Bundle'];

	useEffect(() => {
		fetchInvoice();
	}, [id]);

	const fetchInvoice = async () => {
		try {
			const response = await invoiceAPI.getInvoiceById(id);
			const invoiceData = response.data.data;

			// Format date for input
			const dateObj = new Date(invoiceData.date);
			const formattedDate = dateObj.toISOString().split('T')[0];

			setInvoice(invoiceData);
			setFormData({
				...invoiceData,
				date: formattedDate,
				items: invoiceData.items.map((item) => ({
					...item,
					weight: item.weight || 0,
					rate: item.rate || 0,
					amount: item.amount || 0,
				})),
			});
		} catch (error) {
			toast.error('Failed to load invoice');
			console.error(error);
			navigate('/invoices');
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleItemChange = (index, field, value) => {
		const updatedItems = [...formData.items];

		if (field === 'type') {
			updatedItems[index].type = value;
		} else {
			const numValue = parseFloat(value) || 0;
			updatedItems[index][field] = numValue;

			// Calculate amount if weight or rate changes
			if (field === 'weight' || field === 'rate') {
				const weight =
					field === 'weight' ? numValue : updatedItems[index].weight;
				const rate = field === 'rate' ? numValue : updatedItems[index].rate;
				updatedItems[index].amount = weight * rate;
			}
		}

		setFormData((prev) => ({ ...prev, items: updatedItems }));
		calculateTotals(updatedItems);
	};

	const addItem = () => {
		if (formData.items.length >= 3) {
			toast.error('Maximum 3 items allowed');
			return;
		}
		setFormData((prev) => ({
			...prev,
			items: [...prev.items, { type: 'Mix', weight: 0, rate: 0, amount: 0 }],
		}));
	};

	const removeItem = (index) => {
		if (formData.items.length <= 1) {
			toast.error('At least one item is required');
			return;
		}

		const updatedItems = formData.items.filter((_, i) => i !== index);
		setFormData((prev) => ({ ...prev, items: updatedItems }));
		console.log('formData.items.length', formData.items.length);
		calculateTotals(updatedItems);
	};

	const calculateTotals = (items) => {
		const total = items.reduce((sum, item) => sum + item.amount, 0);
		const expenses = formData.less.expenses || 0;
		const deposit = formData.less.deposit || 0;
		const balance = total - expenses - deposit;

		setFormData((prev) => ({
			...prev,
			total: parseFloat(total.toFixed(2)),
			balance: parseFloat(balance.toFixed(2)),
		}));
	};

	const handleLessChange = (field, value) => {
		const numValue = parseFloat(value) || 0;
		setFormData((prev) => ({
			...prev,
			less: {
				...prev.less,
				[field]: numValue,
			},
			balance:
				prev.total -
				(field === 'expenses' ? numValue : prev.less.expenses) -
				(field === 'deposit' ? numValue : prev.less.deposit),
		}));
	};

 const validateForm = () => {
		const errors = [];

		if (!formData.name) errors.push('Name is required');
		if (!formData.date) errors.push('Date is required');
		if (!formData.vehicleNumber?.trim())
			errors.push('Vehicle number is required');
		if (!formData.customerName?.trim())
			errors.push('Customer name is required');

		// Track material types to detect duplicates
		const materialTypes = new Set();

		formData.items.forEach((item, index) => {
			if (!item.type) {
				errors.push(`Item ${index + 1}: Type is required`);
			} else {
				if (materialTypes.has(item.type)) {
					errors.push(`Duplicate material: ${item.type}`);
				} else {
					materialTypes.add(item.type);
				}
			}

			if (!item.weight || item.weight <= 0) {
				errors.push(`Item ${index + 1}: Valid weight is required`);
			}

			if (!item.rate || item.rate <= 0) {
				errors.push(`Item ${index + 1}: Valid rate is required`);
			}
		});

		if (formData.balance < 0) {
			errors.push('Balance cannot be negative');
		}

		return errors;
 };


	const handleSubmit = async (e) => {
		e.preventDefault();

		const errors = validateForm();
		if (errors.length > 0) {
			errors.forEach((error) => toast.error(error));
			return;
		}

		setSaving(true);
		try {
			// Prepare data for submission
			const submissionData = {
				...formData,
				date: new Date(formData.date),
			};

			await invoiceAPI.updateInvoice(id, submissionData);
			toast.success('Invoice updated successfully!');
			navigate('/invoices');
		} catch (error) {
			toast.error(error.response?.data?.error || 'Failed to update invoice');
			console.error(error);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (
			!window.confirm(
				'Are you sure you want to delete this invoice? This action cannot be undone.'
			)
		) {
			return;
		}

		try {
			await invoiceAPI.deleteInvoice(id);
			toast.success('Invoice deleted successfully!');
			navigate('/invoices');
		} catch (error) {
			toast.error('Failed to delete invoice');
			console.error(error);
		}
	};

	const handleCalculate = () => {
		calculateTotals(formData.items);
		toast.success('Totals recalculated!');
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat('en-NG', {
			style: 'currency',
			currency: 'NGN',
			minimumFractionDigits: 2,
		}).format(amount);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading invoice...</p>
				</div>
			</div>
		);
	}

	if (!invoice) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-gray-800 mb-2">
						Invoice Not Found
					</h2>
					<p className="text-gray-600 mb-6">
						The invoice you're looking for doesn't exist.
					</p>
					<Link
						to="/invoices"
						className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Invoices
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="container mx-auto px-4 py-6">
					<div className="flex flex-col md:flex-row md:items-center justify-between">
						<div>
							<div className="flex items-center">
								<Link
									to="/receipts"
									className="mr-4 p-2 rounded-lg hover:bg-gray-100"
								>
									<ArrowLeft className="w-5 h-5 text-gray-600" />
								</Link>
								<div>
									<h1 className="text-lg md:text-2xl font-bold text-gray-900">
										Edit Invoice
									</h1>
									<p className="text-gray-600">
										Invoice ID:{' '}
										<span className="font-mono font-semibold">
											{invoice._id.slice(-8)}
										</span>
									</p>
								</div>
							</div>
						</div>

						<div className="mt-4 md:mt-0 grid grid-cols-2 md:grid-cols-3 space-x-3 space-y-3 text-sm">
							<button
								onClick={handleDelete}
								className="flex items-center px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
							>
								<Trash2 className="w-4 h-4 mr-2" />
								Delete
							</button>

							<button
								onClick={handleCalculate}
								className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
							>
								<Calculator className="w-4 h-4 mr-2 hidden md:block" />
								Recalculate
							</button>
							<button
								onClick={handleCalculate}
								className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
							>
								<Calculator className="w-4 h-4 mr-2 hidden md:block" />
								Download
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main Form */}
			<div className="container mx-auto px-4 py-8">
				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Basic Information Card */}
					<div className="bg-white rounded-xl shadow-lg overflow-hidden">
						<div className="bg-gradient-to-r from-blue-600 to-blue-800 px-2 md:px-6 py-4">
							<h2 className="text-sm md:text-lg font-bold text-white flex items-center">
								<Receipt className="w-6 h-6 mr-3" />
								Basic Information
							</h2>
						</div>

						<div className="p-4 md:p-6">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{/* Date */}
								<div className="space-y-2">
									<label className="block text-sm font-medium text-gray-700">
										<div className="flex items-center">
											<Calendar className="w-4 h-4 mr-2 text-gray-500" />
											Date <span className="text-red-500">*</span>
										</div>
									</label>
									<input
										type="date"
										name="date"
										value={formData.date}
										onChange={handleInputChange}
										required
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>

								{/* Vehicle Number */}
								<div className="space-y-2">
									<label className="block text-sm font-medium text-gray-700">
										<div className="flex items-center">
											<Truck className="w-4 h-4 mr-2 text-gray-500" />
											Vehicle Number *
										</div>
									</label>
									<input
										type="text"
										name="vehicleNumber"
										value={formData.vehicleNumber}
										onChange={handleInputChange}
										required
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
										placeholder="YLA 871 XU"
									/>
								</div>

								{/* Customer Name */}
								<div className="space-y-2">
									<label className="block text-sm font-medium text-gray-700">
										<div className="flex items-center">
											<User className="w-4 h-4 mr-2 text-gray-500" />
											Customer Name *
										</div>
									</label>
									<input
										type="text"
										name="customerName"
										value={formData.customerName}
										onChange={handleInputChange}
										required
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										placeholder="Jamilu"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Items Card */}
					<div className="bg-white rounded-xl shadow-lg overflow-hidden">
						<div className="bg-gradient-to-r from-green-600 to-green-800 px-2 md:px-6 py-4">
							<div className="flex justify-between items-center">
								<h2 className="text-lg font-bold text-white flex items-center">
									<Package className="w-4 h-4 mr-2" />
									Items
								</h2>
								{formData.items.length < 3 && (
									<button
										type="button"
										onClick={addItem}
										className="flex items-center px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 text-xs"
									>
										<Plus className="w-4 h-4 md:mr-2" />
										<span className="hidden md:block">Add Item</span>
									</button>
								)}
							</div>
						</div>

						<div className="p-4 md:p-6">
							<div className="space-y-6">
								{/* Item Headers - Desktop */}
								<div className="hidden md:grid md:grid-cols-12 gap-4 font-medium text-gray-700 bg-gray-50 p-4 rounded-lg">
									<div className="md:col-span-3">Type *</div>
									<div className="md:col-span-2">Weight (kg) *</div>
									<div className="md:col-span-2">Rate (₦) *</div>
									<div className="md:col-span-2">Amount (₦)</div>
									<div className="md:col-span-1">Action</div>
								</div>

								{/* Item Inputs */}
								{formData.items.map((item, index) => (
									<div
										key={index}
										className="border border-gray-200 rounded-xl p-4 hover:border-blue-300"
									>
										<div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
											{/* Type */}
											<div className="md:col-span-2">
												<label className="md:hidden text-sm font-medium text-gray-700 mb-1">
													Type *
												</label>
												<select
													value={item.type}
													onChange={(e) =>
														handleItemChange(index, 'type', e.target.value)
													}
													className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
												>
													{itemTypes.map((type) => (
														<option key={type} value={type}>
															{type}
														</option>
													))}
												</select>
											</div>

											{/* Weight */}
											<div className="md:col-span-2">
												<label className="md:hidden text-sm font-medium text-gray-700 mb-1">
													Weight (kg) *
												</label>
												<input
													type="number"
													step="0.01"
													min="0"
													value={item.weight}
													onChange={(e) =>
														handleItemChange(index, 'weight', e.target.value)
													}
													className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													placeholder="0.00"
												/>
											</div>

											{/* Rate */}
											<div className="md:col-span-1">
												<label className="md:hidden text-sm font-medium text-gray-700 mb-1">
													Rate (₦) *
												</label>
												<input
													type="number"
													min="0"
													value={item.rate}
													onChange={(e) =>
														handleItemChange(index, 'rate', e.target.value)
													}
													className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													placeholder="0"
												/>
											</div>

											{/* Amount (Read-only) */}
											<div className="md:col-span-2">
												<label className="md:hidden text-sm font-medium text-gray-700 mb-1">
													Amount (₦)
												</label>
												<input
													type="text"
													value={formatCurrency(item.amount)}
													readOnly
													className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg font-semibold"
												/>
											</div>

											{/* Remove Button */}
											<div className="md:col-span-1">
												<button
													type="button"
													onClick={() => removeItem(index)}
													disabled={formData.items.length <= 1}
													className="w-full md:w-auto p-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
												>
													<Minus className="w-5 h-5" />
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Financials Card */}
					<div className="bg-white rounded-xl shadow-lg overflow-hidden">
						<div className="bg-gradient-to-r from-purple-600 to-purple-800 px-4 md:px-6 py-4">
							<h2 className="text-xl font-bold text-white flex items-center">
								<DollarSign className="w-6 h-6 mr-2" />
								Financial Details
							</h2>
						</div>

						<div className="p-4 md:p-6">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
								{/* Expenses & Deposit */}
								<div className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										{/* Expenses */}
										<div className="space-y-2">
											<label className="block text-sm font-medium text-gray-700">
												Expenses (₦)
											</label>
											<div className="relative">
												<span className="absolute left-3 top-3 text-gray-500">
													₦
												</span>
												<input
													type="number"
													min="0"
													value={formData.less.expenses}
													onChange={(e) =>
														handleLessChange('expenses', e.target.value)
													}
													className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													placeholder="0.00"
												/>
											</div>
										</div>

										{/* Deposit */}
										<div className="space-y-2">
											<label className="block text-sm font-medium text-gray-700">
												Deposit (₦)
											</label>
											<div className="relative">
												<span className="absolute left-3 top-3 text-gray-500">
													₦
												</span>
												<input
													type="number"
													min="0"
													value={formData.less.deposit}
													onChange={(e) =>
														handleLessChange('deposit', e.target.value)
													}
													className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													placeholder="0.00"
												/>
											</div>
										</div>
									</div>

									{/* Summary Preview */}
									<div className="bg-gray-50 p-4 md:p-6 rounded-xl">
										<h3 className="font-medium text-gray-700 mb-4">
											Deductions Summary
										</h3>
										<div className="space-y-3">
											<div className="flex justify-between">
												<span className="text-gray-600">Expenses:</span>
												<span className="font-semibold">
													{formatCurrency(formData.less.expenses)}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600">Deposit:</span>
												<span className="font-semibold">
													{formatCurrency(formData.less.deposit)}
												</span>
											</div>
											<div className="pt-3 border-t border-gray-300">
												<div className="flex justify-between">
													<span className="font-medium">
														Total{' '}
														<span className="hidden md:block">Deductions</span>:
													</span>
													<span className="font-bold text-red-600">
														{formatCurrency(
															formData.less.expenses + formData.less.deposit
														)}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Totals */}
								<div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8 rounded-xl">
									<h3 className="text-lg font-bold text-gray-800 mb-6">
										Invoice Totals
									</h3>

									<div className="space-y-4">
										{/* Items Total */}
										<div className="md:flex justify-between items-center pb-4 border-b border-gray-300">
											<div>
												<p className="font-medium text-gray-700">Items Total</p>
												<p className="text-sm text-gray-500">
													{formData.items.length} items
												</p>
											</div>
											<div className="text-right">
												<p className="text-lg md:text-2xl font-bold text-blue-600">
													{formatCurrency(formData.total)}
												</p>
											</div>
										</div>

										{/* Deductions */}
										<div className="space-y-2">
											<div className="md:flex justify-between text-gray-600">
												<span>Expenses:</span>
												<span>-{formatCurrency(formData.less.expenses)}</span>
											</div>
											<div className="md:flex justify-between text-gray-600">
												<span>Deposit:</span>
												<span>-{formatCurrency(formData.less.deposit)}</span>
											</div>
										</div>

										{/* Balance */}
										<div className="pt-6 mt-6 border-t border-gray-300">
											<div className="md:flex justify-between items-center">
												<div>
													<p className="text-sm md:text-lg font-bold text-gray-800">
														Balance Due
													</p>
													<p className="hidden md:block text-sm text-gray-500">
														Final amount to be paid
													</p>
												</div>
												<div className="md:text-right">
													<p
														className={`text-lg md:text-3xl font-bold ${
															formData.balance > 0
																? 'text-green-600'
																: 'text-red-600'
														}`}
													>
														{formatCurrency(formData.balance)}
													</p>
													<p className="md:hidden  text-sm text-gray-500">
														Final amount to be paid
													</p>
												</div>
											</div>
										</div>

										{/* Calculation Breakdown */}
										<div className="hidden md:block mt-6 p-4 bg-white rounded-lg border border-gray-200">
											<p className="text-sm text-gray-600 text-center">
												Calculation: ₦{formData.total.toLocaleString()} - ₦
												{formData.less.expenses.toLocaleString()} - ₦
												{formData.less.deposit.toLocaleString()} =
												<span className="font-bold ml-2">
													₦{formData.balance.toLocaleString()}
												</span>
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="bg-white rounded-xl shadow-lg p-6">
						<div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
							<div className="text-gray-600">
								<p className="text-xsmd:text-sm">
									Make sure all information is correct before saving.
								</p>
								<p className="text-sm font-medium">
									Last updated:{' '}
									{new Date(
										invoice.updatedAt || invoice.createdAt
									).toLocaleDateString()}
								</p>
							</div>

							<div className="flex space-x-4 text-sm">
								<Link
									to="/invoices"
									className="flex items-center px-4 md:px-6 py-2 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
								>
									<X className="w-4 h-4 mr-2" />
									Cancel
								</Link>

								<button
									type="submit"
									disabled={saving}
									className="flex items-center p-4 md:px-8 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{saving ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
											Saving...
										</>
									) : (
										<>
											<Save className="w-4 h-4 mr-2" />
											Save <span className="hidden md:inline">Changes</span>
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditInvoice;
