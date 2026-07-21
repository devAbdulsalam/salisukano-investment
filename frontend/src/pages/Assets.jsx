import { useContext, useState, useMemo } from 'react';
import Loader from '../components/Loader.jsx';
import AuthContext from '../context/authContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { fetchAssets } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import {
	Pencil,
	Trash2,
	Search,
	ArrowUpDown,
	Plus,
	Eye,
	TrendingUp,
	TrendingDown,
} from 'lucide-react';
import formatDate from '../hooks/formatDate.js';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal.jsx';
import { useNavigate } from 'react-router-dom';

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

const Assets = () => {
	const queryClient = useQueryClient();
	const { user } = useContext(AuthContext);
	const navigate = useNavigate();
	const apiUrl = import.meta.env.VITE_API_URL;

	const [selectedAsset, setSelectedAsset] = useState(null);
	const [deleteModal, setDeleteModal] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });

	// Fetch all assets
	const {
		data: response,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['assets'],
		queryFn: () => fetchAssets(user),
		enabled: !!user,
	});

	// Fetch dashboard stats
	const { data: dashboard } = useQuery({
		queryKey: ['assets-dashboard'],
		queryFn: async () => {
			const { data } = await axios.get(`${apiUrl}/assets/dashboard`, {
				headers: { Authorization: `Bearer ${user?.token}` },
			});
			return data.data;
		},
		enabled: !!user,
	});

	const assets = response?.data || [];

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			setDeleteLoading(true);
			const { data } = await axios.delete(`${apiUrl}/assets/${id}`, {
				headers: { Authorization: `Bearer ${user?.token}` },
			});
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['assets'] });
			queryClient.invalidateQueries({ queryKey: ['assets-dashboard'] });
			setDeleteModal(false);
			setSelectedAsset(null);
			toast.success('Asset deleted successfully');
		},
		onError: (err) => toast.error(getError(err)),
		onSettled: () => setDeleteLoading(false),
	});

	// Filter
	const filtered = useMemo(() => {
		if (!assets.length) return [];
		return assets.filter((a) => {
			const matchSearch =
				a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				a.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				a.description?.toLowerCase().includes(searchTerm.toLowerCase());
			const matchStatus = !statusFilter || a.status === statusFilter;
			return matchSearch && matchStatus;
		});
	}, [assets, searchTerm, statusFilter]);

	// Sort
	const requestSort = (key) => {
		let direction = 'asc';
		if (sortConfig.key === key && sortConfig.direction === 'asc')
			direction = 'desc';
		else if (sortConfig.key === key && sortConfig.direction === 'desc')
			direction = '';
		setSortConfig({ key, direction });
	};

	const sorted = useMemo(() => {
		if (!sortConfig.key || !sortConfig.direction) return filtered;
		return [...filtered].sort((a, b) => {
			const aVal = a[sortConfig.key];
			const bVal = b[sortConfig.key];
			if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
			return 0;
		});
	}, [filtered, sortConfig]);

	if (isLoading) return <Loader />;
	if (error) {
		return (
			<div className="p-6 text-center text-red-500">
				Failed to load assets: {getError(error)}
			</div>
		);
	}

	return (
		<main>
			<div className="p-3 md:p-6 bg-gray-50 min-h-screen">
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<div>
						<h1 className="text-xl md:text-3xl font-bold text-gray-800">
							Assets
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							Track, value and manage company assets
						</p>
					</div>
					<button
						onClick={() => navigate('/new-asset')}
						className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
					>
						<Plus size={16} />
						<span className="hidden md:inline">Add Asset</span>
					</button>
				</div>

				{/* Dashboard Cards */}
				{statusFilter !== 'sold' ? (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
						<div className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md">
							<p className="text-gray-500 text-xs font-medium mb-2">
								Total Assets
							</p>
							<p className="text-2xl font-bold text-gray-800">
								{dashboard?.totalAssets ?? assets.length}
							</p>
						</div>
						<div className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md">
							<p className="text-gray-500 text-xs font-medium mb-2">
								Total Cost
							</p>
							<p className="text-xl font-bold text-gray-800">
								₦{currency(dashboard?.totalCost)}
							</p>
						</div>
						<div className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md">
							<p className="text-gray-500 text-xs font-medium mb-2">
								Total Value
							</p>
							<p className="text-xl font-bold text-blue-600">
								₦{currency(dashboard?.totalValue)}
							</p>
						</div>
						<div className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md">
							<p className="text-gray-500 text-xs font-medium mb-2">
								Total Margin
							</p>
							<p
								className={`text-xl font-bold flex items-center gap-1 ${
									(dashboard?.totalMargin ?? 0) >= 0
										? 'text-green-600'
										: 'text-red-600'
								}`}
							>
								{(dashboard?.totalMargin ?? 0) >= 0 ? (
									<TrendingUp size={18} />
								) : (
									<TrendingDown size={18} />
								)}
								₦{currency(dashboard?.totalMargin)}
							</p>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
						<div className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md">
							<p className="text-gray-500 text-xs font-medium mb-2">
								Sold Assets
							</p>
							<p className="text-2xl font-bold text-gray-800">
								{dashboard?.totalSoldCount || 0}
							</p>
						</div>
						<div className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md">
							<p className="text-gray-500 text-xs font-medium mb-2">
								Total Cost
							</p>
							<p className="text-xl font-bold text-gray-800">
								₦{currency(dashboard?.totalCostForSold)}
							</p>
						</div>
						<div className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md">
							<p className="text-gray-500 text-xs font-medium mb-2">
								Total Sold
							</p>
							<p className="text-xl font-bold text-blue-600">
								₦{currency(dashboard?.totalSold)}
							</p>
						</div>
						<div className="p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md">
							<p className="text-gray-500 text-xs font-medium mb-2">
								Total Profit
							</p>
							<p
								className={`text-xl font-bold flex items-center gap-1 ${
									(dashboard?.totalProfitForSold ?? 0) >= 0
										? 'text-green-600'
										: 'text-red-600'
								}`}
							>
								{(dashboard?.totalProfitForSold ?? 0) >= 0 ? (
									<TrendingUp size={18} />
								) : (
									<TrendingDown size={18} />
								)}
								₦{currency(dashboard?.totalProfitForSold)}
							</p>
						</div>
					</div>
				)}

				{/* Filters */}
				<div className="flex flex-wrap gap-3 items-end mb-4">
					<div className="flex-1 min-w-[200px]">
						<label className="text-sm text-gray-700 mb-1 block">Search</label>
						<div className="flex items-center bg-white rounded-md border border-gray-200 p-0.5">
							<Search className="text-gray-400 ml-2" size={18} />
							<input
								type="text"
								placeholder="Name, serial number..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full p-2 text-sm outline-none rounded-md"
							/>
						</div>
					</div>
					<div>
						<label className="text-sm text-gray-700 mb-1 block">Status</label>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="h-[42px] rounded-md border border-gray-200 px-3 text-sm bg-white"
						>
							<option value="">All Statuses</option>
							<option value="active">Active</option>
							<option value="under_maintenance">Under Maintenance</option>
							<option value="disposed">Disposed</option>
							<option value="sold">Sold</option>
						</select>
					</div>
				</div>

				{/* Table */}
				<div className="bg-white rounded-xl shadow overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									S/N
								</th>
								<th
									onClick={() => requestSort('name')}
									className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none whitespace-nowrap"
								>
									<div className="flex items-center gap-1">
										Name <ArrowUpDown size={13} />
									</div>
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
									Asset No.
								</th>
								<th
									onClick={() => requestSort('purchasePrice')}
									className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none whitespace-nowrap"
								>
									<div className="flex items-center gap-1">
										Purchase Price <ArrowUpDown size={13} />
									</div>
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
									Total Cost
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Value
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Margin
								</th>
								<th
									onClick={() => requestSort('purchaseDate')}
									className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none whitespace-nowrap"
								>
									<div className="flex items-center gap-1">
										Purchase Date <ArrowUpDown size={13} />
									</div>
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Status
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{sorted.length === 0 ? (
								<tr>
									<td
										colSpan={10}
										className="px-4 py-8 text-center text-gray-400"
									>
										No assets found.
									</td>
								</tr>
							) : (
								sorted.map((asset, index) => {
									const margin = asset.margin;
									return (
										<tr key={asset._id} className="hover:bg-gray-50">
											<td className="px-4 py-3 text-sm text-gray-500">
												{index + 1}
											</td>
											<td
												onClick={() => navigate(`/assets/${asset._id}`)}
												className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap cursor-pointer"
											>
												{asset.name}
											</td>
											<td
												onClick={() => navigate(`/assets/${asset._id}`)}
												className="px-4 py-3 text-xs text-gray-400 cursor-pointer"
											>
												{asset.serialNumber}
											</td>
											<td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
												₦{currency(asset.purchasePrice)}
											</td>
											<td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
												₦{currency(asset.totalCost)}
											</td>
											<td className="px-4 py-3 text-sm text-blue-600 whitespace-nowrap">
												{asset.currentValuation != null
													? `₦${currency(asset.currentValuation)}`
													: asset.salePrice != null
														? `₦${currency(asset.salePrice)}`
														: '—'}
											</td>
											<td className="px-4 py-3 text-sm whitespace-nowrap">
												{margin != null ? (
													<span
														className={`flex items-center gap-1 font-medium ${
															margin >= 0 ? 'text-green-600' : 'text-red-600'
														}`}
													>
														{margin >= 0 ? (
															<TrendingUp size={14} />
														) : (
															<TrendingDown size={14} />
														)}
														₦{currency(margin)}
													</span>
												) : (
													<span className="text-gray-400">—</span>
												)}
											</td>
											<td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
												{formatDate(asset.purchaseDate)}
											</td>
											<td className="px-4 py-3">
												<span
													className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
														STATUS_COLORS[asset.status] ||
														'bg-gray-100 text-gray-600'
													}`}
												>
													{asset.status?.replace('_', ' ')}
												</span>
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center gap-3">
													<button
														onClick={() => navigate(`/edit-asset/${asset._id}`)}
														className="text-blue-600 hover:text-blue-800"
														title="Edit"
													>
														<Pencil size={16} />
													</button>
													<button
														onClick={() => {
															setSelectedAsset(asset);
															setDeleteModal(true);
														}}
														className="text-red-600 hover:text-red-800"
														title="Delete"
													>
														<Trash2 size={16} />
													</button>
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
						{sorted.length > 0 && (
							<tfoot className="bg-gray-50 border-t">
								<tr>
									<td
										colSpan={4}
										className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
									>
										{sorted.length} asset{sorted.length !== 1 ? 's' : ''}
									</td>
									<td className="px-4 py-3 text-xs font-bold text-gray-700">
										₦
										{currency(
											sorted.reduce((s, a) => s + (a.totalCost || 0), 0),
										)}
									</td>
									<td className="px-4 py-3 text-xs font-bold text-blue-600">
										₦
										{currency(
											sorted.reduce(
												(s, a) => s + (a.currentValuation ?? a.salePrice ?? 0),
												0,
											),
										)}
									</td>
									<td colSpan={4} />
								</tr>
							</tfoot>
						)}
					</table>
				</div>
			</div>

			<DeleteConfirmationModal
				show={deleteModal}
				setShow={setDeleteModal}
				onConfirm={() => deleteMutation.mutate(selectedAsset._id)}
				isDeleting={deleteLoading}
				itemName={selectedAsset?.name || 'Asset'}
			/>
			{deleteLoading && <Loader />}
		</main>
	);
};

export default Assets;
