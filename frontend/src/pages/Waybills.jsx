import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
	Eye,
	Pencil,
	Trash2,
	Search,
	ArrowUpDown,
	Download,
} from 'lucide-react';
import Loader from '../components/Loader';
import getError from '../hooks/getError';
import AuthContext from '../context/authContext';
import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import phone from '../assets/call.png';
import jsPDF from 'jspdf';
import { fetchRegisteredWaybills } from '../hooks/axiosApis';

const API_URL = import.meta.env.VITE_API_URL;

const InvoicesPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { user } = useContext(AuthContext);
	const [loading, setLoading] = useState(false);
	const [logoBase64, setLogoBase64] = useState('');
	const [sealBase64, setSealBase64] = useState('');
	const [phoneBase64, setPhoneBase64] = useState('');

	// State for search and sort
	const [searchTerm, setSearchTerm] = useState('');
	const [sortConfig, setSortConfig] = useState({
		key: 'createdAt', // default sort by date
		direction: 'desc',
	});

	// Fetch invoices
	const {
		data: waybills = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ['waybill-registers'],
		queryFn: async () => fetchRegisteredWaybills(user),
	});

	const config = {
		headers: { Authorization: `Bearer ${user.token}` },
	};
	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			await axios.delete(`${API_URL}/waybill-registers/${id}`, config);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['waybill-registers'] });
			toast.success('Invoice deleted successfully');
		},
		onError: (err) => {
			toast.error(getError(err));
		},
	});

	// Handle delete with confirmation
	const handleDelete = (id) => {
		if (window.confirm('Are you sure you want to delete this invoice?')) {
			deleteMutation.mutate(id);
		}
	};

	// Filter and sort data
	const filteredAndSortedWaybills = useMemo(() => {
		let filtered = [...waybills];

		// Apply search filter
		if (searchTerm) {
			const lowerSearch = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(inv) =>
					inv.name?.toLowerCase().includes(lowerSearch) ||
					inv.vehicle?.toLowerCase().includes(lowerSearch) ||
					inv.destination?.toLowerCase().includes(lowerSearch),
			);
		}

		// Apply sorting
		if (sortConfig.key) {
			filtered.sort((a, b) => {
				let aVal = a[sortConfig.key];
				let bVal = b[sortConfig.key];

				// Handle dates
				if (sortConfig.key === 'date' || sortConfig.key === 'createdAt') {
					aVal = new Date(aVal).getTime();
					bVal = new Date(bVal).getTime();
				}

				// Handle numbers (net)
				if (sortConfig.key === 'net') {
					aVal = aVal || 0;
					bVal = bVal || 0;
				}

				if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
				if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
				return 0;
			});
		}

		return filtered;
	}, [waybills, searchTerm, sortConfig]);

	// Toggle sort direction
	const requestSort = (key) => {
		setSortConfig((prev) => ({
			key,
			direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
		}));
	};

	// Format date for display
	const formatDate = (dateString) => {
		if (!dateString) return '';
		return format(new Date(dateString), 'dd/MM/yyyy');
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

	// Handle PDF download
	const handleDownloadPDF = async (formData) => {
		setLoading(true);

		try {
			const doc = new jsPDF('p', 'mm', 'a4');
			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();

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
	if (isLoading) return <Loader />;
	if (error)
		return (
			<div className="text-center text-red-500">
				Error loading invoices: {error.message}
			</div>
		);

	return (
		<div className="p-6 bg-gray-50 min-h-screen">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-xl md:text-3xl font-bold text-gray-800">
					<span onClick={() => navigate(`/registered-invoices`)}>Invoice</span>{' '}
					/{' '}
					<span className="text-blue-600" onClick={() => navigate(`/waybills`)}>
						Register
					</span>
				</h1>
				{/* <div className="flex gap-2 flex-col md:flex-row">
					<button
						onClick={() => navigate('/register-invoices')}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Invoice
					</button> */}
				<button
					onClick={() => navigate('/waybill')}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				>
					Register
				</button>
				{/* </div> */}
			</div>

			{/* Search Bar */}
			<div className="mb-4 flex items-center bg-white rounded-md shadow-sm border border-gray-200 p-2">
				<Search className="text-gray-400 ml-2" size={20} />
				<input
					type="text"
					placeholder="Search by customer, vehicle or destination..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="w-full p-2 outline-none"
				/>
			</div>

			{/* Invoices Table */}
			<div className="bg-white rounded-md shadow overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								S/N
							</th>
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
								onClick={() => requestSort('name')}
							>
								<div className="flex items-center gap-1">
									Customer
									<ArrowUpDown size={14} />
								</div>
							</th>
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
								onClick={() => requestSort('date')}
							>
								<div className="flex items-center gap-1">
									Date
									<ArrowUpDown size={14} />
								</div>
							</th>
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
								onClick={() => requestSort('vehicle')}
							>
								<div className="flex items-center gap-1">
									Vehicle
									<ArrowUpDown size={14} />
								</div>
							</th>
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
								onClick={() => requestSort('gross')}
							>
								<div className="flex items-center gap-1">
									Gross (KG)
									<ArrowUpDown size={14} />
								</div>
							</th>
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
								onClick={() => requestSort('tare')}
							>
								<div className="flex items-center gap-1">
									Tare (KG)
									<ArrowUpDown size={14} />
								</div>
							</th>
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
								onClick={() => requestSort('dust')}
							>
								<div className="flex items-center gap-1">
									Dust (KG)
									<ArrowUpDown size={14} />
								</div>
							</th>
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
								onClick={() => requestSort('net')}
							>
								<div className="flex items-center gap-1">
									Net (KG)
									<ArrowUpDown size={14} />
								</div>
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{filteredAndSortedWaybills.length === 0 ? (
							<tr>
								<td colSpan="7" className="px-6 py-4 text-center text-gray-500">
									No invoices found.
								</td>
							</tr>
						) : (
							filteredAndSortedWaybills.map((invoice, index) => (
								<tr key={invoice._id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{index + 1}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{invoice.name}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{formatDate(invoice.date)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{invoice.vehicle}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{invoice.gross?.toLocaleString()}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{invoice.tare?.toLocaleString()}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{invoice.dust?.toLocaleString()}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
										{invoice.net?.toLocaleString()}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										<div className="flex items-center gap-3">
											<button
												onClick={() => handleDownloadPDF(invoice)}
												className="text-blue-600 hover:text-blue-800"
												title="View/Edit"
											>
												<Download size={18} />
											</button>
											<button
												onClick={() => navigate(`/waybill/${invoice._id}`)}
												className="text-blue-600 hover:text-blue-800"
												title="View/Edit"
											>
												<Pencil size={18} />
											</button>
											<button
												onClick={() => handleDelete(invoice._id)}
												className="text-red-600 hover:text-red-800"
												title="Delete"
											>
												<Trash2 size={18} />
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default InvoicesPage;
