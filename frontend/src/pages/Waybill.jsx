import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import phone from '../assets/call.png';
import jsPDF from 'jspdf';
import { Phone, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import getError from '../hooks/getError';
import Loader from '../components/Loader';
import { fetchRegisteredWaybill, fetchCustomers } from '../hooks/axiosApis';
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
		queryFn: () => fetchRegisteredWaybill(id, user),
		enabled: isEdit,
	});
	const [loading, setLoading] = useState(false);
	const [logoBase64, setLogoBase64] = useState('');
	const [sealBase64, setSealBase64] = useState('');
	const [phoneBase64, setPhoneBase64] = useState('');
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

	// Generate PDF from the waybill preview, half pdf
	const downloadPDF = async () => {
		setLoading(true);

		try {
			const doc = new jsPDF('p', 'mm', 'a4');
			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();
			// ===============================
			// WATERMARK (CENTER BACKGROUND)
			// ===============================

			if (logoBase64) {
				// const watermarkWidth = 90; // mini size
				// const watermarkHeight = 90;
				const watermarkWidth = 120; // large size
				const watermarkHeight = 120;

				const centerX = (pageWidth - watermarkWidth) / 2;
				const centerY = (pageHeight - watermarkHeight) / 2;

				// Set low opacity (requires jsPDF v2+)
				if (doc.setGState) {
					doc.setGState(new doc.GState({ opacity: 0.04 }));
				}

				doc.addImage(
					logoBase64,
					'PNG',
					centerX,
					centerY,
					watermarkWidth,
					watermarkHeight,
				);

				// Reset opacity
				if (doc.setGState) {
					doc.setGState(new doc.GState({ opacity: 1 }));
				}
			}
			// ===============================
			// CALCULATIONS
			// ===============================
			const tare = Number(formData.tare) || 0;
			const gross = Number(formData.gross) || 0;
			const dust = Number(formData.dust) || 0;

			const net = gross - tare - dust;
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
			// Divider line
			// doc.setLineWidth(0.6);
			// doc.line(14, 32, pageWidth - 14, 32);

			// ===============================
			// MAIN CONTENT BOX
			// ===============================

			let startY = 55;

			// doc.setLineWidth(0.4);
			// doc.rect(14, startY - 8, pageWidth - 28, 70);

			doc.setFontSize(11);

			// Row spacing
			const gap = 10;

			// Row 1
			doc.setFont('helvetica', 'bold');
			doc.text('Customer Name:', 20, startY);
			doc.setFont('helvetica', 'normal');
			doc.text(formData.name || '-', 55, startY);

			doc.setFont('helvetica', 'bold');
			doc.text('Date:', pageWidth - 90, startY);
			doc.setFont('helvetica', 'normal');
			doc.text(
				new Date(formData.date).toISOString().split('T')[0] || '-',
				pageWidth - 75,
				startY,
			);

			startY += gap;

			// Row 2
			doc.setFont('helvetica', 'bold');
			doc.text('Vehicle No:', 20, startY);
			doc.setFont('helvetica', 'normal');
			doc.text(formData.vehicle || '-', 55, startY);

			startY += gap;

			// Row 3
			doc.setFont('helvetica', 'bold');
			doc.text('Gross Weight:', 20, startY);
			doc.setFont('helvetica', 'normal');
			doc.text(`${gross.toLocaleString()} kg`, 55, startY);

			doc.setFont('helvetica', 'bold');
			doc.text('Tare Weight:', pageWidth - 90, startY);
			doc.setFont('helvetica', 'normal');
			doc.text(`${tare.toLocaleString()} kg`, pageWidth - 65, startY);

			startY += gap;

			// Row 4
			doc.setFont('helvetica', 'bold');
			doc.text('Dust:', 20, startY);
			doc.setFont('helvetica', 'normal');
			doc.text(`${dust.toLocaleString()} kg`, 55, startY);

			doc.setFont('helvetica', 'bold');
			doc.text('Net Weight:', pageWidth - 90, startY);
			doc.setFont('helvetica', 'bold');
			doc.text(`${net.toLocaleString()} kg`, pageWidth - 65, startY);

			startY += gap;

			// ===============================
			// NOTE SECTION
			// ===============================

			doc.setFont('helvetica', 'bold');
			doc.text('Note:', 20, startY);

			doc.setLineWidth(0.3);
			doc.rect(20, startY + 3, pageWidth - 40, 20);

			if (formData.note) {
				doc.setFont('helvetica', 'normal');
				doc.setFontSize(9);
				const noteLines = doc.splitTextToSize(formData.note, pageWidth - 44);
				doc.text(noteLines, 22, startY + 10);
			}

			// ===============================
			// SIGNATURE SECTION
			// ===============================

			const footerY = startY + 35;

			doc.setLineWidth(0.4);

			doc.line(20, footerY, 80, footerY);
			doc.text("Customer's Signature", 20, footerY + 5);

			doc.line(pageWidth - 80, footerY, pageWidth - 20, footerY);
			doc.text('Authorized Signature', pageWidth - 80, footerY + 5);
			doc.text("For: Salisu Kano Int'l Ltd", pageWidth - 80, footerY + 10);

			if (sealBase64) {
				doc.addImage(sealBase64, 'PNG', pageWidth - 75, footerY - 20, 30, 30);
			}

			// ===============================
			// SAVE
			// ===============================

			doc.save(`Waybill-${formData.name || 'Customer'}.pdf`);
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
				<div className='flex flex-col md:flex-row gap-2 justify-center mt-5 md:mt-8'>
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
						{loading ? 'Downloading...' : 'Download Waybill as PDF'}
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
