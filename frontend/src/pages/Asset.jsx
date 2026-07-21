import { useContext, useState, useEffect } from 'react';
import Loader from '../components/Loader.jsx';
import AuthContext from '../context/authContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { fetchAsset } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import {
	Plus,
	Trash2,
	TrendingUp,
	TrendingDown,
	Wrench,
	BarChart2,
	ArrowLeft,
	ShoppingCart,
	Pencil,
	Download,
} from 'lucide-react';
import formatDate from '../hooks/formatDate.js';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal.jsx';
import AddMaintenanceModal from '../components/modals/AddMaintenanceModal.jsx';
import EditMaintenanceModal from '../components/modals/EditMaintenanceModal.jsx';
import AddValuationModal from '../components/modals/AddValuationModal.jsx';
import EditValuationModal from '../components/modals/EditValuationModal.jsx';
import SellAssetModal from '../components/modals/SellAssetModal.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import phone from '../assets/call.png';

const currency = (v) =>
	Number(v || 0).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

const STATUS_COLORS = {
	active: 'bg-green-100 text-green-700',
	under_maintenance: 'bg-yellow-100 text-yellow-700',
	disposed: 'bg-gray-100 text-gray-600',
	sold: 'bg-blue-100 text-blue-700',
};

const Asset = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { user } = useContext(AuthContext);
	const apiUrl = import.meta.env.VITE_API_URL;

	const [activeTab, setActiveTab] = useState('maintenance');
	const [isMaintenanceModal, setIsMaintenanceModal] = useState(false);
	const [isEditMaintenanceModal, setIsEditMaintenanceModal] = useState(false);
	const [selectedMaintenance, setSelectedMaintenance] = useState(null);
	const [isValuationModal, setIsValuationModal] = useState(false);
	const [isEditValuationModal, setIsEditValuationModal] = useState(false);
	const [selectedValuation, setSelectedValuation] = useState(null);
	const [isSellModal, setIsSellModal] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [pdfLoading, setPdfLoading] = useState(false);
	const [logoBase64, setLogoBase64] = useState('');
	const [sealBase64, setSealBase64] = useState('');
	const [phoneBase64, setPhoneBase64] = useState('');

	// Load logo/seal for PDF
	useEffect(() => {
		const loadImg = (src, setter) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.src = src;
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				canvas.getContext('2d').drawImage(img, 0, 0);
				setter(canvas.toDataURL('image/png'));
			};
		};
		loadImg(logo, setLogoBase64);
		loadImg(seal, setSealBase64);
		loadImg(phone, setPhoneBase64);
	}, []);

	const {
		data: response,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['assets', id],
		queryFn: () => fetchAsset({ token: user?.token, id }),
		enabled: !!user && !!id,
	});

	const asset = response?.data;

	const deleteMutation = useMutation({
		mutationFn: async ({ type, itemId }) => {
			setDeleteLoading(true);
			const endpoint =
				type === 'maintenance'
					? `${apiUrl}/assets/${id}/maintenance/${itemId}`
					: `${apiUrl}/assets/${id}/valuation/${itemId}`;
			const { data } = await axios.delete(endpoint, {
				headers: { Authorization: `Bearer ${user?.token}` },
			});
			return data;
		},
		onSuccess: (_, { type }) => {
			queryClient.invalidateQueries({ queryKey: ['assets', id] });
			queryClient.invalidateQueries({ queryKey: ['assets'] });
			queryClient.invalidateQueries({ queryKey: ['assets-dashboard'] });
			toast.success(
				`${type === 'maintenance' ? 'Maintenance' : 'Valuation'} record deleted`,
			);
			setDeleteModal(false);
			setDeleteTarget(null);
		},
		onError: (err) => toast.error(getError(err)),
		onSettled: () => setDeleteLoading(false),
	});

	const confirmDelete = (type, itemId, label) => {
		setDeleteTarget({ type, itemId, label });
		setDeleteModal(true);
	};

	// ── PDF Download ────────────────────────────────────────────────────────────
	const handleDownload = () => {
		if (!asset) return;
		setPdfLoading(true);
		try {
			const doc = new jsPDF('p', 'mm', 'a4');
			const pw = doc.internal.pageSize.getWidth();
			const ph = doc.internal.pageSize.getHeight();

			const addHeader = (d) => {
				if (logoBase64) {
					d.setGState && d.setGState(new d.GState({ opacity: 0.04 }));
					d.addImage(
						logoBase64,
						'PNG',
						(pw - 120) / 2,
						(ph - 120) / 2,
						120,
						120,
					);
					d.setGState && d.setGState(new d.GState({ opacity: 1 }));
					d.addImage(logoBase64, 'PNG', 14, 10, 25, 25);
				}
				d.setFont('helvetica', 'bold');
				d.setFontSize(15);
				d.text('SALISU KANO INTERNATIONAL LIMITED', pw / 2, 18, {
					align: 'center',
				});
				d.setFont('helvetica', 'normal');
				d.setFontSize(9);
				d.text(
					"Scrap Materials' Suppliers and General Contractors",
					pw / 2,
					24,
					{ align: 'center' },
				);
				d.text(
					'No. 2 & 3 Block P, Dalar Gyade Market, Kano State',
					pw / 2,
					29,
					{ align: 'center' },
				);
				const phoneX = pw - 14;
				d.text('08023239018', pw - 14, 22, { align: 'right' });
				d.text('08067237273', pw - 14, 26, { align: 'right' });
				if (phone) {
					doc.addImage(phone, 'PNG', phoneX - 30, 18, 10, 10);
				}
				d.setFont('helvetica', 'bold');
				d.setFontSize(12);
				d.setFillColor(0);
				d.rect(pw / 2 - 28, 35, 56, 9, 'F');
				d.setTextColor(255);
				d.setLineWidth(0.4);
				d.line(14, 40, pw - 14, 40);
				d.text('ASSET REPORT', pw / 2, 41.5, { align: 'center' });
				d.setTextColor(0);
				d.setFontSize(10);
			};

			addHeader(doc);
			const totalCost = asset.totalCost ?? asset.purchasePrice;
			const margin = asset.margin;

			// ── Asset summary block ──
			let y = 52;
			const agentX = pw - 14;
			if (asset.agent?.name) {
				doc.setFont('helvetica', 'bold');
				doc.text('Agent', agentX - 100, y);
				y += 5;
				doc.setFont('helvetica', 'normal');
				doc.text(
					`Name: ${asset.agent.name}  |  Phone: ${asset.agent.phone || '—'}`,
					agentX - 100,
					y,
				);
				y += 5;
				if (asset.agent.address) {
					doc.text(`Address: ${asset.agent.address}`, agentX - 100, y);
					y += 5;
				}
			}
			y = 52;
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(11);
			doc.text(asset.name, 14, y);
			y += 6;
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(9);
			doc.text(`Asset No: ${asset.serialNumber}`, 14, y);
			y += 5;
			doc.text(`Status: ${asset.status?.replace('_', ' ')}`, 14, y);
			y += 5;
			if (asset.description) {
				doc.text(`Description: ${asset.description}`, 14, y);
				y += 5;
			}

			y += 2;

			// ── Financial summary ──
			const summaryRows = [
				[
					'Purchase Price',
					`NGN${currency(asset.purchasePrice)}`,
					formatDate(asset.purchaseDate),
				],
				[
					'Total Maintenance',
					`NGN${currency(asset.totalMaintenanceCost)}`,
					`${asset.maintenances?.length || 0} record(s)`,
				],
				['Total Cost', `NGN${currency(totalCost)}`, 'Purchase + maintenance'],
				asset.status === 'sold'
					? [
							'Sale Price',
							`NGN${currency(asset.salePrice)}`,
							asset.saleDate ? `Sold ${formatDate(asset.saleDate)}` : '',
						]
					: [
							'Current Value',
							asset.currentValuation != null
								? `NGN${currency(asset.currentValuation)}`
								: '—',
							'Latest valuation',
						],
				margin != null
					? [
							'Margin',
							`${margin >= 0 ? '+' : ''}NGN${currency(margin)}`,
							asset.marginPercent != null
								? `${asset.marginPercent.toFixed(1)}%`
								: '',
						]
					: null,
			].filter(Boolean);

			autoTable(doc, {
				startY: y,
				body: summaryRows,
				theme: 'grid',
				styles: {
					fontSize: 9,
					cellPadding: 2.5,
					lineColor: [0, 0, 0],
					lineWidth: 0.2,
				},
				columnStyles: {
					0: { fontStyle: 'bold', cellWidth: 45 },
					1: { cellWidth: 50 },
					2: { cellWidth: 'auto', textColor: [100, 100, 100] },
				},
				didDrawPage: (d) => {
					if (d.pageNumber > 1) addHeader(doc);
				},
			});
			y = doc.lastAutoTable.finalY + 8;

			// ── Maintenance table ──
			if (asset.maintenances?.length) {
				doc.setFont('helvetica', 'bold');
				doc.setFontSize(10);
				doc.text('Maintenance Records', 14, y);
				y += 4;
				autoTable(doc, {
					startY: y,
					head: [['S/N', 'Date', 'Cost (NGN)', 'Remark']],
					body: [...asset.maintenances]
						.sort((a, b) => new Date(b.date) - new Date(a.date))
						.map((m, i) => [
							i + 1,
							formatDate(m.date),
							currency(m.cost),
							m.remark || '—',
						]),
					foot: [['', 'Total', currency(asset.totalMaintenanceCost), '']],
					theme: 'grid',
					styles: {
						fontSize: 9,
						cellPadding: 2.5,
						lineColor: [0, 0, 0],
						lineWidth: 0.2,
					},
					headStyles: {
						fillColor: [0, 0, 0],
						textColor: 255,
						fontStyle: 'bold',
					},
					footStyles: { fontStyle: 'bold', fillColor: [245, 245, 245] },
					columnStyles: { 0: { halign: 'center', cellWidth: 12 } },
					didDrawPage: (d) => {
						if (d.pageNumber > 1) addHeader(doc);
					},
				});
				y = doc.lastAutoTable.finalY + 8;
			}

			// ── Valuation table ──
			if (asset.valuations?.length) {
				if (y > ph - 60) {
					doc.addPage();
					addHeader(doc);
					y = 52;
				}
				doc.setFont('helvetica', 'bold');
				doc.setFontSize(10);
				doc.text('Valuation History', 14, y);
				y += 4;
				autoTable(doc, {
					startY: y,
					head: [['S/N', 'Date', 'Value (NGN)', 'vs Total Cost', 'Remark']],
					body: [...asset.valuations]
						.sort(
							(a, b) => new Date(b.valuationDate) - new Date(a.valuationDate),
						)
						.map((v, i) => {
							const diff = v.valuation - totalCost;
							return [
								i + 1,
								formatDate(v.valuationDate),
								currency(v.valuation),
								`${diff >= 0 ? '+' : ''}${currency(diff)}`,
								v.remark || '—',
							];
						}),
					theme: 'grid',
					styles: {
						fontSize: 9,
						cellPadding: 2.5,
						lineColor: [0, 0, 0],
						lineWidth: 0.2,
					},
					headStyles: {
						fillColor: [0, 0, 0],
						textColor: 255,
						fontStyle: 'bold',
					},
					columnStyles: { 0: { halign: 'center', cellWidth: 12 } },
					didDrawPage: (d) => {
						if (d.pageNumber > 1) addHeader(doc);
					},
				});
				y = doc.lastAutoTable.finalY + 10;
			}

			y += 10;
			// ── Signature ──
			// if (y > ph - 45) {
			if (y > ph - 45) {
				doc.addPage();
				addHeader(doc);
				y = 52;
			}
			doc.setLineWidth(0.4);
			doc.line(14, y, 74, y);
			doc.text('Prepared by', 14, y + 5);
			doc.line(pw - 74, y, pw - 14, y);
			doc.text('Authorized Signature', pw - 74, y + 5);
			doc.text("For: Salisu Kano Int'l Ltd", pw - 74, y + 10);
			if (sealBase64) doc.addImage(sealBase64, 'PNG', pw - 80, y - 30, 80, 50);

			doc.save(
				`Asset-${asset.name}-${new Date().toISOString().split('T')[0]}.pdf`,
			);
		} catch (err) {
			console.error(err);
			toast.error('Failed to generate PDF');
		} finally {
			setPdfLoading(false);
		}
	};

	if (isLoading) return <Loader />;
	if (error || !asset) {
		return (
			<div className="p-6 text-center text-red-500">
				{error ? getError(error) : 'Asset not found.'}
			</div>
		);
	}

	const margin = asset.margin;
	const marginPercent = asset.marginPercent;
	const totalCost = asset.totalCost ?? asset.purchasePrice;
	const currentValue = asset.salePrice ?? asset.currentValuation;

	return (
		<main>
			<div className="p-3 md:p-6 bg-gray-50 min-h-screen">
				{/* Header */}
				<div className="mb-5">
					<button
						onClick={() => navigate('/assets')}
						className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-3"
					>
						<ArrowLeft size={15} /> Back to Assets
					</button>
					<div className="flex flex-wrap gap-3 justify-between items-start">
						<div>
							<h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
								{asset.name}
								<span
									className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[asset.status]}`}
								>
									{asset.status?.replace('_', ' ')}
								</span>
							</h1>
							<p className="text-xs text-gray-400 mt-1">Asset No. {asset.serialNumber}</p>
						</div>
						<div className="flex gap-2 flex-wrap">
							<button
								onClick={handleDownload}
								disabled={pdfLoading}
								className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
							>
								<Download size={15} />
								{pdfLoading ? 'Generating...' : 'Download'}
							</button>
							<button
								onClick={() => navigate(`/edit-asset/${id}`)}
								className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
							>
								<Pencil size={15} /> Edit
							</button>
							{asset.status !== 'sold' && asset.status !== 'disposed' && (
								<button
									onClick={() => setIsSellModal(true)}
									className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
								>
									<ShoppingCart size={15} /> Sell
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Info cards */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
					<div className="p-4 bg-white rounded-xl border border-gray-200">
						<p className="text-xs text-gray-500 mb-1">Purchase Price</p>
						<p className="text-lg font-bold text-gray-800">
							₦{currency(asset.purchasePrice)}
						</p>
						<p className="text-xs text-gray-400 mt-1">
							{formatDate(asset.purchaseDate)}
						</p>
					</div>
					<div className="p-4 bg-white rounded-xl border border-gray-200">
						<p className="text-xs text-gray-500 mb-1">Maintenance Cost</p>
						<p className="text-lg font-bold text-orange-500">
							₦{currency(asset.totalMaintenanceCost)}
						</p>
						<p className="text-xs text-gray-400 mt-1">
							{asset.maintenances?.length || 0} record
							{asset.maintenances?.length !== 1 ? 's' : ''}
						</p>
					</div>
					<div className="p-4 bg-white rounded-xl border border-gray-200">
						<p className="text-xs text-gray-500 mb-1">Total Cost</p>
						<p className="text-lg font-bold text-gray-700">
							₦{currency(totalCost)}
						</p>
						<p className="text-xs text-gray-400 mt-1">Purchase + maintenance</p>
					</div>
					<div className="p-4 bg-white rounded-xl border border-gray-200">
						<p className="text-xs text-gray-500 mb-1">
							{asset.status === 'sold' ? 'Sale Price' : 'Current Value'}
						</p>
						<p className="text-lg font-bold text-blue-600">
							{currentValue != null ? `₦${currency(currentValue)}` : '—'}
						</p>
						{asset.status === 'sold' && asset.saleDate && (
							<p className="text-xs text-gray-400 mt-1">
								Sold {formatDate(asset.saleDate)}
							</p>
						)}
					</div>
				</div>

				{/* Margin banner */}
				{margin != null && (
					<div
						className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${margin >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
					>
						{margin >= 0 ? (
							<TrendingUp size={24} className="text-green-600 shrink-0" />
						) : (
							<TrendingDown size={24} className="text-red-600 shrink-0" />
						)}
						<div>
							<p className="text-sm font-medium text-gray-700">
								{margin >= 0 ? 'Profit' : 'Loss'} on this asset
							</p>
							<p
								className={`text-xl font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}
							>
								{margin >= 0 ? '+' : ''}₦{currency(margin)}
								{marginPercent != null && (
									<span className="ml-2 text-sm font-normal opacity-70">
										({marginPercent.toFixed(1)}%)
									</span>
								)}
							</p>
						</div>
					</div>
				)}

				{/* Asset details */}
				<div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
					<h2 className="text-sm font-semibold text-gray-700 mb-3">
						Asset Details
					</h2>
					<div className="grid md:grid-cols-2 gap-2 text-sm">
						{asset.description && (
							<p className="text-gray-600 col-span-2">
								<strong>Description:</strong> {asset.description}
							</p>
						)}
						{asset.agent?.name && (
							<p>
								<strong>Agent:</strong> {asset.agent.name}
							</p>
						)}
						{asset.agent?.phone && (
							<p>
								<strong>Phone:</strong> {asset.agent.phone}
							</p>
						)}
						{asset.agent?.address && (
							<p className="col-span-2">
								<strong>Address:</strong> {asset.agent.address}
							</p>
						)}
						<p>
							<strong>Added:</strong> {formatDate(asset.createdAt)}
						</p>
					</div>
				</div>

				{/* Tabs */}
				<nav className="inline-flex bg-white p-0.5 rounded-xl shadow-sm border border-gray-200 mb-4 gap-1">
					<button
						onClick={() => setActiveTab('maintenance')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'maintenance' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
					>
						<Wrench size={16} /> Maintenance
						{asset.maintenances?.length > 0 && (
							<span
								className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${activeTab === 'maintenance' ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'}`}
							>
								{asset.maintenances.length}
							</span>
						)}
					</button>
					<button
						onClick={() => setActiveTab('valuations')}
						className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'valuations' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
					>
						<BarChart2 size={16} /> Valuations
						{asset.valuations?.length > 0 && (
							<span
								className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${activeTab === 'valuations' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
							>
								{asset.valuations.length}
							</span>
						)}
					</button>
				</nav>

				{/* Maintenance Tab */}
				{activeTab === 'maintenance' && (
					<div className="bg-white rounded-xl border border-gray-200 p-4">
						<div className="flex justify-between items-center mb-4">
							<div>
								<h2 className="text-base font-semibold text-gray-800">
									Maintenance Records
								</h2>
								{asset.maintenances?.length > 0 && (
									<p className="text-xs text-gray-400 mt-0.5">
										Total:{' '}
										<span className="font-semibold text-orange-500">
											₦{currency(asset.totalMaintenanceCost)}
										</span>
									</p>
								)}
							</div>
							<button
								onClick={() => setIsMaintenanceModal(true)}
								className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm"
							>
								<Plus size={15} /> Add
							</button>
						</div>
						{!asset.maintenances?.length ? (
							<div className="text-center py-10 text-gray-400">
								<Wrench size={32} className="mx-auto mb-2 opacity-30" />
								<p>No maintenance records yet.</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200 text-sm">
									<thead className="bg-gray-50">
										<tr>
											{['S/N', 'Date', 'Cost (₦)', 'Remark', 'Actions'].map(
												(h) => (
													<th
														key={h}
														className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
													>
														{h}
													</th>
												),
											)}
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-100">
										{[...asset.maintenances]
											.sort((a, b) => new Date(b.date) - new Date(a.date))
											.map((m, idx) => (
												<tr key={m._id} className="hover:bg-gray-50">
													<td className="px-4 py-3 text-gray-500">{idx + 1}</td>
													<td className="px-4 py-3 text-gray-600 whitespace-nowrap">
														{formatDate(m.date)}
													</td>
													<td className="px-4 py-3 font-medium text-orange-600 whitespace-nowrap">
														₦{currency(m.cost)}
													</td>
													<td className="px-4 py-3 text-gray-600">
														{m.remark || '—'}
													</td>
													<td className="px-4 py-3">
														<div className="flex items-center gap-2">
															<button
																onClick={() => {
																	setSelectedMaintenance(m);
																	setIsEditMaintenanceModal(true);
																}}
																className="text-blue-500 hover:text-blue-700"
																title="Edit"
															>
																<Pencil size={14} />
															</button>
															<button
																onClick={() =>
																	confirmDelete(
																		'maintenance',
																		m._id,
																		`maintenance record of ₦${currency(m.cost)}`,
																	)
																}
																className="text-red-500 hover:text-red-700"
																title="Delete"
															>
																<Trash2 size={14} />
															</button>
														</div>
													</td>
												</tr>
											))}
									</tbody>
									<tfoot className="bg-gray-50 border-t">
										<tr>
											<td
												colSpan={2}
												className="px-4 py-2 text-xs font-semibold text-gray-500"
											>
												Total
											</td>
											<td className="px-4 py-2 text-xs font-bold text-orange-600">
												₦{currency(asset.totalMaintenanceCost)}
											</td>
											<td colSpan={2} />
										</tr>
									</tfoot>
								</table>
							</div>
						)}
					</div>
				)}

				{/* Valuations Tab */}
				{activeTab === 'valuations' && (
					<div className="bg-white rounded-xl border border-gray-200 p-4">
						<div className="flex justify-between items-center mb-4">
							<div>
								<h2 className="text-base font-semibold text-gray-800">
									Valuation History
								</h2>
								{asset.currentValuation != null && (
									<p className="text-xs text-gray-400 mt-0.5">
										Current value:{' '}
										<span className="font-semibold text-green-600">
											₦{currency(asset.currentValuation)}
										</span>
									</p>
								)}
							</div>
							<button
								onClick={() => setIsValuationModal(true)}
								className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
							>
								<Plus size={15} /> Add
							</button>
						</div>
						{!asset.valuations?.length ? (
							<div className="text-center py-10 text-gray-400">
								<BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
								<p>No valuations yet.</p>
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200 text-sm">
									<thead className="bg-gray-50">
										<tr>
											{[
												'S/N',
												'Date',
												'Valuation (₦)',
												'vs Total Cost',
												'Remark',
												'Actions',
											].map((h) => (
												<th
													key={h}
													className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
												>
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-100">
										{[...asset.valuations]
											.sort(
												(a, b) =>
													new Date(b.valuationDate) - new Date(a.valuationDate),
											)
											.map((v, idx) => {
												const diff = v.valuation - totalCost;
												return (
													<tr key={v._id} className="hover:bg-gray-50">
														<td className="px-4 py-3 text-gray-500">
															{idx + 1}
														</td>
														<td className="px-4 py-3 text-gray-600 whitespace-nowrap">
															{formatDate(v.valuationDate)}
														</td>
														<td className="px-4 py-3 font-medium text-green-700 whitespace-nowrap">
															₦{currency(v.valuation)}
														</td>
														<td className="px-4 py-3 whitespace-nowrap">
															<span
																className={`font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}
															>
																{diff >= 0 ? '+' : ''}₦{currency(diff)}
															</span>
														</td>
														<td className="px-4 py-3 text-gray-600">
															{v.remark || '—'}
														</td>
														<td className="px-4 py-3">
															<div className="flex items-center gap-2">
																<button
																	onClick={() => {
																		setSelectedValuation(v);
																		setIsEditValuationModal(true);
																	}}
																	className="text-blue-500 hover:text-blue-700"
																	title="Edit"
																>
																	<Pencil size={14} />
																</button>
																<button
																	onClick={() =>
																		confirmDelete(
																			'valuation',
																			v._id,
																			`valuation of ₦${currency(v.valuation)}`,
																		)
																	}
																	className="text-red-500 hover:text-red-700"
																	title="Delete"
																>
																	<Trash2 size={14} />
																</button>
															</div>
														</td>
													</tr>
												);
											})}
									</tbody>
								</table>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Modals */}
			<AddMaintenanceModal
				show={isMaintenanceModal}
				setShow={setIsMaintenanceModal}
				assetId={id}
			/>
			<EditMaintenanceModal
				show={isEditMaintenanceModal}
				setShow={setIsEditMaintenanceModal}
				assetId={id}
				record={selectedMaintenance}
			/>
			<AddValuationModal
				show={isValuationModal}
				setShow={setIsValuationModal}
				assetId={id}
			/>
			<EditValuationModal
				show={isEditValuationModal}
				setShow={setIsEditValuationModal}
				assetId={id}
				record={selectedValuation}
			/>
			<SellAssetModal
				show={isSellModal}
				setShow={setIsSellModal}
				asset={asset}
			/>
			<DeleteConfirmationModal
				show={deleteModal}
				setShow={setDeleteModal}
				onConfirm={() =>
					deleteMutation.mutate({
						type: deleteTarget.type,
						itemId: deleteTarget.itemId,
					})
				}
				isDeleting={deleteLoading}
				itemName={deleteTarget?.label || 'this record'}
			/>
			{deleteLoading && <Loader />}
		</main>
	);
};

export default Asset;
