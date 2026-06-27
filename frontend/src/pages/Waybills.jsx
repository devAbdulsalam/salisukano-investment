import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
	RefreshCw,
	Pencil,
	Trash2,
	Search,
	ArrowUpDown,
	Download,
	Info,
	Plus,
} from 'lucide-react';
import Loader from '../components/Loader';
import getError from '../hooks/getError';
import AuthContext from '../context/authContext';
import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import phone from '../assets/call.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchRegisteredWaybills } from '../hooks/axiosApis';
import AddCommissionModal from '../components/modals/AddIncentiveModal';
import { months } from '../data.js';
const API_URL = import.meta.env.VITE_API_URL;
// jonney english reborn

const InvoicesPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { user } = useContext(AuthContext);
	const [loading, setLoading] = useState(false);
	const [isCommissioned, setIsCommissioned] = useState(false);
	const [isCommissionModal, setIsCommissionModal] = useState(false);
	const [commission, setCommission] = useState(1);
	const [logoBase64, setLogoBase64] = useState('');
	const [sealBase64, setSealBase64] = useState('');
	const [phoneBase64, setPhoneBase64] = useState('');
	const [endDate, setEndDate] = useState('');
	const [startDate, setStartDate] = useState('');
	const [searchParams, setSearchParams] = useSearchParams();
	const yearFromUrl = searchParams.get('year');
	const monthFromUrl = searchParams.get('month');
	// Convert to numbers and validate
	const year = yearFromUrl ? parseInt(yearFromUrl, 10) : null;
	const month = monthFromUrl ? parseInt(monthFromUrl, 10) : null;

	const monthLabel = months.find((m) => m.value === month)?.label || '';
	useEffect(() => {
		if (year && month && month >= 1 && month <= 12) {
			// Format as YYYY-MM-DD (first day of month)
			setStartDate(`${year}-${String(month).padStart(2, '0')}-01`);
			setEndDate(`${year}-${String(month).padStart(2, '0')}-31`);
		} else {
			// Optionally set a default (e.g., current month)
			const now = new Date();
			setStartDate(
				`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
			);
			setEndDate(
				`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`,
			);
		}
	}, [year, month]);

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

	// Format date for display
	const formatDate = (dateString) => {
		if (!dateString) return '';
		return format(new Date(dateString), 'dd/MM/yyyy');
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

		// Apply date filter
		if (startDate || endDate) {
			let startOfDay = null;
			let endOfDay = null;

			if (startDate) {
				startOfDay = new Date(startDate);
				startOfDay.setHours(0, 0, 0, 0);
				endOfDay = new Date(startDate);
				endOfDay.setHours(23, 59, 59, 999);
			}

			if (endDate && !startDate) {
				// Only endDate provided: up to and including that day
				endOfDay = new Date(endDate);
				endOfDay.setHours(23, 59, 59, 999);
			} else if (endDate && startDate) {
				// Both provided: endDate becomes the end of its day
				const tempEnd = new Date(endDate);
				tempEnd.setHours(23, 59, 59, 999);
				endOfDay = tempEnd;
			}

			filtered = filtered.filter((inv) => {
				if (!inv?.date) return false;
				const invDate = new Date(inv.date);
				if (isNaN(invDate.getTime())) return false;

				if (startOfDay && endOfDay) {
					// Both start and end (either from date+date or date+endDate)
					return invDate >= startOfDay && invDate <= endOfDay;
				} else if (startOfDay && !endOfDay) {
					// Should not happen per logic, but safe fallback
					return invDate >= startOfDay && invDate <= startOfDay;
				} else if (!startOfDay && endOfDay) {
					// Only endDate (and no date)
					return invDate <= endOfDay;
				}
				return true;
			});
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
	}, [waybills, searchTerm, startDate, endDate, sortConfig]);

	useEffect(() => {
		if (
			searchTerm &&
			startDate &&
			endDate &&
			filteredAndSortedWaybills.length > 0
		) {
			// Do something
			setIsCommissioned(true);
		}
	}, [searchTerm, startDate, endDate, filteredAndSortedWaybills]);
	// calculate stats from filtered and sorted waybills
	const gross = filteredAndSortedWaybills.reduce(
		(acc, inv) => acc + inv.gross,
		0,
	);
	const tare = filteredAndSortedWaybills.reduce(
		(acc, inv) => acc + inv.tare,
		0,
	);
	const net = filteredAndSortedWaybills.reduce((acc, inv) => acc + inv.net, 0);
	const dust = filteredAndSortedWaybills.reduce(
		(acc, inv) => acc + inv.dust,
		0,
	);

	// Toggle sort direction
	const requestSort = (key) => {
		setSortConfig((prev) => ({
			key,
			direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
		}));
	};

	const handleReset = () => {
		setStartDate('');
		setEndDate('');
		setSearchTerm('');
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

	const handleDownloadWaybills = async () => {
		if (!filteredAndSortedWaybills.length) return;
		setLoading(true);

		try {
			const doc = new jsPDF('p', 'mm', 'a4');
			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();

			// ===============================
			// REUSABLE DRAWING FUNCS
			// ===============================
			const addBackgroundAndHeader = (currentDoc) => {
				// WATERMARK
				if (logoBase64) {
					const watermarkWidth = 120; // large size
					const watermarkHeight = 120;
					const centerX = (pageWidth - watermarkWidth) / 2;
					const centerY = (pageHeight - watermarkHeight) / 2;

					if (currentDoc.setGState) {
						currentDoc.setGState(new currentDoc.GState({ opacity: 0.04 }));
					}
					currentDoc.addImage(
						logoBase64,
						'PNG',
						centerX,
						centerY,
						watermarkWidth,
						watermarkHeight,
					);
					if (currentDoc.setGState) {
						currentDoc.setGState(new currentDoc.GState({ opacity: 1 }));
					}
				}

				// HEADER
				if (logoBase64) {
					currentDoc.addImage(logoBase64, 'PNG', 14, 10, 25, 25);
				}

				currentDoc.setFont('helvetica', 'bold');
				currentDoc.setFontSize(16);
				currentDoc.text(
					'SALISU KANO INTERNATIONAL LIMITED',
					pageWidth / 2,
					18,
					{
						align: 'center',
					},
				);

				currentDoc.setFontSize(10);
				currentDoc.setFont('helvetica', 'normal');
				currentDoc.text(
					"Scrap Materials' Suppliers and General Contractors",
					pageWidth / 2,
					24,
					{ align: 'center' },
				);

				currentDoc.text(
					'No. 2 & 3 Block P, Dalar Gyade Market, Kano State',
					pageWidth / 2,
					29,
					{ align: 'center' },
				);
				// Phone Numbers
				const phoneX = pageWidth - 14;

				currentDoc.text('08023239018', phoneX, 22, { align: 'right' });

				// Second number with icon
				currentDoc.text('08067237273', phoneX, 26, { align: 'right' });

				// Small phone icon before second number
				if (phoneBase64) {
					currentDoc.addImage(
						phoneBase64,
						'PNG',
						phoneX - 30, // move left from right margin
						18, // slightly above 23 for vertical center
						10, // width (small)
						10, // height
					);
				}

				// Title
				currentDoc.setFont('helvetica', 'bold');
				currentDoc.setFontSize(14);
				currentDoc.setFillColor(0);
				currentDoc.rect(pageWidth / 2 - 30, 35, 60, 10, 'F');
				currentDoc.setTextColor(255);

				currentDoc.setLineWidth(0.4);
				currentDoc.line(14, 40, pageWidth - 14, 40);

				currentDoc.text('INCENTIVES', pageWidth / 2, 42, { align: 'center' });
				currentDoc.setTextColor(0);
				// Divider line
				// currentDoc.setLineWidth(0.6);
				// currentDoc.line(14, 32, pageWidth - 14, 32);

				currentDoc.setFontSize(11);
			};

			// Initialize first page
			addBackgroundAndHeader(doc);

			// ===============================
			// CALCULATIONS
			// ===============================
			const _tare = Number(tare) || 0;
			const _gross = Number(gross) || 0;
			const _dust = Number(dust) || 0;

			const _net = _gross - _tare - _dust;
			const totalCommission = commission * _net;

			// ===============================
			// TABLE SECTION
			// ===============================
			const tableStartY = 50;

			// Prepare filled rows
			const filledRows = filteredAndSortedWaybills.map((item, index) => [
				index + 1,
				item.name,
				item.date ? new Date(item.date).toISOString().split('T')[0] : '',
				item.vehicle || '',
				item?.gross?.toLocaleString() || '',
				item?.tare?.toLocaleString() || '',
				item?.dust?.toLocaleString() || '',
				item?.net?.toLocaleString() || '',
			]);

			autoTable(doc, {
				startY: tableStartY,
				head: [
					[
						'S/N',
						'Name',
						'Date',
						'Vehicle',
						'Gross (KG)',
						'Tare (KG)',
						'Dust (KG)',
						'Net (KG)',
					],
				],
				body: filledRows,
				theme: 'grid',
				margin: { top: 50, bottom: 20 },
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
					2: { cellWidth: 24, halign: 'left' },
					3: { cellWidth: 26, halign: 'left' },
					4: { cellWidth: 24, halign: 'right' },
					5: { cellWidth: 24, halign: 'right' },
					6: { cellWidth: 24, halign: 'right' },
					7: { cellWidth: 24, halign: 'right' },
				},
				didDrawPage: function (data) {
					// Draw background and header on subsequent pages
					if (data.pageNumber > 1) {
						addBackgroundAndHeader(doc);
					}
				},
			});

			let currentY = doc.lastAutoTable.finalY + 10;
			const gap = 10;

			// If the remaining space is not enough for the summary and signatures
			// (we need about 80 units), add a new page
			if (currentY > pageHeight - 85) {
				doc.addPage();
				addBackgroundAndHeader(doc);
				currentY = 55;
			}

			// Row 1
			doc.setFont('helvetica', 'bold');
			doc.text('Gross Weight:', 20, currentY);
			doc.setFont('helvetica', 'normal');
			doc.text(`${_gross.toLocaleString()} kg`, 55, currentY);

			doc.setFont('helvetica', 'bold');
			doc.text('Tare Weight:', pageWidth - 90, currentY);
			doc.setFont('helvetica', 'normal');
			doc.text(`${_tare.toLocaleString()} kg`, pageWidth - 65, currentY);

			currentY += gap;

			// Row 2
			doc.setFont('helvetica', 'bold');
			doc.text('Dust:', 20, currentY);
			doc.setFont('helvetica', 'normal');
			doc.text(`${_dust.toLocaleString()} kg`, 55, currentY);

			doc.setFont('helvetica', 'bold');
			doc.text('Net Weight:', pageWidth - 90, currentY);
			doc.setFont('helvetica', 'bold');
			doc.text(`${_net.toLocaleString()} kg`, pageWidth - 65, currentY);

			currentY += gap;
			doc.setFont('helvetica', 'bold');
			doc.text('Commission:', pageWidth - 90, currentY);
			doc.setFont('helvetica', 'bold');
			doc.text(
				`NGN ${totalCommission.toLocaleString()}`,
				pageWidth - 65,
				currentY,
			);

			currentY += gap;

			// ===============================
			// NOTE SECTION
			// ===============================

			doc.setFont('helvetica', 'bold');
			doc.text('Note:', 20, currentY);

			doc.setLineWidth(0.3);
			doc.rect(20, currentY + 3, pageWidth - 40, 20);

			// ===============================
			// SIGNATURE SECTION
			// ===============================
			// 25
			const footerY = currentY + 45;

			doc.setLineWidth(0.4);

			doc.line(20, footerY, 80, footerY);
			doc.text("Customer's Signature", 20, footerY + 5);

			doc.line(pageWidth - 80, footerY, pageWidth - 20, footerY);
			doc.text('Authorized Signature', pageWidth - 80, footerY + 5);
			doc.text("For: Salisu Kano Int'l Ltd", pageWidth - 80, footerY + 10);

			if (sealBase64) {
				doc.addImage(sealBase64, 'PNG', pageWidth - 86, footerY - 32, 80, 50);
			}

			// ===============================
			// SAVE
			// ===============================

			doc.save(`Waybills-${date || searchTerm || endDate}.pdf`);
		} catch (error) {
			console.error(error);
			toast.error('Failed to generate PDF');
		} finally {
			setLoading(false);
		}
	};

	// Handle PDF download
	const handleDownloadPDF = async (formData) => {
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

			doc.text('08023239018', phoneX, 22, { align: 'right' });

			// Second number with icon
			doc.text('08067237273', phoneX, 26, { align: 'right' });

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
			// 25
			const footerY = startY + 45;

			doc.setLineWidth(0.4);

			doc.line(20, footerY, 80, footerY);
			doc.text("Customer's Signature", 20, footerY + 5);

			doc.line(pageWidth - 80, footerY, pageWidth - 20, footerY);
			doc.text('Authorized Signature', pageWidth - 80, footerY + 5);
			doc.text("For: Salisu Kano Int'l Ltd", pageWidth - 80, footerY + 10);

			if (sealBase64) {
				doc.addImage(sealBase64, 'PNG', pageWidth - 86, footerY - 32, 80, 50);
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
				<h1 className="text-lg md:text-xl font-bold text-gray-800">
					Register for {monthLabel} {year}
				</h1>
				<button
					onClick={() => navigate('/waybill')}
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
				>
					Register
				</button>
			</div>

			<div className="w-full grid sm:grid-cols-2 md:grid-cols-4 gap-4  col-span-12 mb-2">
				<div className="p-5  bg-white flex flex-col md:max-w-md w-full rounded-xl gap-2 border border-[#E7E7E7] hover:shadow-xl cursor-pointer">
					<div className={`flex justify-between `}>
						<span className="text-[#637381] text-sm font-medium">
							Gross (KG)
						</span>
					</div>
					<div
						className={`flex gap-4 justify-between flex-nowrap items-center`}
					>
						<span className="text-xl font-bold whitespace-nowrap">
							{gross || 0}
						</span>
					</div>
				</div>
				<div className="p-5 mb-4  bg-white flex flex-col md:max-w-md w-full rounded-xl gap-2 border border-[#E7E7E7] hover:shadow-xl cursor-pointer">
					<div className={`flex justify-between `}>
						<span className="text-[#637381] text-sm font-medium">
							Tare (KG)
						</span>
					</div>
					<div
						className={`flex gap-4 justify-between flex-nowrap items-center`}
					>
						<span className="text-xl font-bold whitespace-nowrap">
							{tare || 0}
						</span>
					</div>
				</div>
				<div className="p-5 mb-4  bg-white flex flex-col md:max-w-md w-full rounded-xl gap-2 border border-[#E7E7E7] hover:shadow-xl cursor-pointer">
					<div className={`flex justify-between `}>
						<span className="text-[#637381] text-sm font-medium">
							Dust (KG)
						</span>
					</div>
					<div
						className={`flex gap-4 justify-between flex-nowrap items-center`}
					>
						<span className="text-xl font-bold whitespace-nowrap">
							{dust || 0}
						</span>
					</div>
				</div>
				<div className="p-5 mb-4  bg-white flex flex-col md:max-w-md w-full rounded-xl gap-2 border border-[#E7E7E7] hover:shadow-xl cursor-pointer">
					<div className={`flex justify-between `}>
						<span className="text-[#637381] text-sm font-medium">Net (KG)</span>
					</div>
					<div
						className={`flex gap-4 justify-between flex-nowrap items-center`}
					>
						<span className="text-xl font-bold whitespace-nowrap">
							{net || 0}
						</span>
					</div>
				</div>
				{isCommissioned && (
					<div className="p-5 mb-4  bg-white flex flex-col md:max-w-md w-full rounded-xl gap-2 border border-[#E7E7E7] hover:shadow-xl cursor-pointer">
						<div className={`flex justify-between `}>
							<span className="text-[#637381] text-sm font-medium">
								Commission ({commission})
							</span>
							<button onClick={() => setIsCommissionModal(true)}>
								<Plus size={24} />
							</button>
						</div>
						<div
							className={`flex gap-4 justify-between flex-nowrap items-center`}
						>
							<span className="text-xl font-bold whitespace-nowrap">
								₦ {net * commission}
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Search Bar */}
			<div className="w-full grid sm:grid-cols-2 md:grid-cols-4 gap-4 col-span-12 items-center mb-4">
				<div className="w-full">
					<p className="text-black text-sm">Search</p>
					<div className=" flex items-center bg-white rounded-md shadow-sm border border-gray-200 p-0.5">
						<Search className="text-gray-400 ml-2" size={20} />
						<input
							type="text"
							placeholder="Search by customer or vehicle..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full p-2 outline-none"
						/>
					</div>
				</div>
				<div className="w-full">
					<p className="text-black text-sm">Start date</p>
					<input
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						className="input w-full h-[46px] rounded-md border border-gray6 px-2 text-base"
					/>
				</div>
				<div className="flex gap-2 items-center">
					<div className="w-full">
						<p className="text-black text-sm">End date</p>
						<input
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							className="input w-full h-[46px] rounded-md border border-gray6 px-2 text-base"
						/>
					</div>
					<button
						className="h-[42px] px-2 mt-6 my-1 bg-blue-600 text-white w-fit rounded-md hover:bg-blue-700 transition-colors"
						onClick={handleDownloadWaybills}
					>
						<Download size={18} />
					</button>
					<button
						className="h-[42px] px-2 mt-6 my-1 bg-red-200 text-white w-fit rounded-md hover:bg-red-400 transition-colors"
						onClick={handleReset}
					>
						<RefreshCw size={18} />
					</button>
				</div>
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
								<div className="flex items-center gap-1 whitespace-nowrap">
									Gross (KG)
									<ArrowUpDown size={14} />
								</div>
							</th>
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
								onClick={() => requestSort('tare')}
							>
								<div className="flex items-center gap-1 whitespace-nowrap ">
									Tare (KG)
									<ArrowUpDown size={14} />
								</div>
							</th>
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
								onClick={() => requestSort('dust')}
							>
								<div className="flex items-center gap-1 whitespace-nowrap ">
									Dust (KG)
									<ArrowUpDown size={14} />
								</div>
							</th>
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
								onClick={() => requestSort('net')}
							>
								<div className="flex items-center gap-1 whitespace-nowrap ">
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
									No waybill found.
								</td>
							</tr>
						) : (
							filteredAndSortedWaybills.map((invoice, index) => (
								<tr key={invoice._id} className="hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{index + 1}
									</td>
									<td
										onClick={() => navigate(`/waybill/${invoice._id}`)}
										className="cursor-pointer px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
									>
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
			<AddCommissionModal
				net={net}
				show={isCommissionModal}
				setShow={setIsCommissionModal}
				commission={commission}
				setCommission={setCommission}
			/>
		</div>
	);
};

export default InvoicesPage;
