import React, { useContext, useMemo, useState, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import AuthContext from '../context/authContext';
import EditDividendRatesModal from '../components/modals/EditDividendRatesModal.jsx';
import ShareDividendModal from '../components/modals/ShareDividendModal.jsx';

import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import phone from '../assets/call.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';

import { fetchDividendRates } from '../hooks/axiosApis.js';
import Loader from '../components/Loader';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Download, Pencil } from 'lucide-react';
import formatDate from '../hooks/formatDate.js';
import { months } from '../data.js';

const DividendRatesPage = () => {
	const { year: selectedYear } = useParams();
	const { user } = useContext(AuthContext);

	const currentYear = new Date().getFullYear();
	const navigate = useNavigate();

	const [year, setYear] = useState(selectedYear || currentYear);
	const [isEditModal, setIsEditModal] = useState(false);
	const [selectedRate, setSelectedRate] = useState(null);
	const [showModal, setShowModal] = useState(false);

	const [loading, setLoading] = useState(false);
	const [logoBase64, setLogoBase64] = useState('');
	const [sealBase64, setSealBase64] = useState('');
	const [phoneBase64, setPhoneBase64] = useState('');

	const { data, isLoading, error } = useQuery({
		queryKey: ['dividend-rates', year],
		queryFn: () => fetchDividendRates(user, year),
		enabled: !!user,
	});

	const rates = data?.data || [];

	const stats = useMemo(() => {
		const totalMonths = rates.length;

		const averageRate =
			totalMonths > 0
				? rates.reduce((acc, item) => acc + Number(item.percentage), 0) /
					totalMonths
				: 0;

		const highestRate =
			totalMonths > 0 ? Math.max(...rates.map((item) => item.percentage)) : 0;

		const lowestRate =
			totalMonths > 0 ? Math.min(...rates.map((item) => item.percentage)) : 0;

		return {
			totalMonths,
			averageRate,
			highestRate,
			lowestRate,
		};
	}, [rates]);

	const yearlyRates = useMemo(() => {
		const result = [];

		for (let month = 1; month <= 12; month++) {
			const found = rates.find((rate) => rate.month === month);

			result.push({
				month,
				name: months[month - 1],
				percentage: found?.percentage || null,
				id: found?._id,
				_id: found?._id,
				year: found?.year,
				processedAt: found?.processedAt,
				status: found?.status,
				description: found?.description,
			});
		}

		return result;
	}, [rates]);

	const getMonth = (month) => {
		return months.find((m) => m.value === month)?.label;
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
	const handleDownload = () => {
		console.log('Download yearlyRates', yearlyRates);
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

				currentDoc.text(`${year} Dividend Rates`, pageWidth / 2, 42, {
					align: 'center',
				});
				currentDoc.setTextColor(0);
				// Divider line
				// currentDoc.setLineWidth(0.6);
				// currentDoc.line(14, 32, pageWidth - 14, 32);

				currentDoc.setFontSize(11);
			};

			// Initialize first page
			addBackgroundAndHeader(doc);

			// ===============================
			// TABLE SECTION
			// ===============================
			const tableStartY = 50;

			// Prepare filled rows
			const filledRows = yearlyRates.map((item, index) => [
				index + 1,
				getMonth(item.month),
				`${item.percentage}%`, // item.percentage,
				item.processedAt
					? new Date(item.processedAt).toISOString().split('T')[0]
					: '',
			]);
			// Ensure minimum 10 rows
			// while (filledRows.length < 10) {
			// 	filledRows.push(['', '', '', '']);
			// }
			autoTable(doc, {
				startY: tableStartY,
				head: [['S/N', 'Month', 'Percentage', 'Processed At']],
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
					1: { cellWidth: 'auto', halign: 'left' },
					2: { cellWidth: 32, halign: 'left' },
					3: { cellWidth: 'auto' },
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
			// doc.setFont('helvetica', 'bold');
			// doc.text('Total Investment:', 15, currentY);
			// doc.setFont('helvetica', 'normal');
			// doc.text(`NGN ${totalInvestment.toLocaleString()}`, 50, currentY);

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

			doc.save(`Dividend-Rates-${new Date().toISOString()}.pdf`);
		} catch (error) {
			console.error(error);
			toast.error('Failed to generate PDF');
		} finally {
			setLoading(false);
		}
	};

	if (isLoading) {
		return <Loader />;
	}

	if (error) {
		return <div className="p-6 text-red-500">{getError(error)}</div>;
	}

	const handleEdit = (item) => {
		setSelectedRate(item);
		setIsEditModal(true);
	};

	return (
		<div className="p-3 md:p-6 bg-gray-50 min-h-screen">
			{/* Header */}

			<div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
				<div>
					<h1 className="text-2xl font-bold">Dividend Rates</h1>

					<p className="text-gray-500 text-sm">
						Manage monthly dividend percentages
					</p>
				</div>
				{/* <div>
					<button
						onClick={() => navigate('/dividends')}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Dividend Payments
					</button>
				</div> */}
			</div>

			{/* Summary Cards */}

			<div className="grid md:grid-cols-4 gap-4 mb-6">
				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-500">Months Configured</p>

					<h2 className="text-2xl font-bold">
						{stats.totalMonths}
						/12
					</h2>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-500">Average Rate</p>

					<h2 className="text-2xl font-bold text-blue-600">
						{stats.averageRate.toFixed(2)}%
					</h2>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-500">Highest Rate</p>

					<h2 className="text-2xl font-bold text-green-600">
						{stats.highestRate}%
					</h2>
				</div>

				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-500">Lowest Rate</p>

					<h2 className="text-2xl font-bold text-orange-600">
						{stats.lowestRate}%
					</h2>
				</div>
			</div>

			{/* Rates Table */}

			<div className="bg-white rounded-lg shadow overflow-hidden p-2">
				<div className="flex justify-between items-center px-4 py-3">
					<div className=" ">
						<h2 className="font-semibold">
							<span className="hidden md:inline">{year} </span>
							Dividend Rates
						</h2>
					</div>
					<div className="flex gap-2 items-center">
						<select
							value={year}
							onChange={(e) => {
								setYear(Number(e.target.value));
								navigate(`/dividend-rates/${e.target.value}`);
							}}
							className="border rounded px-3 py-2 bg-white"
						>
							{Array.from(
								{ length: 15 },
								(_, index) => currentYear - 5 + index,
							).map((yr) => (
								<option key={yr} value={yr}>
									{yr}
								</option>
							))}
						</select>
						<button
							disabled={loading}
							onClick={handleDownload}
							className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
						>
							<Download />
						</button>
					</div>
				</div>

				<div className="overflow-x-auto px-4">
					<table className="w-full rounded-lg border border-gray-200">
						<thead>
							<tr className="bg-gray-100">
								<th className="p-3 text-left">Month</th>

								<th className="p-3 text-left whitespace-nowrap">Dividend %</th>

								<th className="p-3 text-left whitespace-nowrap">
									Processed At
								</th>

								<th className="p-3 text-left">Status</th>

								<th className="p-3 text-left">Action</th>
							</tr>
						</thead>

						<tbody>
							{yearlyRates.map((item) => (
								<tr key={item.month} className="border-t hover:bg-gray-50">
									<td className="p-3">{getMonth(item.month)}</td>

									<td className="p-3 font-medium">
										{item.percentage !== null ? `${item.percentage}%` : '-'}
									</td>

									<td className="p-3 text-gray-500 text-sm">
										{item.processedAt ? formatDate(item?.processedAt) : '-'}
									</td>

									<td className="p-3">
										{item.status === 'completed' ? (
											<span className="text-green-600 font-medium ">
												Completed
											</span>
										) : item.status === 'pending' ? (
											<span className="text-orange-500 font-medium">
												Pending
											</span>
										) : (
											<span className="text-red-500 font-medium whitespace-nowrap">
												Not set
											</span>
										)}
									</td>

									{item.status === 'completed' ? (
										<td className="flex text-green-400">
											<button
												// onClick={() => handleEdit(item)}
												onClick={() => {
													setSelectedRate(item);
													setShowModal(true);
												}}
												className="p-3 text-gray-500 text-sm"
											>
												<Check className="h-4 w-4 " />
											</button>
										</td>
									) : (
										<td className="flex">
											<button
												onClick={() => handleEdit(item)}
												className="p-3 text-gray-500 text-sm"
											>
												<Pencil className="h-4 w-4" />
											</button>
											{item.status === 'pending' ? (
												<button
													onClick={() => {
														setSelectedRate(item);
														setShowModal(true);
													}}
													className="p-3 text-gray-500 text-sm"
												>
													<Check className="h-4 w-4 " />
												</button>
											) : null}
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<EditDividendRatesModal
				show={isEditModal}
				setShow={setIsEditModal}
				setLoading={() => {}}
				loading={false}
				selectedRate={selectedRate}
				selectedYear={year}
				onClose={() => setSelectedRate(null)}
			/>
			<ShareDividendModal
				show={showModal}
				setShow={setShowModal}
				selectedRate={selectedRate}
			/>
		</div>
	);
};

export default DividendRatesPage;
