import React, { useState, useMemo, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Eye, Pencil, Trash2, Search, ArrowUpDown } from 'lucide-react';
import Loader from '../components/Loader';
import getError from '../hooks/getError';
import AuthContext from '../context/authContext';
import { fetchRegisteredWaybills } from '../hooks/axiosApis';

const API_URL = import.meta.env.VITE_API_URL;

const InvoicesPage = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { user } = useContext(AuthContext);

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
				<div className="flex gap-2 flex-col md:flex-row">
					<button
						onClick={() => navigate('/register-invoices')}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Invoice
					</button>
					<button
						onClick={() => navigate('/waybill')}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Register
					</button>
				</div>
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
										₦{invoice.net?.toLocaleString()}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										<div className="flex items-center gap-3">
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

			{/* Optional: Add pagination if needed */}
			{/* <Pagination /> */}
		</div>
	);
};

export default InvoicesPage;
