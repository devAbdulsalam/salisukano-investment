import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import { Phone, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../hooks/getError';
import Loader from '../components/Loader';
import autoTable from 'jspdf-autotable';
import { fetchWaybill, fetchCustomers } from '../hooks/axiosApis';
import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import phone from '../assets/call.png';
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
	const [loading, setLoading] = useState(false);
	const [logoBase64, setLogoBase64] = useState('');
	const [sealBase64, setSealBase64] = useState('');
	const [phoneBase64, setPhoneBase64] = useState('new'); // 'new' or 'existing'
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
		timeOut: TIME_SLOTS[1],
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

	// Load logo as base64
	useEffect(() => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = logo;
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			ctx?.drawImage(img, 0, 0);
			setLogoBase64(canvas.toDataURL('image/png'));
		};
	}, []);
	useEffect(() => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = seal;
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			ctx?.drawImage(img, 0, 0);
			setSealBase64(canvas.toDataURL('image/png'));
		};
	}, []);
	useEffect(() => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = phone;
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			ctx?.drawImage(img, 0, 0);
			setPhoneBase64(canvas.toDataURL('image/png'));
		};
	}, []);

	// Generate PDF from the waybill preview
	const downloadPDF = async () => {
		setLoading(true);

		try {
			const doc = new jsPDF('p', 'mm', 'a4');
			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();

			// ===============================
			// HEADER SECTION
			// ===============================

			if (logoBase64) {
				doc.addImage(logoBase64, 'PNG', 14, 10, 25, 25);
			}

			doc.setFont('helvetica', 'bold');
			doc.setFontSize(16);
			doc.text('SALISU KANO INTERNATIONAL LIMITED', pageWidth / 2, 18, {
				align: 'center',
			});

			doc.setFontSize(10);
			doc.setFont('helvetica', 'normal');
			doc.text(
				"Scrap Materials' Suppliers and General Contractors",
				pageWidth / 2,
				24,
				{ align: 'center' },
			);

			doc.text(
				'No. 2 & 3 Block P, Dalar Gyade Market, Kano State',
				pageWidth / 2,
				29,
				{ align: 'center' },
			);
			// Phone Numbers
			const phoneX = pageWidth - 14;

			doc.text('08067237273', phoneX, 18, { align: 'right' });

			// Second number with icon
			doc.text('08030675636', phoneX, 23, { align: 'right' });

			// Small phone icon before second number
			if (phoneBase64) {
				doc.addImage(
					phoneBase64,
					'PNG',
					phoneX - 30, // move left from right margin
					18, // slightly above 23 for vertical center
					10, // width (small)
					10, // height
				);
			}

			doc.text('08164927179', phoneX, 28, { align: 'right' });

			// Title
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(14);
			doc.setFillColor(0);
			doc.rect(pageWidth / 2 - 30, 35, 60, 10, 'F');
			doc.setTextColor(255);

			doc.setLineWidth(0.4);
			doc.line(14, 40, pageWidth - 14, 40);

			doc.text('WAYBILL / RECEIPT', pageWidth / 2, 42, { align: 'center' });
			doc.setTextColor(0);

			// ===============================
			// CUSTOMER INFO SECTION
			// ===============================

			let infoY = 55;

			doc.setFontSize(10);

			doc.setFont('helvetica', 'bold');
			doc.text('Customer Name:', 14, infoY);
			doc.text('Date:', pageWidth - 60, infoY);

			doc.setFont('helvetica', 'normal');
			doc.text(formData.name || '-', 45, infoY);
			doc.text(formData.date || '-', pageWidth - 40, infoY);

			infoY += 8;

			doc.setFont('helvetica', 'bold');
			doc.text('Vehicle Reg. No:', 14, infoY);
			doc.text('Time In:', pageWidth - 60, infoY);

			doc.setFont('helvetica', 'normal');
			doc.text(formData.vehicle || '-', 45, infoY);
			doc.text(formData.timeIn || '-', pageWidth - 40, infoY);

			infoY += 8;

			doc.setFont('helvetica', 'bold');
			doc.text('Deliver To:', 14, infoY);
			doc.text('Time Out:', pageWidth - 60, infoY);

			doc.setFont('helvetica', 'normal');
			doc.text(formData.destination || '-', 45, infoY);
			doc.text(formData.timeOut || '-', pageWidth - 40, infoY);

			// doc.setLineWidth(0.4);
			// doc.line(14, infoY + 5, pageWidth - 14, infoY + 5);

			// ===============================
			// TABLE SECTION
			// ===============================

			const tableStartY = infoY + 10;

			// Prepare filled rows
			const filledRows = items
				.filter(
					(item) => item.description || item.qty || item.rate || item.amount,
				)
				.map((item, index) => [
					index + 1,
					item.description || '',
					item.qty || '',
					item.rate ? parseFloat(item.rate).toLocaleString() : '',
					item.amount ? parseFloat(item.amount).toLocaleString() : '',
				]);

			// Ensure minimum 10 rows
			while (filledRows.length < 10) {
				filledRows.push(['', '', '', '', '']);
			}

			autoTable(doc, {
				startY: tableStartY,
				head: [
					[
						'S/N',
						'Description of Goods',
						'Qty/Tonnage',
						'Rate/KG',
						'Amount (#)',
					],
				],
				body: filledRows,
				theme: 'grid',
				styles: {
					fontSize: 9,
					cellPadding: 3,
					lineColor: [0, 0, 0],
					lineWidth: 0.3,
				},
				headStyles: {
					fillColor: [0, 0, 0],
					textColor: 255,
					fontStyle: 'bold',
					lineWidth: 0.5,
				},
				columnStyles: {
					0: { cellWidth: 12, halign: 'center' },
					1: { cellWidth: 'auto' },
					2: { cellWidth: 25, halign: 'right' },
					3: { cellWidth: 25, halign: 'right' },
					4: { cellWidth: 30, halign: 'right' },
				},
			});

			let finalY = doc.lastAutoTable.finalY;

			// ===============================
			// TOTAL SECTION
			// ===============================

			const totalY = finalY + 6;

			doc.setFont('helvetica', 'bold');
			doc.setFontSize(11);

			const amountText = `# ${total.toLocaleString()}`;
			const labelText = 'TOTAL:';

			// Measure widths
			const amountWidth = doc.getTextWidth(amountText);
			const labelWidth = doc.getTextWidth(labelText);

			// Right margin
			const rightMargin = 14;

			// Position amount (always right aligned)
			const amountX = pageWidth - rightMargin;

			// Add amount
			doc.text(amountText, amountX, totalY, { align: 'right' });

			// Calculate label position dynamically
			const spacing = 6; // space between label and amount
			const labelX = amountX - amountWidth - spacing - labelWidth;

			// Add label
			doc.text(labelText, labelX, totalY);
			doc.setLineWidth(0.4);
			doc.line(pageWidth - 60, totalY + 2, pageWidth - 14, totalY + 2);

			// ===============================
			// AMOUNT IN WORDS
			// ===============================

			const wordsY = totalY + 12;

			doc.setFont('helvetica', 'bold');
			doc.text('Amount in Words:', 14, wordsY);

			doc.setLineWidth(0.4);
			doc.rect(14, wordsY + 3, pageWidth - 28, 15);

			doc.setFont('helvetica', 'normal');
			doc.setFontSize(9);

			const words = numberToWords(total);
			const splitWords = doc.splitTextToSize(words, pageWidth - 32);
			doc.text(splitWords, 16, wordsY + 9);

			// ===============================
			// OTHER COMMENTS
			// ===============================

			const commentY = wordsY + 25;

			doc.setFont('helvetica', 'bold');
			doc.text('Other Comments:', 14, commentY);

			doc.rect(14, commentY + 3, pageWidth - 28, 20);

			doc.setFont('helvetica', 'normal');
			doc.setFontSize(9);

			if (formData.note) {
				const noteLines = doc.splitTextToSize(formData.note, pageWidth - 32);
				doc.text(noteLines, 16, commentY + 9);
			}

			// ===============================
			// SIGNATURE SECTION
			// ===============================

			const footerY = pageHeight - 30;

			doc.setLineWidth(0.4);

			doc.line(14, footerY, 80, footerY);
			doc.text("Customer's Representative", 14, footerY + 5);

			doc.line(pageWidth - 80, footerY, pageWidth - 14, footerY);
			doc.text("Agent's Signature", pageWidth - 80, footerY + 5);
			doc.text("For: Salisu Kano Int'l Ltd", pageWidth - 80, footerY + 10);

			if (sealBase64) {
				doc.addImage(sealBase64, 'PNG', pageWidth - 60, footerY - 20, 30, 30);
			}

			// ===============================
			// SAVE FILE
			// ===============================

			doc.save(`Waybill-${generateFileSuffix()}.pdf`);
		} catch (error) {
			console.error(error);
			toast.error('Failed to generate PDF');
		} finally {
			setLoading(false);
		}
	};

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
							INVOICE/RECEIPT
						</h3>
					</div>

					{/* Customer Details */}
					{/* Toggle between new and existing customer */}
					{/* 
					<div className="action-col" style={{ marginBottom: '8px' }}>
						<label>
							<input
								type="radio"
								value="new"
								checked={customerMode === 'new'}
								onChange={() => setCustomerMode('new')}
							/>
							<span style={{ paddingLeft: '5px' }}>New customer</span>
						</label>
						<label style={{ marginLeft: '12px' }}>
							<input
								type="radio"
								value="existing"
								checked={customerMode === 'existing'}
								onChange={() => setCustomerMode('existing')}
							/>
							<span style={{ paddingLeft: '5px' }}>Select existing</span>
						</label>
					</div> 
					*/}
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							marginBottom: '5px',
							gap: '10px',
						}}
					>
						<div
							style={{
								flex: 1,
								display: 'flex',
								justifyContent: 'space-between',
							}}
						>
							<strong
								style={{
									whiteSpace: 'nowrap',
								}}
							>
								CUSTOMER NAME:
							</strong>
							<input
								id="newCustomer"
								type="text"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								style={{
									width: '100%',
									border: '1px solid #000',
									marginLeft: '5px',
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
								DELIVER TO:
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
									className="action-col flex items-center justify-center"
									style={{ border: '1px solid #fff', padding: '8px' }}
								>
									<span>Action</span>
									<button
										onClick={addItem}
										className="text-green-600 hover:text-green-800 ml-2"
										title="Delete"
									>
										<Plus size={18} />
									</button>
								</th>
							</tr>
						</thead>
						<tbody>
							{items?.map((item, index) => (
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
											// style={{
											// 	width: '100%',
											// 	border: 'none',
											// 	outline: 'none',
											// 	background: 'transparent',
											// }}
											style={{
												marginLeft: '5px',
												width: '100%',
												border: 'none',
												outline: 'none',
												backgroundColor: '#fff',
												fontSize: '14px',
												padding: '2px 0',
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
											// style={{
											// 	width: '100%',
											// 	border: 'none',
											// 	outline: 'none',
											// 	background: 'transparent',
											// }}
											style={{
												marginLeft: '5px',
												width: '100%',
												border: 'none',
												outline: 'none',
												backgroundColor: '#fff',
												fontSize: '14px',
												padding: '2px 0',
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
										style={{
											border: '0.5px solid #000',
											padding: '8px',
											textAlign: 'center',
										}}
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
							onChange={(e) =>
								setFormData({ ...formData, note: e.target.value })
							}
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
						{loading ? 'Loading...' : '	Download Waybill'}
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
