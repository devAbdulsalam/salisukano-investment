import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AuthContext from '../context/authContext.jsx';
import { fetchAdvanceAccount } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import Loader from '../components/Loader.jsx';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { IoMdOptions } from 'react-icons/io';
import { FaPlus, FaMinus } from 'react-icons/fa6';
import { SiMicrosoftexcel } from 'react-icons/si';
import { useDownloadExcel } from 'react-export-table-to-excel';
import moment from 'moment';
import AdvanceCreditModal from '../components/modals/AdvanceCreditModal.jsx';
import AdvanceDebitModal from '../components/modals/AdvanceDebitModal.jsx';
import AdvanceEditModal from '../components/modals/AdvanceEditModal.jsx';
import AdvanceDeleteModal from '../components/modals/AdvanceDeleteModal.jsx';
import { PencilLine, Trash2, Eye } from 'lucide-react';

const Advance = () => {
	const { user } = useContext(AuthContext);
	const { id } = useParams(); // customerId
	const navigate = useNavigate();
	const tableRef = useRef(null);

	const [showCredit, setShowCredit] = useState(false);
	const [showDebit, setShowDebit] = useState(false);
	const [showEdit, setShowEdit] = useState(false);
	const [showDelete, setShowDelete] = useState(false);
	const [selectedTx, setSelectedTx] = useState(null);
	const [detailTx, setDetailTx] = useState(null);

	const { data, isLoading, error } = useQuery({
		queryKey: ['advance', id],
		queryFn: () => fetchAdvanceAccount({ token: user?.token, id }),
	});

	useEffect(() => {
		if (error) {
			const message = getError(error);
			toast.error(message);
		}
	}, [error]);

	const transactions = data?.account?.transactions ?? [];
	const balance = data?.account?.balance ?? 0;
	const customer = data?.customer;

	// Sort ascending by date for display
	const sorted = [...transactions].sort(
		(a, b) => new Date(a.date) - new Date(b.date),
	);

	const { onDownload } = useDownloadExcel({
		currentTableRef: tableRef.current,
		filename: `${customer?.name || 'advance'} advance account`,
		sheet: 'Advance',
	});

	const openEdit = (tx) => {
		setSelectedTx(tx);
		setShowEdit(true);
	};

	const openDelete = (tx) => {
		setSelectedTx(tx);
		setShowDelete(true);
	};

	const toggleDetail = (tx) => {
		setDetailTx((prev) => (prev?._id === tx._id ? null : tx));
	};

	return (
		<>
			<main className="w-full py-3 pl-7 pr-5 gap-5 flex flex-col space-y-3">
				{/* ── Header ── */}
				<div className="flex justify-between items-start">
					<div>
						<h4 className="font-semibold text-lg text-primary">
							Advance Account
						</h4>
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
									className="capitalize text-blue-500 hover:text-blue-500/50"
								>
									{customer?.name || '…'}
								</Link>
							</li>
							<li className="flex items-center">
								<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full" />
							</li>
							<li className="text-gray-500">Advance</li>
						</ul>
					</div>

					{/* ── Options menu ── */}
					<Menu as="div" className="relative ml-1">
						<MenuButton className="pl-3 py-2 px-2 flex items-center gap-1 rounded text-sm text-white bg-blue-500 hover:bg-blue-400 font-normal">
							<IoMdOptions />
						</MenuButton>
						<MenuItems
							transition
							className="absolute right-0 z-10 mt-0 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
						>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2 flex w-full items-center gap-2 rounded text-sm text-gray-700 hover:bg-green-100 font-normal"
								onClick={() => setShowCredit(true)}
							>
								<FaPlus className="text-green-500" />
								New Credit
							</MenuItem>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2 flex w-full items-center gap-2 rounded text-sm text-gray-700 hover:bg-red-100 font-normal"
								onClick={() => setShowDebit(true)}
							>
								<FaMinus className="text-red-500" />
								New Debit
							</MenuItem>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2 flex w-full items-center gap-2 rounded text-sm text-gray-700 hover:bg-green-100 font-normal"
								onClick={onDownload}
							>
								<SiMicrosoftexcel className="text-green-600" />
								Export Excel
							</MenuItem>
						</MenuItems>
					</Menu>
				</div>

				{/* ── Balance card ── */}
				<div className="md:flex justify-start gap-2">
					<div className="p-5 mb-4 bg-white flex flex-col md:max-w-xs w-full rounded-xl gap-2 border border-[#E7E7E7] hover:shadow-xl cursor-default">
						<div className="flex justify-between">
							<span className="text-[#637381] text-sm font-medium">
								Advance Balance
							</span>
							<div className="flex gap-1 items-center">
								<span
									className={`text-xs font-semibold ${
										balance >= 0 ? 'text-green-500' : 'text-red-500'
									}`}
								>
									{balance >= 0 ? 'Credit' : 'Debit'}
								</span>
							</div>
						</div>
						<div className="flex gap-4 justify-between flex-nowrap items-center">
							<span
								className={`text-xl font-bold whitespace-nowrap ${
									balance >= 0 ? 'text-gray-800' : 'text-red-500'
								}`}
							>
								₦ {Math.abs(balance).toLocaleString()}
							</span>
							<img
								src="/assets/admin/dashboard/graph1.svg"
								className="w-10 h-10"
								alt="graph"
							/>
						</div>
					</div>

					{/* Quick-action buttons (mobile-friendly shortcut) */}
					<div className="flex md:flex-col gap-2 mb-4 md:justify-center">
						<button
							onClick={() => setShowCredit(true)}
							className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
						>
							<FaPlus className="text-xs" /> New Credit
						</button>
						<button
							onClick={() => setShowDebit(true)}
							className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
						>
							<FaMinus className="text-xs" /> New Debit
						</button>
					</div>
				</div>

				{/* ── Ledger table ── */}
				<div className="bg-white rounded-xl border border-[#E7E7E7] overflow-x-auto">
					<table ref={tableRef} className="min-w-full text-sm text-left">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr>
								<th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
									#
								</th>
								<th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
									Date
								</th>
								<th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
									Company
								</th>
								<th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
									Description
								</th>
								<th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap text-right">
									Debit (₦)
								</th>
								<th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap text-right">
									Credit (₦)
								</th>
								<th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap text-right">
									Balance (₦)
								</th>
								<th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap text-center">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{sorted.length === 0 && (
								<tr>
									<td
										colSpan={8}
										className="px-4 py-10 text-center text-gray-400 text-sm"
									>
										No transactions yet. Use{' '}
										<button
											onClick={() => setShowCredit(true)}
											className="text-green-500 underline"
										>
											New Credit
										</button>{' '}
										or{' '}
										<button
											onClick={() => setShowDebit(true)}
											className="text-red-500 underline"
										>
											New Debit
										</button>{' '}
										to add the first entry.
									</td>
								</tr>
							)}
							{sorted.map((tx, index) => (
								<>
									<tr
										key={tx._id}
										className="hover:bg-blue-50/40 cursor-pointer transition-colors"
									>
										<td className="px-4 py-3 text-gray-500">{index + 1}</td>
										<td className="px-4 py-3 whitespace-nowrap">
											{moment(tx.date).format('DD MMM YYYY')}
										</td>
										<td className="px-4 py-3 whitespace-nowrap font-medium">
											{customer?.name || '—'}
										</td>
										<td className="px-4 py-3 max-w-[220px] truncate">
											{tx.description || '—'}
										</td>
										<td className="px-4 py-3 text-right">
											{tx.debit > 0 ? (
												<span className="text-red-500 font-medium">
													{tx.debit.toLocaleString()}
												</span>
											) : (
												<span className="text-gray-300">—</span>
											)}
										</td>
										<td className="px-4 py-3 text-right">
											{tx.credit > 0 ? (
												<span className="text-green-600 font-medium">
													{tx.credit.toLocaleString()}
												</span>
											) : (
												<span className="text-gray-300">—</span>
											)}
										</td>
										<td
											className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
												tx.balance < 0 ? 'text-red-500' : 'text-gray-800'
											}`}
										>
											{tx.balance < 0 ? '-' : ''}
											{Math.abs(tx.balance).toLocaleString()}
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center justify-center gap-2">
												<button
													title="Details"
													onClick={() => toggleDetail(tx)}
													className="p-1.5 rounded-md text-blue-400 hover:bg-blue-100 transition-colors"
												>
													<Eye size={15} />
												</button>
												<button
													title="Edit"
													onClick={() => openEdit(tx)}
													className="p-1.5 rounded-md text-yellow-500 hover:bg-yellow-100 transition-colors"
												>
													<PencilLine size={15} />
												</button>
												<button
													title="Delete"
													onClick={() => openDelete(tx)}
													className="p-1.5 rounded-md text-red-400 hover:bg-red-100 transition-colors"
												>
													<Trash2 size={15} />
												</button>
											</div>
										</td>
									</tr>
									{/* Expandable detail row */}
									{detailTx?._id === tx._id && (
										<tr key={`${tx._id}-detail`} className="bg-blue-50/60">
											<td colSpan={8} className="px-6 py-3">
												<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
													<div>
														<span className="text-gray-500 font-medium block">
															Date
														</span>
														<span>{moment(tx.date).format('DD MMM YYYY')}</span>
													</div>
													<div>
														<span className="text-gray-500 font-medium block">
															Type
														</span>
														<span
															className={
																tx.credit > 0
																	? 'text-green-600 font-semibold'
																	: 'text-red-500 font-semibold'
															}
														>
															{tx.credit > 0 ? 'Credit' : 'Debit'}
														</span>
													</div>
													<div>
														<span className="text-gray-500 font-medium block">
															Amount
														</span>
														<span>
															₦ {(tx.credit || tx.debit).toLocaleString()}
														</span>
													</div>
													<div>
														<span className="text-gray-500 font-medium block">
															Balance After
														</span>
														<span
															className={
																tx.balance < 0
																	? 'text-red-500'
																	: 'text-gray-800'
															}
														>
															₦ {tx.balance.toLocaleString()}
														</span>
													</div>
													{tx.description && (
														<div className="col-span-2">
															<span className="text-gray-500 font-medium block">
																Description
															</span>
															<span>{tx.description}</span>
														</div>
													)}
													{tx.remark && (
														<div className="col-span-2">
															<span className="text-gray-500 font-medium block">
																Remark
															</span>
															<span>{tx.remark}</span>
														</div>
													)}
												</div>
											</td>
										</tr>
									)}
								</>
							))}
						</tbody>
						{sorted.length > 0 && (
							<tfoot className="border-t-2 border-gray-200 bg-gray-50">
								<tr>
									<td
										colSpan={4}
										className="px-4 py-3 font-semibold text-gray-700"
									>
										Totals
									</td>
									<td className="px-4 py-3 text-right font-semibold text-red-500">
										{sorted.reduce((s, t) => s + t.debit, 0).toLocaleString()}
									</td>
									<td className="px-4 py-3 text-right font-semibold text-green-600">
										{sorted.reduce((s, t) => s + t.credit, 0).toLocaleString()}
									</td>
									<td
										className={`px-4 py-3 text-right font-bold ${
											balance < 0 ? 'text-red-500' : 'text-gray-800'
										}`}
									>
										{balance < 0 ? '-' : ''}
										{Math.abs(balance).toLocaleString()}
									</td>
									<td />
								</tr>
							</tfoot>
						)}
					</table>
				</div>
			</main>

			{/* ── Modals ── */}
			<AdvanceCreditModal
				show={showCredit}
				setShow={setShowCredit}
				customerId={id}
			/>
			<AdvanceDebitModal
				show={showDebit}
				setShow={setShowDebit}
				customerId={id}
			/>
			{selectedTx && (
				<>
					<AdvanceEditModal
						show={showEdit}
						setShow={setShowEdit}
						customerId={id}
						transaction={selectedTx}
					/>
					<AdvanceDeleteModal
						show={showDelete}
						setShow={setShowDelete}
						customerId={id}
						transaction={selectedTx}
					/>
				</>
			)}

			{isLoading && <Loader />}
		</>
	);
};

export default Advance;
