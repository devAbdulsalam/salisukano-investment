import { useContext, useState, useMemo, useEffect } from 'react';
import Loader from '../components/Loader.jsx';
import AddShareholderModal from '../components/modals/AddShareholderModal.jsx';
import EditShareholderModal from '../components/modals/EditShareholderModal.jsx';
import AuthContext from '../context/authContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { fetchShareholders } from '../hooks/axiosApis.js';
import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import phone from '../assets/call.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import {
	Pencil,
	Trash2,
	Search,
	ArrowUpDown,
	Download,
	Plus,
} from 'lucide-react';
import formatDate from '../hooks/formatDate.js';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal.jsx';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const Shareholders = () => {
	const queryClient = useQueryClient();
	const { user } = useContext(AuthContext);

	const currentYear = new Date().getFullYear();
	const navigate = useNavigate();

	const [year, setYear] = useState(currentYear);

	// UI states
	const [isAddModal, setIsAddModal] = useState(false);
	const [isEditModal, setIsEditModal] = useState(false);
	const [selectedShareholder, setSelectedShareholder] = useState(null);
	const [selectedShareholders, setSelectedShareholders] = useState([]);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
	const [loading, setLoading] = useState(false);
	const [logoBase64, setLogoBase64] = useState('');
	const [sealBase64, setSealBase64] = useState('');
	const [phoneBase64, setPhoneBase64] = useState('');
	// Filter & sort states
	const [searchTerm, setSearchTerm] = useState('');
	const [startDate, setStartDate] = useState('');
	const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });

	// Fetch Shareholders
	const { data, isLoading, error } = useQuery({
		queryKey: ['shareholders'],
		queryFn: () => fetchShareholders(user),
		enabled: !!user,
	});

	const years = useMemo(() => {
		if (!data?.length) return [];
		return [...new Set(data.map((d) => new Date(d.date).getFullYear()))].sort(
			(a, b) => b - a,
		);
	}, [data]);

	// console.log(years);
	// console.log(data);

	// console.log('Fetched user:', user); // Debug log

	const apiUrl = import.meta.env.VITE_API_URL;
	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			setDeleteLoading(true);
			const { data } = await axios.delete(`${apiUrl}/shareholders/${id}`, {
				headers: { Authorization: `Bearer ${user?.token}` },
			}); // adjust endpoint
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['Shareholders']);
			setDeleteModal(false);
			setSelectedShareholder(null);
			toast.success('Shareholder deleted successfully');
		},
		onError: (err) => {
			toast.error(getError(err));
		},
		onSettled: () => {
			setDeleteLoading(false);
		},
	});

	// Compute totals
	const total = useMemo(() => {
		if (!data?.length) {
			return 0;
		}
		return data?.reduce((acc, exp) => acc + exp.currentInvestment, 0) || 0;
	}, [data]);

	// Filtering
	const filteredShareholders = useMemo(() => {
		if (!data?.length) return [];

		// 1. Filter

		const filtered = data.filter((shareholder) => {
			const searchTermLower = searchTerm.toLowerCase();

			const matchesSearch =
				shareholder.description?.toLowerCase().includes(searchTermLower) ||
				shareholder.serialNumber?.toLowerCase().includes(searchTermLower) ||
				shareholder.currentInvestment?.toString().includes(searchTerm) ||
				moment(shareholder.createdAt).format('DD-MM-YYYY').includes(searchTerm);

			const matchesDate =
				!startDate || new Date(shareholder.createdAt) >= new Date(startDate);

			const yearMatches =
				!year || new Date(shareholder.date).getFullYear() === year;

			return matchesSearch && matchesDate && yearMatches;
		});

		// 2. Add running total
		let runningTotal = 0;
		return filtered.map((item) => {
			runningTotal += item.currentInvestment;
			return {
				...item,
				total: runningTotal,
			};
		});
	}, [data, year, searchTerm, startDate]);

	// Sorting
	const requestSort = (key) => {
		let direction = 'asc';
		if (sortConfig.key === key && sortConfig.direction === 'asc') {
			direction = 'desc';
		} else if (sortConfig.key === key && sortConfig.direction === 'desc') {
			direction = ''; // clear sort
		}
		setSortConfig({ key, direction });
	};

	const sortedShareholders = useMemo(() => {
		if (!sortConfig.key || !sortConfig.direction) return filteredShareholders;
		return [...filteredShareholders].sort((a, b) => {
			const aVal = a[sortConfig.key];
			const bVal = b[sortConfig.key];
			if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
			return 0;
		});
	}, [filteredShareholders, sortConfig]);

	// Handlers
	const handleEdit = (Shareholder) => {
		setSelectedShareholder(Shareholder);
		setIsEditModal(true);
	};

	const toggleSelect = (id) => {
		setSelectedShareholders((prev) =>
			prev.includes(id)
				? prev.filter((selectedId) => selectedId !== id)
				: [...prev, id],
		);
	};

	const toggleSelectAll = () => {
		if (!filteredShareholders?.length) return;

		const allIds = filteredShareholders.map((Shareholder) => Shareholder._id);
		const allSelected = allIds.every((id) => selectedShareholders.includes(id));

		setSelectedShareholders(allSelected ? [] : allIds);
	};

	// Compute header checkbox state
	const isAllSelected =
		filteredShareholders?.length > 0 &&
		filteredShareholders.every((Shareholder) =>
			selectedShareholders.includes(Shareholder._id),
		);

	const isSomeSelected = selectedShareholders.length > 0 && !isAllSelected;
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
	const handleDownload = () => {
		const selectedShareholdersData = selectedShareholders.map((id) => {
			const Shareholder = data.find((exp) => exp._id === id);
			return Shareholder;
		});
		console.log('Download Shareholders', selectedShareholdersData);
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

				currentDoc.text('Shareholders', pageWidth / 2, 42, { align: 'center' });
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

			const totalShareholders = selectedShareholdersData.reduce(
				(total, Shareholder) => total + Shareholder?.currentInvestment,
				0,
			);

			// ===============================
			// TABLE SECTION
			// ===============================
			const tableStartY = 50;

			// Prepare filled rows
			const filledRows = selectedShareholdersData.map((item, index) => [
				index + 1,
				item.description,
				item?.currentInvestment?.toLocaleString() || '',
				item.date ? new Date(item.date).toISOString().split('T')[0] : '',
				'',
			]);
			// Ensure minimum 10 rows
			while (filledRows.length < 10) {
				filledRows.push(['', '', '', '']);
			}
			autoTable(doc, {
				startY: tableStartY,
				head: [
					['S/N', 'Description', 'Current Investment (NG)', 'Date', 'Remarks'],
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
					1: { cellWidth: 32, halign: 'left' },
					2: { cellWidth: 26, halign: 'left' },
					3: { cellWidth: 26, halign: 'left' },
					4: { cellWidth: 'auto' },
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
			doc.text('Total Shareholders:', 15, currentY);
			doc.setFont('helvetica', 'normal');
			doc.text(`NGN ${totalShareholders.toLocaleString()}`, 45, currentY);

			currentY += gap;

			// ===============================
			// NOTE SECTION
			// ===============================

			doc.setFont('helvetica', 'bold');
			doc.text('Note:', 15, currentY);

			doc.setLineWidth(0.3);
			doc.rect(15, currentY + 3, pageWidth - 30, 20);

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

			doc.save(`Shareholders-${new Date().toISOString()}.pdf`);
		} catch (error) {
			console.error(error);
			toast.error('Failed to generate PDF');
		} finally {
			setLoading(false);
		}
	};

	if (isLoading) return <Loader />;
	if (error) {
		return (
			<div className="p-6 text-center text-red-500">
				Failed to load Shareholders: {getError(error)}
			</div>
		);
	}

	return (
		<main>
			<div className="p-3 md:p-6 bg-gray-50 min-h-screen">
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-xl md:text-3xl font-bold text-gray-800">
						Shareholders
					</h1>
					<button
						onClick={() => setIsAddModal(true)}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						<span className="hidden md:inline">Add </span>
						<Plus className="inline md:hidden" />
						Shareholder
					</button>
				</div>

				{/* Summary Cards */}
				<div className="w-full grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
					<div
						// onClick={() => navigate('/dividend-rates')}
						className="p-5 bg-white flex flex-col rounded-xl gap-2 border border-gray-200 hover:shadow-md"
					>
						<h2 className="text-gray-500 text-sm font-medium mb-4">
							Shareholders ({data?.length || 0})
						</h2>
						<span className="text-xl font-bold">{year}</span>
					</div>
					<div className="p-5 bg-white flex flex-col rounded-xl gap-2 border border-gray-200 hover:shadow-md">
						<h2 className="text-gray-500 text-sm font-medium mb-4">
							Total Investment
						</h2>
						<span className="text-xl font-bold">₦{total.toLocaleString()}</span>
					</div>
					<div
						onClick={() => navigate('/dividend-rates')}
						className="p-5 bg-white flex flex-col rounded-xl gap-2 border border-gray-200 hover:shadow-md"
					>
						<div className="w-full flex gap-2 justify-between items-end mb-4 text-green-600">
							<h2 className="text-gray-500 text-sm font-medium">
								Dividend Rate
							</h2>
							<Pencil size={18} />
						</div>
						<span className="text-xl font-bold">1%</span>
					</div>
				</div>
				<div className="p-5 bg-white rounded-xl  border border-gray-200">
					{/* Search and Date Filter */}
					<div className="w-full md:flex gap-4 items-center mb-4">
						<div className="w-full">
							<label className="text-sm text-gray-700 mb-1 block">Search</label>
							<div className="flex items-center bg-white rounded-md shadow-sm border border-gray-200 p-0.5">
								<Search className="text-gray-400 ml-2" size={20} />
								<input
									type="text"
									placeholder="Search by description..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full px-4 py-2 text-sm outline-none rounded-md"
								/>
							</div>
						</div>
						<div className="w-full sm:w-auto hidden">
							<label className="text-sm text-gray-700 mb-1 block">Date</label>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="w-full px-4 py-2 rounded-md border border-gray-200  text-sm"
							/>
						</div>
						<div className="">
							<label className="text-sm text-gray-700 mb-1 block invisible">
								Year
							</label>
							<select
								className="border p-2 rounded text-sm"
								value={year}
								onChange={(e) => setYear(Number(e.target.value))}
							>
								<option value={year} disabled>
									{year}
								</option>
								{years.map((yr) => (
									<option key={yr} value={yr}>
										{yr} Financial Year
									</option>
								))}
							</select>
						</div>
						<div className="">
							<label className="text-sm text-gray-700 mb-1 block invisible">
								Date
							</label>
							<div className="flex justify-between items-center gap-2 text-sm">
								<button
									onClick={() => navigate(`/dividend-rates/${year}`)}
									className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors whitespace-nowrap"
								>
									Dividend Rate (%)
								</button>
								{/* <button
									onClick={() => navigate('/dividends')}
									className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
								>
									Payments
								</button> */}
							</div>
						</div>
					</div>

					{/* Table */}
					<div className="bg-white rounded-md shadow overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										S/N
									</th>
									<th
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
										onClick={() => requestSort('name')}
									>
										<div className="flex items-center gap-1">
											Name
											<ArrowUpDown size={14} />
										</div>
									</th>
									<th
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
										onClick={() => requestSort('phone')}
									>
										<div className="flex items-center gap-1">
											Phone
											<ArrowUpDown size={14} />
										</div>
									</th>
									<th
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
										onClick={() => requestSort('currentInvestment')}
									>
										<div className="flex items-center gap-1 whitespace-nowrap">
											Current Investment
											<ArrowUpDown size={14} />
										</div>
									</th>

									<th
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
										onClick={() => requestSort('total')}
									>
										<div className="flex items-center gap-1">
											Total
											<ArrowUpDown size={14} />
										</div>
									</th>
									<th
										className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
										onClick={() => requestSort('createdAt')}
									>
										<div className="flex items-center gap-1">
											Date
											<ArrowUpDown size={14} />
										</div>
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{sortedShareholders.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="px-6 py-4 text-center text-gray-500"
										>
											No Shareholders found.
										</td>
									</tr>
								) : (
									sortedShareholders.map((shareholder, index) => (
										<tr key={shareholder._id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{index + 1}
											</td>
											<td
												onClick={() =>
													navigate(`/shareholders/${shareholder._id}/${year}`)
												}
												className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
											>
												{shareholder.name?.toLocaleString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{shareholder.phone}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{shareholder.currentInvestment?.toLocaleString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{shareholder.total?.toLocaleString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatDate(shareholder.date)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												<div className="flex items-center gap-3">
													<button
														onClick={() => handleEdit(shareholder)}
														className="text-blue-600 hover:text-blue-800"
														title="Edit"
													>
														<Pencil size={18} />
													</button>
													<button
														onClick={() => {
															setSelectedShareholder(shareholder); // store the Shareholder to be deleted
															setDeleteModal(true);
														}}
														className="text-red-600 hover:text-red-800"
														title="Delete"
														disabled={deleteLoading}
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
			</div>

			{/* Modals */}
			<AddShareholderModal
				show={isAddModal}
				setShow={setIsAddModal}
				setLoading={() => {}} // no longer needed externally
				loading={false}
			/>
			<EditShareholderModal
				show={isEditModal}
				setShow={setIsEditModal}
				setLoading={() => {}}
				loading={false}
				shareholder={selectedShareholder}
				onClose={() => setSelectedShareholder(null)}
			/>
			<DeleteConfirmationModal
				show={deleteModal}
				setShow={setDeleteModal}
				onConfirm={() => deleteMutation.mutate(selectedShareholder._id)}
				isDeleting={deleteLoading}
				itemName={selectedShareholder?.description || 'Shareholder'}
			/>

			{/* Global loader for delete operation */}
			{deleteLoading && <Loader />}
		</main>
	);
};

export default Shareholders;
