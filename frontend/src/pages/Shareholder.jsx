import React from 'react';
import { useContext, useState, useMemo, useEffect } from 'react';
import Loader from '../components/Loader.jsx';
import AuthContext from '../context/authContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchShareholder } from '../hooks/axiosApis.js';
import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import phone from '../assets/call.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { Plus, Download, Minus, List, ArrowDownWideNarrow } from 'lucide-react';
import formatDate from '../hooks/formatDate.js';
import { useNavigate, useParams } from 'react-router-dom';
import { months } from '../data.js';
import TopupModal from '../components/modals/TopupModal.jsx';

const currency = (amount) =>
	Number(amount || 0).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

const Shareholder = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { user } = useContext(AuthContext);

	const [shareholder, setShareholder] = useState(null);
	const [year, setYear] = useState(new Date().getFullYear());
	const [loading, setLoading] = useState(false);
	const [topupModal, setTopupModal] = useState(false);
	const [isTopup, setIsTopup] = useState(false);
	const [logoBase64, setLogoBase64] = useState('');
	const [sealBase64, setSealBase64] = useState('');
	const [phoneBase64, setPhoneBase64] = useState('');
	const [activeTab, setActiveTab] = useState('dividends');

	// Fetch shareholder
	const { data, isLoading, error } = useQuery({
		queryKey: ['shareholders', id],
		queryFn: () => fetchShareholder(id, user),
		enabled: !!user,
	});

	useEffect(() => {
		if (data?.shareholder) {
			setShareholder(data.shareholder);
		}
	}, [data]);

	const years = useMemo(() => {
		if (!data?.dividends) return [];

		return [...new Set(data.dividends.map((d) => d.year))].sort(
			(a, b) => b - a,
		);
	}, [data]);

	const getMonth = (month) => {
		return months.find((m) => m.value === month)?.label;
	};
	// Filtering
	const filteredDividends = useMemo(() => {
		if (!data?.dividends) return [];

		return data.dividends.filter(
			(dividend) => !year || dividend.year === Number(year),
		);
	}, [data, year]);
	const filteredTransactions = useMemo(() => {
		if (!data?.transactions) return [];

		return data.transactions.filter(
			(transaction) =>
				!year ||
				new Date(transaction.transactionDate).getFullYear() === Number(year),
		);
	}, [data, year]);
	const stats = useMemo(() => {
		if (!data) {
			return {
				investment: 0,
				totalDividend: 0,
				closingBalance: 0,
				totalDeposits: 0,
				totalWithdrawals: 0,
			};
		}

		const totalDeposits = filteredTransactions
			.filter((t) => t.type !== 'withdrawal')
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const totalWithdrawals = filteredTransactions
			.filter((t) => t.type === 'withdrawal')
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const investment = totalDeposits - totalWithdrawals;

		const totalDividend = filteredDividends.reduce(
			(sum, dividend) => sum + Number(dividend.dividendAmount || 0),
			0,
		);

		const closingBalance = investment + totalDividend;

		return {
			totalDeposits,
			totalWithdrawals,
			investment,
			totalDividend,
			closingBalance,
		};
	}, [data, filteredTransactions, filteredDividends]);

	// Handlers
	// const handleEdit = (Shareholder) => {
	// 	setSelectedShareholder(Shareholder);
	// 	setIsEditModal(true);
	// };
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
		console.log('Download Shareholders', filteredDividends);
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

			// ===============================
			// TABLE SECTION
			// ===============================
			const tableStartY = 50;

			// Prepare filled rows
			const filledRows = filteredDividends.map((item, index) => [
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
			doc.text(`NGN ${stats?.totalInvestment?.toLocaleString()}`, 45, currentY);

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
				Failed to load Shareholder: {getError(error)}
			</div>
		);
	}

	return (
		<main>
			<div className="p-3 md:p-6 bg-gray-50 min-h-screen">
				{/* Shareholder Details */}
				<div className="bg-white rounded-lg shadow p-4 mb-6">
					<h2 className="font-bold text-xl mb-3">{shareholder?.name}</h2>

					<div className="grid md:grid-cols-2 gap-2 text-sm">
						<p>
							<strong>Phone:</strong> {shareholder?.phone || '-'}
						</p>

						<p>
							<strong>Email:</strong> {shareholder?.email || '-'}
						</p>

						<p>
							<strong>Address:</strong> {shareholder?.address || '-'}
						</p>

						<p>
							<strong>Date Added:</strong>{' '}
							{shareholder?.createdAt
								? new Date(shareholder.createdAt).toLocaleDateString()
								: '-'}
						</p>
					</div>
				</div>

				<div className="grid md:grid-cols-4 gap-4 mb-6">
					<div className="bg-white shadow rounded p-4">
						<div
							onClick={() => {
								setIsTopup('topup');
								setTopupModal(true);
							}}
							className="cursor-pointer w-full flex justify-between gap-2 items-end mb-4 text-green-600"
						>
							<p className="text-gray-500 text-sm">Investment</p>
							<Plus size={18} />
						</div>
						<h3 className="font-bold text-xl">₦{currency(stats.investment)}</h3>
					</div>

					<div className="bg-white shadow rounded p-4">
						<p className="text-gray-500 text-sm">Total Dividends</p>
						<h3 className="font-bold text-xl text-green-600">
							₦{currency(stats.totalDividend)}
						</h3>
					</div>

					<div className="bg-white shadow rounded p-4">
						<div
							onClick={() => {
								setIsTopup('withdrawal');
								setTopupModal(true);
							}}
							className="cursor-pointer w-full flex justify-between gap-2 items-end mb-4 text-red-600"
						>
							<p className="text-gray-500 text-sm">Withdrawals</p>
							<Minus size={18} />
						</div>
						<h3 className="font-bold text-xl text-red-600">
							₦{currency(stats.totalWithdrawals)}
						</h3>
					</div>

					<div className="bg-white shadow rounded p-4">
						<p className="text-gray-500 text-sm">Closing Balance</p>
						<h3 className="font-bold text-xl text-blue-700">
							₦{currency(stats.closingBalance)}
						</h3>
					</div>
				</div>

				{/* Tabs */}
				<div className="border-b border-gray-200">
					<nav className="-mb-px flex space-x-4" aria-label="Tabs">
						<button
							onClick={() => setActiveTab('dividends')}
							className={`py-2 px-1 border-b-2 text-sm font-medium flex items-center justify-center gap-2 ${
								activeTab === 'dividends'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							<ArrowDownWideNarrow className="h-4 w-4" />
							Dividends
						</button>
						<button
							onClick={() => setActiveTab('transactions')}
							className={`py-2 px-1 border-b-2 text-sm font-medium flex items-center justify-center gap-2 ${
								activeTab === 'transactions'
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
						>
							<List className="h-4 w-4" />
							Transactions
						</button>
					</nav>
				</div>

				{/* Tab Panels */}
				<div className="mt-2">
					{activeTab === 'dividends' && (
						<div className="overflow-x-auto">
							<div className="bg-white rounded-lg shadow overflow-x-auto p-4">
								{/* Search and Date Filter */}
								<div className="w-full flex gap-4  items-center mb-4">
									{/* Year selector */}
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
									<button
										disabled={loading}
										onClick={handleDownload}
										className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm flex items-center justify-center gap-2 w-full md:w-auto "
									>
										<Download className="h-4 w-4" />
										Download
									</button>
								</div>

								<table className="w-full rounded-lg border border-gray-200 overflow-x-auto">
									<thead>
										<tr className="bg-gray-100">
											<th className="p-3 text-left">Month</th>
											<th className="p-3 text-left">Rate</th>
											<th className="p-3 text-left">Dividend</th>
											<th className="p-3 text-left">Total</th>
										</tr>
									</thead>

									<tbody>
										{filteredDividends.map((dividend) => (
											<tr
												key={dividend._id}
												className="border-t hover:bg-gray-50"
											>
												<td className="p-3">{getMonth(dividend.month)}</td>

												<td className="p-3">{dividend.percentage}%</td>

												<td className="p-3 text-green-600 font-medium">
													₦{currency(dividend.dividendAmount)}
												</td>
												<td className="p-3">
													₦{currency(dividend.investmentAmount)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
					{activeTab === 'transactions' && (
						<div className="overflow-x-auto">
							<table className="min-w-full rounded-lg border text-sm">
								<thead className="bg-gray-100 ">
									<tr>
										<th className="px-4 py-2 text-left font-medium text-gray-500">
											Date
										</th>
										<th className="px-4 py-2 text-left font-medium text-gray-500">
											Type
										</th>
										<th className="px-4 py-2 text-left font-medium text-gray-500">
											Amount
										</th>
										<th className="px-4 py-2 text-left font-medium text-gray-500">
											Effective Month/Year
										</th>
										<th className="px-4 py-2 text-left font-medium text-gray-500">
											Description
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{filteredTransactions.length === 0 ? (
										<tr>
											<td
												colSpan="4"
												className="px-4 py-4 text-center text-gray-400"
											>
												No transactions found
											</td>
										</tr>
									) : (
										filteredTransactions.map((tx, idx) => (
											<tr key={idx} className="hover:bg-gray-50">
												<td className="px-4 py-2 whitespace-nowrap">
													{formatDate(tx.createdAt)}
												</td>
												<td className="px-4 py-2">
													<span
														className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
															tx.type !== 'withdrawal'
																? 'bg-green-100 text-green-800'
																: 'bg-red-100 text-red-800'
														}`}
													>
														{tx.type}
													</span>
												</td>

												<td className="px-4 py-2 font-medium">
													<span
														className={
															tx.type !== 'withdrawal'
																? 'text-green-600'
																: 'text-red-600'
														}
													>
														{tx.type !== 'withdrawal' ? '+' : '−'}
														{currency(tx.amount)}
													</span>
												</td>
												<td className="p-3">{getMonth(tx.effectiveMonth)}</td>
												<td className="px-4 py-2 whitespace-nowrap">
													{tx.description || '—'}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
			<TopupModal
				show={topupModal}
				setShow={setTopupModal}
				onClose={() => setTopupModal(false)}
				setLoading={() => {}}
				loading={false}
				shareholder={shareholder}
				isTopup={isTopup === 'topup' ? true : false}
			/>
		</main>
	);
};

export default Shareholder;
