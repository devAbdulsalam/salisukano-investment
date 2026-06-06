import { useContext, useState, useMemo } from 'react';
import Loader from '../components/Loader.jsx';
import AddExpenceModal from '../components/modals/AddExpenseModal.jsx';
import EditExpenceModal from '../components/modals/EditExpenceModal.jsx';
import AuthContext from '../context/authContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { fetchExpenses } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Search, ArrowUpDown } from 'lucide-react';
import formatDate from '../hooks/formatDate.js';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal.jsx';

const Expences = () => {
	const queryClient = useQueryClient();
	const { user } = useContext(AuthContext);

	// UI states
	const [isAddModal, setIsAddModal] = useState(false);
	const [isEditModal, setIsEditModal] = useState(false);
	const [selectedExpense, setSelectedExpense] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [deleteModal, setDeleteModal] = useState(false);
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
			const matchesSearch = expense.description
				?.toLowerCase()
				.includes(searchTerm.toLowerCase());
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
			<div className="p-6 bg-gray-50 min-h-screen">
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
									onClick={() => requestSort('serialNumber')}
								>
									<div className="flex items-center gap-1">
										Serial Number
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
									onClick={() => requestSort('amount')}
								>
									<div className="flex items-center gap-1">
										Amount
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
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{index + 1}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{expense.serialNumber}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{expense.description}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{expense.amount?.toLocaleString()}
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
