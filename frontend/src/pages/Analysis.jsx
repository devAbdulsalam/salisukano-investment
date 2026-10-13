import { useContext, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/authContext.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchReconciliations, deleteReconciliationApi } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import Loader from '../components/Loader.jsx';
import { FaPlus } from 'react-icons/fa6';
import { FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import moment from 'moment';
import ReconciliationModal from '../components/modals/ReconciliationModal.jsx';

const Analysis = () => {
	const { id } = useParams(); // customerId
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const [isCreateModal, setIsCreateModal] = useState(false);
	const [isEditModal, setIsEditModal] = useState(false);
	const [selectedRecon, setSelectedRecon] = useState(null);

	const { data, isLoading, error } = useQuery({
		queryKey: ['reconciliations', id],
		queryFn: () => fetchReconciliations({ user, customerId: id }),
	});

	useEffect(() => {
		if (error) toast.error(getError(error));
	}, [error]);

	const deleteMutation = useMutation({
		mutationFn: (reconId) => deleteReconciliationApi({ user, id: reconId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['reconciliations', id] });
			toast.success('Reconciliation deleted');
		},
		onError: (err) => toast.error(getError(err)),
	});

	const handleEdit = (recon) => {
		setSelectedRecon(recon);
		setIsEditModal(true);
	};

	const handlePreview = (reconId) => {
		navigate(`/analysis/${id}/reconciliation/${reconId}`);
	};

	const handleDelete = (reconId) => {
		if (window.confirm('Delete this reconciliation? This cannot be undone.')) {
			deleteMutation.mutate(reconId);
		}
	};

	const customer = data?.customer;
	const reconciliations = data?.reconciliations || [];

	return (
		<>
			<main className="w-full py-3 pl-7 pr-5 flex flex-col space-y-4">
				{/* Page header */}
				<div className="flex justify-between items-start">
					<div>
						<h4 className="font-semibold text-lg text-primary">Analysis</h4>
						<ul className="text-tiny font-medium flex items-center space-x-2 text-text3">
							<li>
								<Link to="/companies" className="hover:text-blue-500">
									Companies
								</Link>
							</li>
							<li className="flex items-center">
								<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full" />
							</li>
							<li>
								<Link
									to={`/companies/${id}`}
									className="hover:text-blue-500 capitalize"
								>
									{customer?.name || '...'}
								</Link>
							</li>
							<li className="flex items-center">
								<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full" />
							</li>
							<li className="text-blue-500">Monthly Reconciliations</li>
						</ul>
					</div>

					<button
						onClick={() => setIsCreateModal(true)}
						className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
					>
						<FaPlus className="text-xs" />
						Create
					</button>
				</div>

				{/* Summary card */}
				{reconciliations.length > 0 && (
					<div className="p-5 bg-white flex flex-col max-w-xs rounded-xl gap-1 border border-[#E7E7E7] hover:shadow-xl">
						<span className="text-[#637381] text-sm font-medium">
							Total Reconciliations
						</span>
						<span className="text-xl font-bold">{reconciliations.length}</span>
					</div>
				)}

				{/* Table */}
				<div className="w-full p-4 bg-white rounded-xl border border-[#E7E7E7]">
					<h3 className="text-[#212B36] text-base font-semibold mb-4">
						Monthly Reconciliations
					</h3>

					{reconciliations.length === 0 && !isLoading ? (
						<div className="text-center py-16 text-gray-400">
							<p className="text-sm">No reconciliations yet.</p>
							<button
								onClick={() => setIsCreateModal(true)}
								className="mt-3 flex items-center gap-1 mx-auto text-blue-500 hover:text-blue-700 text-sm font-medium"
							>
								<FaPlus className="text-xs" /> Create the first one
							</button>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="table-auto w-full text-left text-sm border-separate border-spacing-y-1">
								<thead>
									<tr className="bg-[#222E3A]/[6%]">
										<th className="py-3 pl-3 text-[#212B36] font-normal whitespace-nowrap rounded-l-lg">
											Month
										</th>
										<th className="py-3 px-2 text-[#212B36] font-normal whitespace-nowrap">
											Total Ledger ₦
										</th>
										<th className="py-3 px-2 text-[#212B36] font-normal whitespace-nowrap">
											Less Bank ₦
										</th>
										<th className="py-3 px-2 text-[#212B36] font-normal whitespace-nowrap">
											Deductions ₦
										</th>
										<th className="py-3 px-2 text-[#212B36] font-normal whitespace-nowrap">
											Balance Unpaid ₦
										</th>
										<th className="py-3 px-2 text-[#212B36] font-normal whitespace-nowrap">
											Prepared By
										</th>
										<th className="py-3 px-2 text-[#212B36] font-normal whitespace-nowrap rounded-r-lg">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{reconciliations.map((recon) => {
										const totalDed = recon.deductions?.reduce(
											(s, d) => s + (d.amount || 0),
											0
										);
										return (
											<tr
												key={recon._id}
												className="bg-[#f6f8fa] hover:shadow-md transition-shadow"
											>
												<td className="py-3 pl-3 font-medium whitespace-nowrap rounded-l-lg">
													{moment(recon.month).format('MMMM, YYYY')}
												</td>
												<td className="py-3 px-2 text-[#4F80E1] whitespace-nowrap">
													{recon.totalFromLedger?.toLocaleString()}
												</td>
												<td className="py-3 px-2 text-[#637381] whitespace-nowrap">
													{recon.lessBank?.toLocaleString()}
												</td>
												<td className="py-3 px-2 text-[#DD6107] whitespace-nowrap">
													{totalDed?.toLocaleString()}
												</td>
												<td className="py-3 px-2 font-semibold text-[#10B860] whitespace-nowrap">
													{recon.balanceUnpaid?.toLocaleString()}
												</td>
												<td className="py-3 px-2 text-[#637381] whitespace-nowrap capitalize">
													{recon.preparedBy}
												</td>
												<td className="py-3 px-2 whitespace-nowrap rounded-r-lg">
													<div className="flex items-center gap-2">
														{/* Preview / PDF */}
														<button
															onClick={() => handlePreview(recon._id)}
															title="Preview & Download PDF"
															className="flex items-center gap-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 px-2 py-1 rounded transition-colors"
														>
															<FiEye />
															View
														</button>
														{/* Edit */}
														<button
															onClick={() => handleEdit(recon)}
															title="Edit"
															className="flex items-center gap-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-600 px-2 py-1 rounded transition-colors"
														>
															<FiEdit2 />
															Edit
														</button>
														{/* Delete */}
														<button
															onClick={() => handleDelete(recon._id)}
															title="Delete"
															disabled={deleteMutation.isPending}
															className="flex items-center gap-1 text-xs bg-red-100 hover:bg-red-200 text-red-500 px-2 py-1 rounded transition-colors disabled:opacity-50"
														>
															<FiTrash2 />
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
			</main>

			{/* Create modal */}
			<ReconciliationModal
				show={isCreateModal}
				setShow={setIsCreateModal}
				customerId={id}
			/>

			{/* Edit modal */}
			<ReconciliationModal
				show={isEditModal}
				setShow={setIsEditModal}
				customerId={id}
				reconciliation={selectedRecon}
			/>

			{isLoading && <Loader />}
		</>
	);
};

export default Analysis;
