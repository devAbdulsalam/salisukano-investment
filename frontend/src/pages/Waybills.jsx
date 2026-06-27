import { useEffect, useState, useMemo, useContext, useCallback } from 'react';
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

/** Load an image src into a base64 data URL via an offscreen canvas. */
const loadImageAsBase64 = (src) =>
	new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = src;
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			canvas.getContext('2d').drawImage(img, 0, 0);
			resolve(canvas.toDataURL('image/png'));
		};
		img.onerror = () => resolve('');
	});
const API_URL = import.meta.env.VITE_API_URL;

/** Returns YYYY-MM-DD strings for the first/last day of a given year+month. */
const getMonthBounds = (y, m) => ({
	start: `${y}-${String(m).padStart(2, '0')}-01`,
	end: `${y}-${String(m).padStart(2, '0')}-31`,
});

const InvoicesPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { user } = useContext(AuthContext);
	const [pdfLoading, setPdfLoading] = useState(false);
	const [isCommissionModal, setIsCommissionModal] = useState(false);
	const [commission, setCommission] = useState(1);
	const [images, setImages] = useState({ logo: '', seal: '', phone: '' });
	const [searchParams] = useSearchParams();

	const year = searchParams.get('year') ? parseInt(searchParams.get('year'), 10) : null;
	const month = searchParams.get('month') ? parseInt(searchParams.get('month'), 10) : null;
	const monthLabel = months.find((m) => m.value === month)?.label || '';

	// Derive initial date bounds from URL params or current month
	const getInitialDates = useCallback(() => {
		if (year && month && month >= 1 && month <= 12) {
			return getMonthBounds(year, month);
		}
		const now = new Date();
		return getMonthBounds(now.getFullYear(), now.getMonth() + 1);
	}, [year, month]);

	const { start: defaultStart, end: defaultEnd } = getInitialDates();
	const [startDate, setStartDate] = useState(defaultStart);
	const [endDate, setEndDate] = useState(defaultEnd);

	// Sync dates when URL params change
	useEffect(() => {
		const { start, end } = getInitialDates();
		setStartDate(start);
		setEndDate(end);
	}, [getInitialDates]);

	// Load all PDF images in parallel once on mount
	useEffect(() => {
		Promise.all([
			loadImageAsBase64(logo),
			loadImageAsBase64(seal),
			loadImageAsBase64(phone),
		]).then(([logoB64, sealB64, phoneB64]) => {
			setImages({ logo: logoB64, seal: sealB64, phone: phoneB64 });
		});
	}, []);

	// Search and sort state
	const [searchTerm, setSearchTerm] = useState('');
	const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

	// Fetch invoices
	const {
		data: waybills = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ['waybill-registers'],
		queryFn: async () => fetchRegisteredWaybills(user),
	});

	const authConfig = useMemo(
		() => ({ headers: { Authorization: `Bearer ${user.token}` } }),
		[user.token],
	);

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: (id) => axios.delete(`${API_URL}/waybill-registers/${id}`, authConfig),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['waybill-registers'] });
			toast.success('Waybill deleted successfully');
		},
		onError: (err) => toast.error(getError(err)),
	});

	const handleDelete = (id) => {
		if (window.confirm('Are you sure you want to delete this waybill?')) {
			deleteMutation.mutate(id);
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return '';
		return format(new Date(dateString), 'dd/MM/yyyy');
	};

	// Filter and sort data
	const filteredAndSortedWaybills = useMemo(() => {
		let filtered = [...waybills];

		// Search filter
		if (searchTerm) {
			const lowerSearch = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(inv) =>
					inv.name?.toLowerCase().includes(lowerSearch) ||
					inv.vehicle?.toLowerCase().includes(lowerSearch) ||
					inv.destination?.toLowerCase().includes(lowerSearch),
			);
		}

		// Date range filter
		if (startDate || endDate) {
			const startOfDay = startDate
				? Object.assign(new Date(startDate), { setHours: undefined }) && (() => {
						const d = new Date(startDate);
						d.setHours(0, 0, 0, 0);
						return d;
					})()
				: null;

			const endOfDay = endDate
				? (() => {
						const d = new Date(endDate);
						d.setHours(23, 59, 59, 999);
						return d;
					})()
				: startDate
				? (() => {
						const d = new Date(startDate);
						d.setHours(23, 59, 59, 999);
						return d;
					})()
				: null;

			filtered = filtered.filter((inv) => {
				if (!inv?.date) return false;
				const invDate = new Date(inv.date);
				if (isNaN(invDate.getTime())) return false;
				if (startOfDay && endOfDay) return invDate >= startOfDay && invDate <= endOfDay;
				if (startOfDay) return invDate >= startOfDay;
				if (endOfDay) return invDate <= endOfDay;
				return true;
			});
		}

		// Sort
		if (sortConfig.key) {
			const isDate = sortConfig.key === 'date' || sortConfig.key === 'createdAt';
			filtered.sort((a, b) => {
				let aVal = isDate ? new Date(a[sortConfig.key]).getTime() : (a[sortConfig.key] ?? 0);
				let bVal = isDate ? new Date(b[sortConfig.key]).getTime() : (b[sortConfig.key] ?? 0);
				if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
				if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
				return 0;
			});
		}

		return filtered;
	}, [waybills, searchTerm, startDate, endDate, sortConfig]);

	// Show commission card when there's an active name search with results
	const isCommissioned = searchTerm.trim().length > 0 && filteredAndSortedWaybills.length > 0;

	// Aggregate stats from filtered data
	const stats = useMemo(
		() =>
			filteredAndSortedWaybills.reduce(
				(acc, inv) => ({
					gross: acc.gross + (inv.gross || 0),
					tare: acc.tare + (inv.tare || 0),
					net: acc.net + (inv.net || 0),
					dust: acc.dust + (inv.dust || 0),
				}),
				{ gross: 0, tare: 0, net: 0, dust: 0 },
			),
		[filteredAndSortedWaybills],
	);
	const { gross, tare, net, dust } = stats;

	const requestSort = (key) => {
		setSortConfig((prev) => ({
			key,
			direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
		}));
	};

	const handleReset = () => {
		const { start, end } = getInitialDates();
		setStartDate(start);
		setEndDate(end);
		setSearchTerm('');
	};
	const handleDownloadWaybills = async () => {
		if (!filteredAndSortedWaybills.length) return;
		setPdfLoading(true);

		try {
			const doc = new jsPDF('p', 'mm', 'a4');
			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();

			// Shared header/watermark drawn on every page
			const addBackgroundAndHeader = (currentDoc, title = 'INCENTIVES') => {
				if (images.logo) {
					const wm = 120;
					if (currentDoc.setGState) {
						currentDoc.setGState(new currentDoc.GState({ opacity: 0.04 }));
					}
					currentDoc.addImage(images.logo, 'PNG', (pageWidth - wm) / 2, (pageHeight - wm) / 2, wm, wm);
					if (currentDoc.setGState) {
						currentDoc.setGState(new currentDoc.GState({ opacity: 1 }));
					}
					currentDoc.addImage(images.logo, 'PNG', 14, 10, 25, 25);
				}

				currentDoc.setFont('helvetica', 'bold');
				currentDoc.setFontSize(16);
				currentDoc.text('SALISU KANO INTERNATIONAL LIMITED', pageWidth / 2, 18, { align: 'center' });
				currentDoc.setFontSize(10);
				currentDoc.setFont('helvetica', 'normal');
				currentDoc.text("Scrap Materials' Suppliers and General Contractors", pageWidth / 2, 24, { align: 'center' });
				currentDoc.text('No. 2 & 3 Block P, Dalar Gyade Market, Kano State', pageWidth / 2, 29, { align: 'center' });

				const phoneX = pageWidth - 14;
				currentDoc.text('08023239018', phoneX, 22, { align: 'right' });
				currentDoc.text('08067237273', phoneX, 26, { align: 'right' });
				if (images.phone) {
					currentDoc.addImage(images.phone, 'PNG', phoneX - 30, 18, 10, 10);
				}

				currentDoc.setFont('helvetica', 'bold');
				currentDoc.setFontSize(14);
				currentDoc.setFillColor(0);
				currentDoc.rect(pageWidth / 2 - 30, 35, 60, 10, 'F');
				currentDoc.setTextColor(255);
				currentDoc.setLineWidth(0.4);
				currentDoc.line(14, 40, pageWidth - 14, 40);
				currentDoc.text(title, pageWidth / 2, 42, { align: 'center' });
				currentDoc.setTextColor(0);
				currentDoc.setFontSize(11);
			};

			// Initialize first page
			addBackgroundAndHeader(doc);

			const _gross = Number(gross) || 0;
			const _tare = Number(tare) || 0;
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

			if (images.seal) {
				doc.addImage(images.seal, 'PNG', pageWidth - 86, footerY - 32, 80, 50);
			}

			doc.save(`Waybills-${searchTerm || startDate || endDate}.pdf`);
		} catch (error) {
			console.error(error);
			toast.error('Failed to generate PDF');
		} finally {
			setPdfLoading(false);
		}
	};

	// Handle single waybill PDF download
	const handleDownloadPDF = (formData) => {
		setPdfLoading(true);
		try {
			const doc = new jsPDF('p', 'mm', 'a4');
			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();

			// Watermark
			if (images.logo) {
				const wm = 120;
				if (doc.setGState) doc.setGState(new doc.GState({ opacity: 0.04 }));
				doc.addImage(images.logo, 'PNG', (pageWidth - wm) / 2, (pageHeight - wm) / 2, wm, wm);
				if (doc.setGState) doc.setGState(new doc.GState({ opacity: 1 }));
				doc.addImage(images.logo, 'PNG', 14, 10, 25, 25);
			}

			// Header
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(16);
			doc.text('SALISU KANO INTERNATIONAL LIMITED', pageWidth / 2, 18, { align: 'center' });
			doc.setFontSize(10);
			doc.setFont('helvetica', 'normal');
			doc.text("Scrap Materials' Suppliers and General Contractors", pageWidth / 2, 24, { align: 'center' });
			doc.text('No. 2 & 3 Block P, Dalar Gyade Market, Kano State', pageWidth / 2, 29, { align: 'center' });
			const phoneX = pageWidth - 14;
			doc.text('08023239018', phoneX, 22, { align: 'right' });
			doc.text('08067237273', phoneX, 26, { align: 'right' });
			if (images.phone) doc.addImage(images.phone, 'PNG', phoneX - 30, 18, 10, 10);
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(14);
			doc.setFillColor(0);
			doc.rect(pageWidth / 2 - 30, 35, 60, 10, 'F');
			doc.setTextColor(255);
			doc.setLineWidth(0.4);
			doc.line(14, 40, pageWidth - 14, 40);
			doc.text('WAYBILL / RECEIPT', pageWidth / 2, 42, { align: 'center' });
			doc.setTextColor(0);

			// Body
			const wTare = Number(formData.tare) || 0;
			const wGross = Number(formData.gross) || 0;
			const wDust = Number(formData.dust) || 0;
			const wNet = wGross - wTare - wDust;
			const gap = 10;
			let y = 55;

			doc.setFontSize(11);
			doc.setFont('helvetica', 'bold');
			doc.text('Customer Name:', 20, y);
			doc.setFont('helvetica', 'normal');
			doc.text(formData.name || '-', 55, y);
			doc.setFont('helvetica', 'bold');
			doc.text('Date:', pageWidth - 90, y);
			doc.setFont('helvetica', 'normal');
			doc.text(formData.date ? new Date(formData.date).toISOString().split('T')[0] : '-', pageWidth - 75, y);
			y += gap;

			doc.setFont('helvetica', 'bold');
			doc.text('Vehicle No:', 20, y);
			doc.setFont('helvetica', 'normal');
			doc.text(formData.vehicle || '-', 55, y);
			y += gap;

			doc.setFont('helvetica', 'bold');
			doc.text('Gross Weight:', 20, y);
			doc.setFont('helvetica', 'normal');
			doc.text(`${wGross.toLocaleString()} kg`, 55, y);
			doc.setFont('helvetica', 'bold');
			doc.text('Tare Weight:', pageWidth - 90, y);
			doc.setFont('helvetica', 'normal');
			doc.text(`${wTare.toLocaleString()} kg`, pageWidth - 65, y);
			y += gap;

			doc.setFont('helvetica', 'bold');
			doc.text('Dust:', 20, y);
			doc.setFont('helvetica', 'normal');
			doc.text(`${wDust.toLocaleString()} kg`, 55, y);
			doc.setFont('helvetica', 'bold');
			doc.text('Net Weight:', pageWidth - 90, y);
			doc.text(`${wNet.toLocaleString()} kg`, pageWidth - 65, y);
			y += gap;

			// Note
			doc.setFont('helvetica', 'bold');
			doc.text('Note:', 20, y);
			doc.setLineWidth(0.3);
			doc.rect(20, y + 3, pageWidth - 40, 20);
			if (formData.note) {
				doc.setFont('helvetica', 'normal');
				doc.setFontSize(9);
				doc.text(doc.splitTextToSize(formData.note, pageWidth - 44), 22, y + 10);
			}

			// Signatures
			const footerY = y + 45;
			doc.setLineWidth(0.4);
			doc.line(20, footerY, 80, footerY);
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(10);
			doc.text("Customer's Signature", 20, footerY + 5);
			doc.line(pageWidth - 80, footerY, pageWidth - 20, footerY);
			doc.text('Authorized Signature', pageWidth - 80, footerY + 5);
			doc.text("For: Salisu Kano Int'l Ltd", pageWidth - 80, footerY + 10);
			if (images.seal) {
				doc.addImage(images.seal, 'PNG', pageWidth - 86, footerY - 32, 80, 50);
			}

			doc.save(`Waybill-${formData.name || 'Customer'}.pdf`);
		} catch (error) {
			console.error(error);
			toast.error('Failed to generate PDF');
		} finally {
			setPdfLoading(false);
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

			<div className="w-full grid sm:grid-cols-2 md:grid-cols-4 gap-4 col-span-12 mb-2">
				{[
					{ label: 'Gross (KG)', value: gross },
					{ label: 'Tare (KG)', value: tare },
					{ label: 'Dust (KG)', value: dust },
					{ label: 'Net (KG)', value: net },
				].map(({ label, value }) => (
					<div
						key={label}
						className="p-5 bg-white flex flex-col md:max-w-md w-full rounded-xl gap-2 border border-[#E7E7E7] hover:shadow-xl"
					>
						<span className="text-[#637381] text-sm font-medium">{label}</span>
						<span className="text-xl font-bold whitespace-nowrap">
							{(value || 0).toLocaleString()}
						</span>
					</div>
				))}
				{isCommissioned && (
					<div className="p-5 bg-white flex flex-col md:max-w-md w-full rounded-xl gap-2 border border-[#E7E7E7] hover:shadow-xl">
						<div className="flex justify-between">
							<span className="text-[#637381] text-sm font-medium">
								Commission (×{commission})
							</span>
							<button onClick={() => setIsCommissionModal(true)}>
								<Plus size={24} />
							</button>
						</div>
						<div
							className={`flex gap-4 justify-between flex-nowrap items-center`}
						>
							<span className="text-xl font-bold whitespace-nowrap">
								₦ {(net * commission).toLocaleString()}
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
						className="h-[42px] px-2 mt-6 my-1 bg-blue-600 text-white w-fit rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
						onClick={handleDownloadWaybills}
						disabled={pdfLoading}
						title="Download filtered waybills as PDF"
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
