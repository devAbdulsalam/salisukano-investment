import DebtorTable from '../components/DebtorTable.jsx';
import Loader from '../components/Loader.jsx';
import { useContext, useEffect, useRef, useState } from 'react';
import CreditModal from '../components/modals/CreditModal.jsx';
import DebitModal from '../components/modals/DebitModal.jsx';
import DeleteDebitModal from '../components/modals/DeleteDebt.jsx';
import EditDebitModal from '../components/modals/EditDebt.jsx';
import AuthContext from '../context/authContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchDebtor } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { FaMinus, FaPlus } from 'react-icons/fa6';
import { IoMdOptions } from 'react-icons/io';
import { SiMicrosoftexcel } from 'react-icons/si';
import { FiPrinter } from 'react-icons/fi';
import { TbReportMoney } from 'react-icons/tb';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDownloadExcel } from 'react-export-table-to-excel';

const Debtor = () => {
	const [loading, setIsLoading] = useState(false);
	const [isAddModal, setIsAddModal] = useState(false);
	const [isDebitModal, setIsDebitModal] = useState(false);
	const [account, setAccount] = useState();
	const [isEditDebitModal, setIsEditDebitModal] = useState(false);
	const [isDeleteDebitModal, setIsDeleteDebitModal] = useState(false);

	const navigate = useNavigate();
	const { user } = useContext(AuthContext);
	const { id } = useParams();
	const tableRef = useRef(null);

	const { data, isLoading, error } = useQuery({
		queryKey: ['debtors', id],
		queryFn: async () => fetchDebtor({ user, id }),
	});

	const { onDownload } = useDownloadExcel({
		currentTableRef: tableRef.current,
		filename: `${data?.debtor?.name || 'debtor'} transactions`,
		sheet: 'Transactions',
	});

	useEffect(() => {
		if (error) {
			const message = getError(error);
			toast.error(message);
		}
	}, [data, error]);

	const handelEdit = (data) => {
		setIsEditDebitModal(true);
		setAccount(data);
	};
	const handelDelete = (data) => {
		setAccount(data);
		setIsDeleteDebitModal(true);
	};
	const handelPrint = () => {
		if (!data) return;
		navigate(`/debtors/${id}/print`);
	};

	return (
		<>
			{(isLoading || loading) && <Loader />}

			<main className="w-full py-5 px-5 md:px-7 flex flex-col gap-5">

				{/* Breadcrumb + actions */}
				<div className="flex items-center justify-between gap-2 flex-wrap">
					<nav className="flex items-center gap-2 text-sm">
						<Link
							to="/debtors"
							className="font-semibold text-[#212B36] hover:text-blue-600 transition-colors text-base"
						>
							Debtors
						</Link>
						<span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
						<span className="text-blue-600 font-semibold capitalize text-base">
							{data?.debtor?.name || '…'}
						</span>
					</nav>

					<Menu as="div" className="relative">
						<MenuButton className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-[#F4F6F8] hover:bg-blue-50 hover:text-blue-600 transition-colors border border-[#E7E7E7]">
							<IoMdOptions size={16} />
							Options
						</MenuButton>
						<MenuItems
							transition
							className="absolute right-0 z-20 mt-1 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 py-1 focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 transition"
						>
							<MenuItem
								as="button"
								className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
								onClick={() => setIsAddModal(true)}
							>
								<FaPlus className="text-blue-500" size={13} />
								Credit
							</MenuItem>
							<MenuItem
								as="button"
								className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
								onClick={() => setIsDebitModal(true)}
							>
								<FaMinus className="text-red-400" size={13} />
								Debit
							</MenuItem>
							<MenuItem
								as="button"
								className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
								onClick={onDownload}
							>
								<SiMicrosoftexcel className="text-emerald-500" size={14} />
								Export
							</MenuItem>
							<MenuItem
								as="button"
								className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
								onClick={handelPrint}
							>
								<FiPrinter className="text-orange-500" size={14} />
								Print Receipt
							</MenuItem>
						</MenuItems>
					</Menu>
				</div>

				{/* Summary cards */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:max-w-2xl">
					{/* Account balance */}
					<div className="bg-white rounded-2xl border border-[#E7E7E7] p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
						<div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
							<TbReportMoney className="text-red-400" size={24} />
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">
								Account Balance
							</span>
							<span className="text-xl font-bold text-[#212B36]">
								₦{data?.debtor?.balance?.toLocaleString() || '0'}
							</span>
						</div>
					</div>
				</div>

				{/* Transactions table */}
				<DebtorTable
					tableData={data?.debtor?.transactions || []}
					handelEdit={handelEdit}
					handelDelete={handelDelete}
					handelExportToExcel={onDownload}
					tableRef={tableRef}
				/>
			</main>

			<CreditModal
				show={isAddModal}
				setShow={setIsAddModal}
				setLoading={setIsLoading}
				loading={isLoading}
				account={data?.debtor}
			/>
			<DebitModal
				show={isDebitModal}
				setShow={setIsDebitModal}
				setLoading={setIsLoading}
				loading={isLoading}
				account={data?.debtor}
			/>
			<EditDebitModal
				show={isEditDebitModal}
				setShow={setIsEditDebitModal}
				setLoading={setIsLoading}
				loading={isLoading}
				account={account}
				debtorId={data?.debtor?._id}
			/>
			<DeleteDebitModal
				show={isDeleteDebitModal}
				setShow={setIsDeleteDebitModal}
				setLoading={setIsLoading}
				loading={isLoading}
				account={account}
				debtorId={data?.debtor?._id}
			/>
		</>
	);
};

export default Debtor;
