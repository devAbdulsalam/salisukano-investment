import { useContext, useState, useMemo, useEffect } from 'react';
import Loader from '../components/Loader.jsx';
import AddExpenceModal from '../components/modals/AddExpenseModal.jsx';
import EditExpenceModal from '../components/modals/EditExpenceModal.jsx';
import AuthContext from '../context/authContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { fetchExpenses } from '../hooks/axiosApis.js';
import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import phone from '../assets/call.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Search, ArrowUpDown, Download } from 'lucide-react';
import formatDate from '../hooks/formatDate.js';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal.jsx';
import moment from 'moment';

const Expences = () => {
	const queryClient = useQueryClient();
	const { user } = useContext(AuthContext);

	// UI states
	const [isAddModal, setIsAddModal] = useState(false);
	const [isEditModal, setIsEditModal] = useState(false);
	const [selectedExpense, setSelectedExpense] = useState(null);
	const [selectedExpenses, setSelectedExpenses] = useState([]);
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

	// Fetch expenses
	const { data, isLoading, error } = useQuery({
		queryKey: ['expenses'],
		queryFn: () => fetchExpenses(user),
		enabled: !!user,
	});

	// console.log('Fetched user:', user); // Debug log

	const apiUrl = import.meta.env.VITE_API_URL;
	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			setDeleteLoading(true);
			const { data } = await axios.delete(`${apiUrl}/expenses/${id}`, {
				headers: { Authorization: `Bearer ${user?.token}` },
			}); // adjust endpoint
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['expenses']);
			setDeleteModal(false);
			setSelectedExpense(null);
			toast.success('Expense deleted successfully');
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
		return data?.reduce((acc, exp) => acc + exp.amount, 0) || 0;
	}, [data]);

	const thisMonthExpense = useMemo(() => {
		const now = new Date();
		return (
			data
				?.filter((exp) => {
					const d = new Date(exp.date);
					return (
						d.getMonth() === now.getMonth() &&
						d.getFullYear() === now.getFullYear()
					);
				})
				.reduce((acc, exp) => acc + exp.amount, 0) || 0
		);
	}, [data]);

	// Filtering
	const filteredExpenses = useMemo(() => {
		if (!data) return [];
		return data.filter((expense) => {
			const matchesSearch =
				expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				expense.serialNumber
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				expense?.amount?.toString().includes(searchTerm) ||
				moment(expense?.createdAt).format('DD-MM-YYYY').includes(searchTerm);
			const matchesDate =
				!startDate || new Date(expense.date) >= new Date(startDate);
			return matchesSearch && matchesDate;
		});
	}, [data, searchTerm, startDate]);

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

	const sortedExpenses = useMemo(() => {
		if (!sortConfig.key || !sortConfig.direction) return filteredExpenses;
		return [...filteredExpenses].sort((a, b) => {
			const aVal = a[sortConfig.key];
			const bVal = b[sortConfig.key];
			if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
			return 0;
		});
	}, [filteredExpenses, sortConfig]);

	// Handlers
	const handleEdit = (expense) => {
		setSelectedExpense(expense);
		setIsEditModal(true);
	};

	const toggleSelect = (id) => {
		setSelectedExpenses((prev) =>
			prev.includes(id)
				? prev.filter((selectedId) => selectedId !== id)
				: [...prev, id],
		);
	};

	const toggleSelectAll = () => {
		if (!filteredExpenses?.length) return;

		const allIds = filteredExpenses.map((expense) => expense._id);
		const allSelected = allIds.every((id) => selectedExpenses.includes(id));

		setSelectedExpenses(allSelected ? [] : allIds);
	};

	// Compute header checkbox state
	const isAllSelected =
		filteredExpenses?.length > 0 &&
		filteredExpenses.every((expense) => selectedExpenses.includes(expense._id));

	const isSomeSelected = selectedExpenses.length > 0 && !isAllSelected;
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
		const selectedExpensesData = selectedExpenses.map((id) => {
			const expense = data.find((exp) => exp._id === id);
			return expense;
		});
		console.log('Download expenses', selectedExpensesData);
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

				currentDoc.text('EXPENSES', pageWidth / 2, 42, { align: 'center' });
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

			const totalExpenses = selectedExpensesData.reduce(
				(total, expense) => total + expense?.amount,
				0,
			);

			// ===============================
			// TABLE SECTION
			// ===============================
			const tableStartY = 50;

			// Prepare filled rows
			const filledRows = selectedExpensesData.map((item, index) => [
				index + 1,
				item.description,
				item?.amount?.toLocaleString() || '',
				item.date ? new Date(item.date).toISOString().split('T')[0] : '',
				'',
			]);
			// Ensure minimum 10 rows
			while (filledRows.length < 10) {
				filledRows.push(['', '', '', '']);
			}
			autoTable(doc, {
				startY: tableStartY,
				head: [['S/N', 'Description', 'Amount (NG)', 'Date', 'Remarks']],
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
			doc.text('Total Expences:', 15, currentY);
			doc.setFont('helvetica', 'normal');
			doc.text(`NGN ${totalExpenses.toLocaleString()}`, 45, currentY);

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

			doc.save(`Expenses-${new Date().toISOString()}.pdf`);
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
				Failed to load expenses: {getError(error)}
			</div>
		);
	}

	return (
		<main>
			<div className="p-3 md:p-6 bg-gray-50 min-h-screen">
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-xl md:text-3xl font-bold text-gray-800">
						Expenses
					</h1>
					<button
						onClick={() => setIsAddModal(true)}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Add Expense
					</button>
				</div>

				{/* Summary Cards */}
				<div className="w-full grid sm:grid-cols-2 gap-4 mb-4">
					<div className="p-5 bg-white flex flex-col rounded-xl gap-2 border border-gray-200 hover:shadow-md">
						<span className="text-gray-500 text-sm font-medium">
							Total Expenses
						</span>
						<span className="text-xl font-bold">{total.toLocaleString()}</span>
					</div>
					<div className="p-5 bg-white flex flex-col rounded-xl gap-2 border border-gray-200 hover:shadow-md">
						<span className="text-gray-500 text-sm font-medium">
							This Month
						</span>
						<span className="text-xl font-bold">
							{thisMonthExpense.toLocaleString()}
						</span>
					</div>
				</div>

				{/* Search and Date Filter */}
				<div className="w-full flex gap-4 items-end mb-4">
					<div className="w-full">
						<label className="text-sm text-gray-700 mb-1 block">Search</label>
						<div className="flex items-center bg-white rounded-md shadow-sm border border-gray-200 p-0.5">
							<Search className="text-gray-400 ml-2" size={20} />
							<input
								type="text"
								placeholder="Search by description..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full p-2 outline-none rounded-md"
							/>
						</div>
					</div>
					<div className="w-full sm:w-auto">
						<label className="text-sm text-gray-700 mb-1 block">Date</label>
						<input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="w-full h-[46px] rounded-md border border-gray-200 px-3 text-base"
						/>
					</div>
					{isSomeSelected || isAllSelected ? (
						<button
							className=" flex items-center gap-2 h-[42px] px-2 mt-6 my-1 bg-blue-600 text-white w-fit rounded-md hover:bg-blue-700 transition-colors"
							onClick={handleDownload}
							disabled={loading}
						>
							<Download size={18} />
							<span className="hidden md:inline-block">Download</span>
						</button>
					) : (
						''
					)}
				</div>

				{/* Table */}
				<div className="bg-white rounded-md shadow overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 w-12">
									<input
										type="checkbox"
										checked={isAllSelected}
										ref={(input) => {
											if (input) input.indeterminate = isSomeSelected;
										}}
										onChange={toggleSelectAll}
										aria-label="Select all expenses"
									/>
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									S/N
								</th>
								<th
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
									onClick={() => requestSort('amount')}
								>
									<div className="flex items-center gap-1">
										Amount
										<ArrowUpDown size={14} />
									</div>
								</th>

								<th
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
									onClick={() => requestSort('description')}
								>
									<div className="flex items-center gap-1">
										Description
										<ArrowUpDown size={14} />
									</div>
								</th>
								<th
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
									onClick={() => requestSort('date')}
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
							{sortedExpenses.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-4 text-center text-gray-500"
									>
										No expenses found.
									</td>
								</tr>
							) : (
								sortedExpenses.map((expense, index) => (
									<tr key={expense._id} className="hover:bg-gray-50">
										<td className="w-12 text-center">
											<input
												type="checkbox"
												checked={selectedExpenses.includes(expense._id)}
												onChange={() => toggleSelect(expense._id)}
												aria-label={`Select ${expense.amount}`}
												className="mx-auto"
											/>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{index + 1}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{expense.amount?.toLocaleString()}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{expense.description}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{formatDate(expense.date)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											<div className="flex items-center gap-3">
												<button
													onClick={() => handleEdit(expense)}
													className="text-blue-600 hover:text-blue-800"
													title="Edit"
												>
													<Pencil size={18} />
												</button>
												<button
													onClick={() => {
														setSelectedExpense(expense); // store the expense to be deleted
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

			{/* Modals */}
			<AddExpenceModal
				show={isAddModal}
				setShow={setIsAddModal}
				setLoading={() => {}} // no longer needed externally
				loading={false}
			/>
			<EditExpenceModal
				show={isEditModal}
				setShow={setIsEditModal}
				setLoading={() => {}}
				loading={false}
				expense={selectedExpense}
				onClose={() => setSelectedExpense(null)}
			/>
			<DeleteConfirmationModal
				show={deleteModal}
				setShow={setDeleteModal}
				onConfirm={() => deleteMutation.mutate(selectedExpense._id)}
				isDeleting={deleteLoading}
				itemName={selectedExpense?.description || 'Expense'}
			/>

			{/* Global loader for delete operation */}
			{deleteLoading && <Loader />}
		</main>
	);
};

export default Expences;
