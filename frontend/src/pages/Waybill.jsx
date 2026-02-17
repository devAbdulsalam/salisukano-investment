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
import { fetchWaybill, fetchCustomers } from '../hooks/axiosApis';
import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import AuthContext from '../context/authContext';

// Helper: generate a unique filename suffix
const generateFileSuffix = () =>
	Date.now() + '-' + Math.random().toString(36).substr(2, 9);

const Waybill = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const apiUrl = import.meta.env.VITE_API_URL;
	const isEdit = Boolean(id);
	const { user } = useContext(AuthContext);
	// Fetch invoice data if editing
	const { data: fetchedData, isLoading: isFetching } = useQuery({
		queryKey: ['waybill-registers', id],
		queryFn: () => fetchWaybill(id, user),
		enabled: isEdit,
	});
	// Local state for the form
	// gross = net + dust + tare
	const [formData, setFormData] = useState({
		name: '',
		vehicle: '',
		tare: 0,
		gross: 0,
		dust: 0,
		date: new Date().toISOString().split('T')[0], // YYYY-MM-DD for input[type=date]
		note: '',
	});

	// Loading state for save operation
	const [saving, setSaving] = useState(false);

	// Populate form with fetched data when available
	useEffect(() => {
		if (fetchedData) {
			setFormData({
				name: fetchedData.name || '',
				note: fetchedData.note || '',
				vehicle: fetchedData.vehicle || '',
				tare: fetchedData.tare || 0,
				gross: fetchedData.gross || 0,
				dust: fetchedData.dust || 0,
				date: fetchedData.date
					? new Date(fetchedData.date).toISOString().split('T')[0]
					: '',
			});
		}
	}, [fetchedData]);

	// Compute gross total
	const net = useMemo(() => {
		return (
			Number(formData.gross || 0) -
			Number(formData.dust || 0) -
			Number(formData.tare || 0)
		);
	}, [formData.gross, formData.dust, formData.tare]);
	// Handle form submission (create or update)
	const handleSave = async () => {
		// Basic customer name check
		if (!formData.name.trim()) {
			return toast.error('Please enter customer name');
		}

		setSaving(true);
		try {
			const payload = {
				...formData,
			};

			// Include auth token if needed
			// const token = localStorage.getItem('token'); // adjust as needed
			const config = {
				headers: { Authorization: `Bearer ${user.token}` },
			};

			let response;
			if (isEdit) {
				response = await axios.put(
					`${apiUrl}/waybill-registers/${id}`,
					payload,
					config,
				);
				toast.success('Invoice updated successfully');
			} else {
				response = await axios.post(
					`${apiUrl}/waybill-registers`,
					payload,
					config,
				);
				toast.success('Invoice created successfully');
			}

			// Invalidate relevant queries
			queryClient.invalidateQueries({ queryKey: ['waybill-registers'] });
			queryClient.invalidateQueries({ queryKey: ['waybill-registers', id] });

			navigate('/waybills'); // adjust route as needed
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
		clone.querySelectorAll('.delete-el').forEach((el) => el.remove());

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
				pdf.save(`Register-${suffix}.pdf`);
			})
			.catch((error) => {
				console.error('PDF generation error:', error);
				toast.error('Failed to generate PDF');
			})
			.finally(() => {
				if (document.body.contains(clone)) document.body.removeChild(clone);
			});
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
									padding: '2px',
									marginLeft: '5px',
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
								Gross:
							</strong>
							<input
								type="number"
								value={formData.gross}
								onChange={(e) =>
									setFormData({ ...formData, gross: e.target.value })
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
								Tare:
							</strong>
							<input
								type="number"
								value={formData.tare}
								onChange={(e) =>
									setFormData({ ...formData, tare: e.target.value })
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
							marginBottom: '20px',
							gap: '10px',
						}}
					>
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
								Dust:
							</strong>
							<input
								type="number"
								value={formData.dust}
								onChange={(e) =>
									setFormData({ ...formData, dust: e.target.value })
								}
								style={{
									width: '100%',
									marginLeft: '5px',
									border: '1px solid #000',
									padding: '2px',
								}}
							/>
						</div>
						<div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
							<strong
								style={{
									whiteSpace: 'nowrap',
								}}
							>
								Net:
							</strong>
							<input
								type="text"
								value={net}
								disabled
								style={{
									width: '100%',
									marginLeft: '5px',
									border: '1px solid #000',
									padding: '2px',
								}}
							/>
						</div>
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
						<strong>Comments</strong>{' '}
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

export default Waybill;
