import { useContext, useMemo, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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
import { Download } from 'lucide-react';
import { months } from '../data.js';

const DividendRatesPage = () => {
	const { year: selectedYear } = useParams();
	const { user } = useContext(AuthContext);

	const queryClient = useQueryClient();
	const currentYear = new Date().getFullYear();
	const navigate = useNavigate();

	const [year, setYear] = useState(selectedYear || currentYear);
	const [isEditModal, setIsEditModal] = useState(false);
	const [selectedRate, setSelectedRate] = useState(null);
	const [showModal, setShowModal] = useState(false);

	// Local editable copy of rates — keyed by month number for O(1) updates
	const [editedRates, setEditedRates] = useState({});

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

	// Sync server data into local editable state whenever the query result changes
	useEffect(() => {
		const map = {};
		for (let month = 1; month <= 12; month++) {
			const found = rates.find((r) => r.month === month);
			map[month] = {
				month,
				percentage: found?.percentage ?? '',
				_id: found?._id,
				year: found?.year,
				processedAt: found?.processedAt,
				status: found?.status,
				description: found?.description,
			};
		}
		setEditedRates(map);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	const stats = useMemo(() => {
		const existing = rates.filter((r) => r.percentage != null);
		const totalMonths = existing.length;

		const averageRate =
			totalMonths > 0
				? existing.reduce((acc, item) => acc + Number(item.percentage), 0) /
					totalMonths
				: 0;

		const highestRate =
			totalMonths > 0
				? Math.max(...existing.map((item) => item.percentage))
				: 0;

		const lowestRate =
			totalMonths > 0
				? Math.min(...existing.map((item) => item.percentage))
				: 0;

		const totalDividend =
			totalMonths > 0
				? existing.reduce((acc, item) => acc + Number(item.percentage), 0)
				: 0;

		return {
			totalMonths,
			averageRate,
			highestRate,
			lowestRate,
			totalDividend,
		};
	}, [rates]);

	// Derive a stable sorted array from the editable map for rendering / PDF
	const yearlyRates = useMemo(
		() =>
			Array.from({ length: 12 }, (_, i) => {
				const month = i + 1;
				return {
					...(editedRates[month] ?? { month, percentage: '' }),
					name: months.find((m) => m.value === month)?.label ?? '',
				};
			}),
		[editedRates],
	);

	// Update a single month's percentage in the editable map
	const updateRow = useCallback((month, value) => {
		setEditedRates((prev) => ({
			...prev,
			[month]: {
				...prev[month],
				percentage: value === '' ? '' : Number(value),
			},
		}));
	}, []);

	const getMonth = (month) =>
		months.find((m) => m.value === month)?.label ?? '';

	// Load logo as base64
	useEffect(() => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = logo;
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			canvas.getContext('2d')?.drawImage(img, 0, 0);
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
			canvas.getContext('2d')?.drawImage(img, 0, 0);
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
			canvas.getContext('2d')?.drawImage(img, 0, 0);
			setPhoneBase64(canvas.toDataURL('image/png'));
		};
	}, []);

	const apiUrl = import.meta.env.VITE_API_URL;

	const mutation = useMutation({
		mutationFn: async (payload) => {
			return axios.post(`${apiUrl}/shareholders/update-dividend`, payload, {
				headers: { Authorization: `Bearer ${user?.token}` },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['shareholders'] });
			queryClient.invalidateQueries({ queryKey: ['dividend-rates'] });
			queryClient.invalidateQueries({ queryKey: ['dividends'] });
			queryClient.invalidateQueries({ queryKey: ['dividends', year] });
			toast.success('Dividend updated successfully');
			navigate(`/shareholders?year=${year}`);
		},
		onError: (err) => {
			toast.error(getError(err));
		},
	});

	const handleSubmit = useCallback(
		(e) => {
			e.preventDefault();

			// Build the dividend payload from editedRates — only months that have a value
			const dividendData = Object.values(editedRates)
				.filter((r) => r.percentage !== '' && r.percentage != null)
				.map((r) => ({ month: r.month, percentage: Number(r.percentage) }));

			mutation.mutate({
				year: Number(year),
				dividend: dividendData,
			});
		},
		[year, editedRates, mutation],
	);

	const isSubmitting = mutation.isPending;

	const handleDownload = () => {
		setLoading(true);

		try {
			const doc = new jsPDF('p', 'mm', 'a4');
			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();

			const addBackgroundAndHeader = (currentDoc) => {
				if (logoBase64) {
					const ww = 120;
					const wh = 120;
					const cx = (pageWidth - ww) / 2;
					const cy = (pageHeight - wh) / 2;

					if (currentDoc.setGState) {
						currentDoc.setGState(new currentDoc.GState({ opacity: 0.04 }));
					}
					currentDoc.addImage(logoBase64, 'PNG', cx, cy, ww, wh);
					if (currentDoc.setGState) {
						currentDoc.setGState(new currentDoc.GState({ opacity: 1 }));
					}
				}

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

				const phoneX = pageWidth - 14;
				currentDoc.text('08023239018', phoneX, 22, { align: 'right' });
				currentDoc.text('08067237273', phoneX, 26, { align: 'right' });

				if (phoneBase64) {
					currentDoc.addImage(phoneBase64, 'PNG', phoneX - 30, 18, 10, 10);
				}

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
				currentDoc.setFontSize(11);
			};

			addBackgroundAndHeader(doc);

			const filledRows = yearlyRates.map((item, index) => [
				index + 1,
				getMonth(item.month),
				item.percentage !== '' && item.percentage != null
					? `${item.percentage}%`
					: '-',
			]);

			autoTable(doc, {
				startY: 50,
				head: [['S/N', 'Month', 'Percentage']],
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
					2: { cellWidth: 'auto', halign: 'left' },
				},
				didDrawPage: (data) => {
					if (data.pageNumber > 1) addBackgroundAndHeader(doc);
				},
			});

			let currentY = doc.lastAutoTable.finalY + 10;

			if (currentY > pageHeight - 85) {
				doc.addPage();
				addBackgroundAndHeader(doc);
				currentY = 55;
			}

			const gap = 10;
			currentY += gap;

			doc.setFont('helvetica', 'bold');
			doc.text('Note:', 15, currentY);
			doc.setLineWidth(0.3);
			doc.rect(15, currentY + 3, pageWidth - 30, 20);

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

			doc.save(`Dividend-Rates-${new Date().toISOString()}.pdf`);
		} catch (err) {
			console.error(err);
			toast.error('Failed to generate PDF');
		} finally {
			setLoading(false);
		}
	};

	if (isLoading) return <Loader />;
	if (error) return <div className="p-6 text-red-500">{getError(error)}</div>;

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
			</div>

			{/* Summary Cards */}
			<div className="grid md:grid-cols-5 gap-4 mb-6">
				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-500">Year</p>
					<h2 className="text-2xl font-bold">{year}</h2>
				</div>
				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-500">Months Configured</p>
					<h2 className="text-2xl font-bold">{stats.totalMonths}/12</h2>
				</div>
				<div className="bg-white rounded-lg shadow p-4">
					<p className="text-sm text-gray-500">Total Dividend</p>
					<h2 className="text-2xl font-bold text-green-600">
						{stats.totalDividend}%
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
				<div className="flex justify-end md:justify-between items-center px-4 py-3">
					<div className="hidden md:block">
						<h2 className="font-semibold">Dividend Rates</h2>
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
									{yr} Financial Year
								</option>
							))}
						</select>
						<button
							disabled={loading}
							onClick={handleDownload}
							className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
						>
							<Download className="w-4 h-4 " />
						</button>
					</div>
				</div>

				<div className="overflow-x-auto px-4">
					<table className="w-full rounded-lg border border-gray-200">
						<thead>
							<tr className="bg-gray-100">
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									S/N
								</th>
								<th className="p-3 text-left">Month</th>
								<th className="border p-3 text-left whitespace-nowrap">
									Dividend %
								</th>
							</tr>
						</thead>
						<tbody>
							{yearlyRates.map((item, index) => (
								<tr key={item.month} className="border-t hover:bg-gray-50">
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{index + 1}
									</td>
									<td className="p-3">{item.name}</td>

									<td className="border px-1 whitespace-nowrap min-w-[130px]">
										<input
											type="number"
											step="0.01"
											value={item.percentage}
											onChange={(e) => updateRow(item.month, e.target.value)}
											className="border rounded px-2 py-1 w-full text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-blue-400"
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>

					<div className="mt-2 ">
						<button
							disabled={loading || isSubmitting}
							onClick={handleSubmit}
							className="inline-flex justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? (
								<>
									<svg
										className="mr-2 h-4 w-4 animate-spin text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
										/>
									</svg>
									Sharing...
								</>
							) : (
								'Share Dividend'
							)}
						</button>
					</div>
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
