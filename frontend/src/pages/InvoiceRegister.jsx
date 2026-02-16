import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Phone, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../hooks/getError';
import Loader from '../components/Loader';
import { fetchWaybill } from '../hooks/axiosApis';
import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import AuthContext from '../context/authContext';

// Helper: generate a unique filename suffix
const generateFileSuffix = () =>
	Date.now() + '-' + Math.random().toString(36).substr(2, 9);

// Time slots for selects
const TIME_SLOTS = [
	'08:00 AM',
	'09:00 AM',
	'10:00 AM',
	'11:00 AM',
	'12:00 PM',
	'01:00 PM',
	'02:00 PM',
	'03:00 PM',
	'04:00 PM',
	'05:00 PM',
	'06:00 PM',
	'07:00 PM',
	'08:00 PM',
	'09:00 PM',
	'10:00 PM',
	'11:00 PM',
	'12:00 AM',
	'01:00 AM',
	'02:00 AM',
	'03:00 AM',
	'04:00 AM',
	'05:00 AM',
	'06:00 AM',
	'07:00 AM',
];

// Number to words (simplified, can be extracted to a util)
const numberToWords = (num) => {
	if (num === 0) return 'Zero';
	const ones = [
		'',
		'One',
		'Two',
		'Three',
		'Four',
		'Five',
		'Six',
		'Seven',
		'Eight',
		'Nine',
	];
	const tens = [
		'',
		'',
		'Twenty',
		'Thirty',
		'Forty',
		'Fifty',
		'Sixty',
		'Seventy',
		'Eighty',
		'Ninety',
	];
	const teens = [
		'Ten',
		'Eleven',
		'Twelve',
		'Thirteen',
		'Fourteen',
		'Fifteen',
		'Sixteen',
		'Seventeen',
		'Eighteen',
		'Nineteen',
	];
	const convertLessThanThousand = (n) => {
		if (n === 0) return '';
		if (n < 10) return ones[n];
		if (n < 20) return teens[n - 10];
		if (n < 100)
			return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
		return (
			ones[Math.floor(n / 100)] +
			' Hundred' +
			(n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '')
		);
	};
	const chunks = [];
	let n = num;
	while (n > 0) {
		chunks.push(n % 1000);
		n = Math.floor(n / 1000);
	}
	const units = [
		'',
		'Thousand',
		'Million',
		'Billion',
		'Trillion',
		'Quadrillion',
		'Quintillion',
	];
	let words = [];
	for (let i = 0; i < chunks.length; i++) {
		if (chunks[i] !== 0) {
			words.unshift(convertLessThanThousand(chunks[i]) + ' ' + units[i]);
		}
	}
	return words.join(' ').trim() + ' Naira Only';
};

const InvoiceRegister = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const apiUrl = import.meta.env.VITE_API_URL;
	const isEdit = Boolean(id);
	const { user } = useContext(AuthContext);
	// Fetch invoice data if editing
	const { data: fetchedData, isLoading: isFetching } = useQuery({
		queryKey: ['waybills', id],
		queryFn: () => fetchWaybill(id, user),
		enabled: isEdit,
	});

	// Local state for the form
	const [formData, setFormData] = useState({
		name: '',
		vehicle: '',
		destination: '',
		note: '',
		date: new Date().toISOString().split('T')[0], // YYYY-MM-DD for input[type=date]
		timeIn: TIME_SLOTS[0],
		timeOut: TIME_SLOTS[0],
	});

	// Items state
	const [items, setItems] = useState([
		{ sn: 1, description: '', qty: '', rate: '', amount: '' },
		{ sn: 2, description: '', qty: '', rate: '', amount: '' },
		{ sn: 3, description: '', qty: '', rate: '', amount: '' },
		{ sn: 4, description: '', qty: '', rate: '', amount: '' },
		{ sn: 5, description: '', qty: '', rate: '', amount: '' },
		{ sn: 6, description: '', qty: '', rate: '', amount: '' },
		{ sn: 7, description: '', qty: '', rate: '', amount: '' },
		{ sn: 8, description: '', qty: '', rate: '', amount: '' },
		{ sn: 9, description: '', qty: '', rate: '', amount: '' },
		{ sn: 10, description: '', qty: '', rate: '', amount: '' },
	]);

	// Loading state for save operation
	const [saving, setSaving] = useState(false);

	// Populate form with fetched data when available
	useEffect(() => {
		if (fetchedData) {
			setFormData({
				name: fetchedData.name || '',
				note: fetchedData.note || '',
				vehicle: fetchedData.vehicle || '',
				destination: fetchedData.destination || '',
				date: fetchedData.date
					? new Date(fetchedData.date).toISOString().split('T')[0]
					: '',
				timeIn: fetchedData.timeIn || TIME_SLOTS[0],
				timeOut: fetchedData.timeOut || TIME_SLOTS[0],
			});
			if (fetchedData.items && fetchedData.items.length) {
				setItems(fetchedData.items);
			}
		}
	}, [fetchedData]);

	// Update a specific item field
	const updateItem = (index, field, value) => {
		setItems((prev) => {
			const updated = [...prev];
			updated[index][field] = value;

			// Auto-calculate amount if both qty and rate are valid numbers
			if (field === 'qty' || field === 'rate') {
				const qty = parseFloat(updated[index].qty) || 0;
				const rate = parseFloat(updated[index].rate) || 0;
				updated[index].amount = qty && rate ? (qty * rate).toString() : '';
			}
			return updated;
		});
	};

	// Add a new empty row
	const addItem = () => {
		setItems((prev) => [
			...prev,
			{ sn: prev.length + 1, description: '', qty: '', rate: '', amount: '' },
		]);
	};

	const removeItem = (sn) => {
		if (items.length <= 1) return; // keep at least one row
		const newItems = items.filter((item) => item.sn !== sn);
		// Re-serialize sn to maintain 1-based consecutive numbers
		const serializedItems = newItems.map((item, index) => ({
			...item,
			sn: index + 1,
		}));
		setItems(serializedItems);
	};

	// Compute total amount
	const total = useMemo(() => {
		return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
	}, [items]);

	// Validate items: each non‑empty row must have description, qty, rate
	const validateItems = () => {
		const incomplete = items.filter((item) => {
			const hasDescription = item.description.trim() !== '';
			const hasQty = item.qty.toString().trim() !== '';
			const hasRate = item.rate.toString().trim() !== '';
			// If any field is filled, all three must be filled
			if (hasDescription || hasQty || hasRate) {
				return !(hasDescription && hasQty && hasRate);
			}
			return false; // completely empty rows are allowed
		});
		return incomplete.length === 0;
	};

	// Handle form submission (create or update)
	const handleSave = async () => {
		// Basic customer name check
		if (!formData.name.trim()) {
			return toast.error('Please enter customer name');
		}

		if (!validateItems()) {
			return toast.error(
				'Please fill in all fields for each item (description, qty, rate)',
			);
		}

		setSaving(true);
		try {
			const payload = {
				...formData,
				items: items.map((item) => ({
					...item,
					qty: parseFloat(item.qty) || 0,
					rate: parseFloat(item.rate) || 0,
					amount: parseFloat(item.amount) || 0,
				})),
				total,
			};

			// Include auth token if needed
			// const token = localStorage.getItem('token'); // adjust as needed
			const config = {
				headers: { Authorization: `Bearer ${user.token}` },
			};

			let response;
			if (isEdit) {
				response = await axios.put(`${apiUrl}/waybills/${id}`, payload, config);
				toast.success('Invoice updated successfully');
			} else {
				response = await axios.post(`${apiUrl}/waybills`, payload, config);
				toast.success('Invoice created successfully');
			}

			// Invalidate relevant queries
			queryClient.invalidateQueries({ queryKey: ['waybills'] });
			queryClient.invalidateQueries({ queryKey: ['waybills', id] });

			navigate('/register-invoices'); // adjust route as needed
		} catch (error) {
			const message = getError(error);
			toast.error(message);
		} finally {
			setSaving(false);
		}
	};

	// Generate PDF from the waybill preview
	const downloadPDF = () => {
		const originalElement = document.getElementById('waybill');
		if (!originalElement) return;
		// Clone the element to avoid modifying the live DOM
		const clone = originalElement.cloneNode(true);
		
		// Remove the action column header and all delete buttons
		clone
			.querySelectorAll('.action-col, .delete-cell')
			.forEach((el) => el.remove());

		// Replace all inputs with divs showing the current value
		const inputs = clone.querySelectorAll('input, select');
		inputs.forEach((input) => {
			const div = document.createElement('div');
			div.textContent =
				input.value || input.options?.[input.selectedIndex]?.text || '';
			// Copy basic styles to preserve layout
			div.style.width = '100%';
			div.style.border = 'none';
			div.style.padding = '5px';
			div.style.boxSizing = 'border-box';
			div.style.fontFamily = 'inherit';
			div.style.fontSize = 'inherit';
			input.parentNode.replaceChild(div, input);
		});

		// Hide clone off-screen for capture
		clone.style.position = 'absolute';
		clone.style.left = '-9999px';
		clone.style.top = '0';
		document.body.appendChild(clone);

		html2canvas(clone, { scale: 2, backgroundColor: '#ffffff' })
			.then((canvas) => {
				const imgData = canvas.toDataURL('image/png');
				const pdf = new jsPDF('p', 'pt', 'a4');
				const pageWidth = pdf.internal.pageSize.getWidth();
				const pageHeight = pdf.internal.pageSize.getHeight();
				const imgWidth = pageWidth;
				const imgHeight = (canvas.height * imgWidth) / canvas.width;

				let heightLeft = imgHeight;
				let position = 0;
				pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
				heightLeft -= pageHeight;

				while (heightLeft > 0) {
					position = heightLeft - imgHeight;
					pdf.addPage();
					pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
					heightLeft -= pageHeight;
				}

				const suffix = generateFileSuffix();
				pdf.save(`waybill-${suffix}.pdf`);
			})
			.catch((error) => {
				console.error('PDF generation error:', error);
				toast.error('Failed to generate PDF');
			})
			.finally(() => {
				if (document.body.contains(clone)) document.body.removeChild(clone);
			});
	};;

	if (isFetching) return <Loader />;

	return (
		<>
			<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
				{/* Waybill Preview */}
				<div
					id="waybill"
					style={{
						width: '800px',
						margin: '0 auto',
						border: '1px solid #000',
						// borderBottom: 'none',
						padding: '20px',
						paddingBottom: '40px',
						backgroundColor: '#fff',
						fontSize: '14px',
						color: '#333',
						boxSizing: 'border-box',
					}}
				>
					{/* Header */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '10px',
							marginBottom: '10px',
						}}
					>
						<div style={{ flexShrink: 0 }}>
							<img
								src={logo}
								alt="Salisu Logo"
								width="80"
								height="80"
								style={{ objectFit: 'contain' }}
							/>
						</div>
						<div style={{ flex: 1, textAlign: 'center' }}>
							<h2 style={{ margin: 0, fontSize: '25px', fontWeight: 'bold' }}>
								SALISU KANO INTERNATIONAL LIMITED
							</h2>
							<p style={{ margin: 0 }}>
								<strong>
									Scrap Materials’ Suppliers and General Contractors
								</strong>
							</p>
							<p style={{ margin: '5px 0' }}>
								<strong>Address:</strong> No. 2 & 3 Block P, Dalar Gyade Market,
								Kano State
							</p>
						</div>
						<div
							style={{
								flexShrink: 0,
								display: 'flex',
								alignItems: 'center',
								gap: '5px',
							}}
						>
							<Phone size={20} />
							<div>
								<p style={{ margin: 0 }}>08067237273</p>
								<p style={{ margin: 0 }}>08030675636</p>
								<p style={{ margin: 0 }}>08164927179</p>
							</div>
						</div>
					</div>

					<hr style={{ border: '1px solid #000' }} />
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							marginBottom: '15px',
						}}
					>
						<h3
							style={{
								fontSize: '18px',
								backgroundColor: '#000',
								fontWeight: 'bold',
								margin: '10px auto',
								textAlign: 'center',
								color: '#fff',
								width: 'fit-content',
								padding: '6px 12px',
								display: 'inline-block',
							}}
						>
							WAYBILL/RECEIPT
						</h3>
					</div>

					{/* Customer Details */}
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							marginBottom: '5px',
							gap: '10px',
						}}
					>
						<div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
							<strong
								style={{
									whiteSpace: 'nowrap',
								}}
							>
								CUSTOMER NAME:
							</strong>
							<input
								type="text"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								style={{
									width: '100%',
									marginLeft: '5px',
									border: '1px solid #000',
									padding: '2px',
								}}
							/>
						</div>
						<div
							style={{
								flex: 1,
								// textAlign: 'right',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							<strong
								style={{
									whiteSpace: 'nowrap',
								}}
							>
								DATE:
							</strong>
							<input
								type="date"
								value={formData.date}
								onChange={(e) =>
									setFormData({ ...formData, date: e.target.value })
								}
								style={{
									width: '100%',
									marginLeft: '5px',
									border: '1px solid #000',
									padding: '2px',
								}}
							/>
						</div>
					</div>

					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							marginBottom: '5px',
							gap: '10px',
						}}
					>
						<div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
							<strong
								style={{
									whiteSpace: 'nowrap',
								}}
							>
								VEHICLE REG. NO.:
							</strong>
							<input
								type="text"
								value={formData.vehicle}
								onChange={(e) =>
									setFormData({ ...formData, vehicle: e.target.value })
								}
								style={{
									width: '100%',
									marginLeft: '5px',
									border: '1px solid #000',
									padding: '2px',
								}}
							/>
						</div>
						<div
							style={{
								flex: 1,
								// textAlign: 'right',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							<strong
								style={{
									whiteSpace: 'nowrap',
								}}
							>
								TIME IN:
							</strong>
							<select
								value={formData.timeIn}
								onChange={(e) =>
									setFormData({ ...formData, timeIn: e.target.value })
								}
								style={{
									width: '100%',
									marginLeft: '5px',
									border: '1px solid #000',
									padding: '2px',
								}}
							>
								{TIME_SLOTS.map((slot) => (
									<option key={slot} value={slot}>
										{slot}
									</option>
								))}
							</select>
						</div>
					</div>

					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							marginBottom: '20px',
							gap: '10px',
						}}
					>
						<div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
							<strong
								style={{
									whiteSpace: 'nowrap',
								}}
							>
								DESTINATION:
							</strong>
							<input
								type="text"
								value={formData.destination}
								onChange={(e) =>
									setFormData({ ...formData, destination: e.target.value })
								}
								style={{
									width: '100%',
									marginLeft: '5px',
									border: '1px solid #000',
									padding: '2px',
								}}
							/>
						</div>
						<div
							style={{
								flex: 1,
								// textAlign: 'right',
								display: 'flex',
								alignItems: 'center',
							}}
						>
							<strong
								style={{
									whiteSpace: 'nowrap',
								}}
							>
								TIME OUT:
							</strong>
							<select
								value={formData.timeOut}
								onChange={(e) =>
									setFormData({ ...formData, timeOut: e.target.value })
								}
								style={{
									width: '100%',
									marginLeft: '5px',
									border: '1px solid #000',
									padding: '2px',
								}}
							>
								{TIME_SLOTS.map((slot) => (
									<option key={slot} value={slot}>
										{slot}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Items Table */}
					<table
						style={{
							width: '100%',
							borderCollapse: 'collapse',
							marginBottom: '10px',
						}}
					>
						<thead
							style={{
								color: '#fff',
								backgroundColor: '#000',
								border: '1px solid #000',
							}}
						>
							<tr>
								<th style={{ border: '1px solid #fff', padding: '4px' }}>
									S/N
								</th>
								<th style={{ border: '1px solid #fff', padding: '8px' }}>
									DESCRIPTION OF GOODS
								</th>
								<th
									style={{
										border: '1px solid #fff',
										padding: '8px',
										width: '100px',
									}}
								>
									QTY/TONNAGE
								</th>
								<th
									style={{
										border: '1px solid #fff',
										padding: '8px',
										width: '100px',
									}}
								>
									RATE/KG
								</th>
								<th
									style={{
										border: '1px solid #fff',
										padding: '8px',
										width: '100px',
									}}
								>
									AMOUNT #
								</th>
								<th
									className="action-col"
									style={{ border: '1px solid #fff', padding: '8px' }}
								>
									Action
								</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item, index) => (
								<tr key={index}>
									<td
										style={{
											border: '0.5px solid #000',
											padding: '4px',
											textAlign: 'center',
										}}
									>
										{item.sn}
									</td>
									<td
										style={{ border: '0.5px solid #000', padding: '8px 8px 0' }}
									>
										<input
											type="text"
											value={item.description}
											onChange={(e) =>
												updateItem(index, 'description', e.target.value)
											}
											style={{
												width: '100%',
												border: 'none',
												outline: 'none',
												background: 'transparent',
											}}
										/>
									</td>
									<td
										style={{ border: '0.5px solid #000', padding: '8px 8px 0' }}
									>
										<input
											type="text"
											value={item.qty}
											onChange={(e) => updateItem(index, 'qty', e.target.value)}
											style={{
												width: '100%',
												border: 'none',
												outline: 'none',
												background: 'transparent',
											}}
										/>
									</td>
									<td
										style={{ border: '0.5px solid #000', padding: '8px 8px 0' }}
									>
										<input
											type="text"
											value={item.rate}
											onChange={(e) =>
												updateItem(index, 'rate', e.target.value)
											}
											style={{
												width: '100%',
												border: 'none',
												outline: 'none',
												background: 'transparent',
											}}
										/>
									</td>
									<td
										style={{
											border: '0.5px solid #000',
											padding: '8px',
											textAlign: 'right',
										}}
									>
										{item.amount
											? parseFloat(item.amount).toLocaleString()
											: ''}
									</td>
									<td
										className="delete-cell"
										style={{ border: '0.5px solid #000', padding: '8px', textAlign: 'center' }}
									>
										<button
											onClick={() => removeItem(item.sn)}
											className="text-red-600 hover:text-red-800 mx-auto"
											title="Delete"
										>
											<Trash2 size={18} />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{/* Total */}
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
							marginBottom: '20px',
						}}
					>
						<strong style={{ marginRight: '10px' }}>TOTAL #</strong>
						<div
							style={{
								minWidth: '100px',
								textAlign: 'right',
								borderBottom: '0.2px solid #000',
								boxSizing: 'border-box',
								paddingBottom: '5px',
								fontWeight: 'bold',
							}}
						>
							{total.toLocaleString()}
							{/* <hr style={{ border: '0.2px solid #000', marginTop: '5px' }} /> */}
						</div>
					</div>

					{/* Amount in Words */}
					<div
						style={{
							marginBottom: '15px',
							borderBottom: '0.2px solid #000',
							boxSizing: 'border-box',
							paddingBottom: '5px',
						}}
					>
						<strong>Amount in Words:</strong>{' '}
						<span>{numberToWords(total)}</span>
						{/* <hr style={{ border: '0.2px solid #000', marginTop: '5px' }} /> */}
					</div>

					{/* Comments and Signature */}
					<div
						style={{
							// display: 'flex',
							// justifyContent: 'space-between',
							// alignItems: 'center',
							// flexDirection: 'column',
							marginBottom: '20px',
						}}
					>
						<strong>Other Comments</strong>{' '}
						<textarea
							value={formData.note}
							onChange={(e) => setFormData('note', e.target.value)}
							style={{
								width: '100%',
								outline: 'none',
								background: 'transparent',
								border: '1px solid #000',
								padding: '5px',
								marginTop: '5px',
							}}
						></textarea>
					</div>

					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							// alignItems: 'center',
							// border: '1px solid #000',
							alignItems: 'flex-end',
							alignContent: 'flex-end',
						}}
					>
						<div
							style={{
								display: 'flex',
								// border: '1px solid red',
								flexDirection: 'column',
							}}
						>
							<p>_________________________</p>
							<strong>Customer's Representative</strong> <em>.</em>
						</div>

						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '5px',
								// border: '1px solid green',
							}}
						>
							<img
								src={seal}
								alt="Salisu Seal"
								width="90"
								height="90"
								style={{
									objectFit: 'cover',
									marginBottom: '-30px',
								}}
							/>

							<p>_________________________</p>
							<strong>Agent's Sign</strong>
							<em>For: Salisu Kano Int'l Ltd</em>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div style={{ textAlign: 'center', marginTop: '20px' }}>
					<button
						onClick={addItem}
						style={{
							padding: '8px 16px',
							backgroundColor: '#28a745',
							color: '#fff',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '14px',
							marginRight: '10px',
						}}
					>
						Add Item
					</button>
					<button
						onClick={downloadPDF}
						style={{
							padding: '10px 20px',
							fontSize: '16px',
							backgroundColor: '#007bff',
							color: '#fff',
							border: 'none',
							borderRadius: '5px',
							cursor: 'pointer',
							marginRight: '10px',
						}}
					>
						Download Waybill as PDF
					</button>
					<button
						onClick={handleSave}
						disabled={saving}
						style={{
							padding: '10px 20px',
							fontSize: '16px',
							backgroundColor: '#ffc107',
							color: '#000',
							border: 'none',
							borderRadius: '5px',
							cursor: 'pointer',
						}}
					>
						{saving ? 'Saving...' : isEdit ? 'Update Invoice' : 'Save Invoice'}
					</button>
				</div>
			</div>
			{(isFetching || saving) && <Loader />}
		</>
	);
};

export default InvoiceRegister;
