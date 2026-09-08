import DebtorsTable from '../components/DebtorsTable.jsx';
import Loader from '../components/Loader.jsx';
import { useContext, useEffect, useRef, useState } from 'react';
import AddDebtorModal from '../components/modals/AddDebtorModal.jsx';
import EditModal from '../components/modals/EditDebtor.jsx';
import AuthContext from '../context/authContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchDebtors } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { useDownloadExcel } from 'react-export-table-to-excel';
import { TbReportMoney } from 'react-icons/tb';
import { FiUsers } from 'react-icons/fi';

const Debtors = () => {
	const [loading, setIsLoading] = useState(false);
	const [isAddModal, setIsAddModal] = useState(false);
	const [isEditModal, setIsEditModal] = useState(false);
	const [debtor, setDebtor] = useState(false);
	const [total, setTotal] = useState(0);
	const { user } = useContext(AuthContext);
	const tableRef = useRef(null);

	const { data, isLoading, error } = useQuery({
		queryKey: ['debtors'],
		queryFn: async () => fetchDebtors(user),
	});

	const { onDownload } = useDownloadExcel({
		currentTableRef: tableRef.current,
		filename: 'all debtors transactions',
		sheet: 'Users',
	});

	useEffect(() => {
		if (data?.length > 0) {
			const totalBalance = data.reduce((sum, item) => sum + item.balance, 0);
			setTotal(totalBalance);
		}
		if (error) {
			const message = getError(error);
			toast.error(message);
		}
	}, [data, error]);

	const handelAddModal = () => setIsAddModal(true);
	const handelEdit = (data) => {
		setDebtor(data);
		setIsEditModal(true);
	};

	return (
		<>
			<main className="w-full py-5 px-5 md:px-7 flex flex-col gap-5">
				{/* Page title */}
				<div className="flex items-center justify-between">
					<h4 className="font-bold text-xl text-[#212B36]">Debtors</h4>
				</div>

				{/* Summary cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:max-w-2xl">
					{/* Total balance */}
					<div className="bg-white rounded-2xl border border-[#E7E7E7] p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
						<div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
							<TbReportMoney className="text-red-400" size={24} />
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">
								Total Balance
							</span>
							<span className="text-xl font-bold text-[#212B36]">
								₦{total?.toLocaleString() || '0'}
							</span>
						</div>
					</div>

					{/* Total debtors */}
					<div className="bg-white rounded-2xl border border-[#E7E7E7] p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
						<div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
							<FiUsers className="text-blue-500" size={22} />
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">
								Total Debtors
							</span>
							<span className="text-xl font-bold text-[#212B36]">
								{data?.length || 0}
							</span>
						</div>
					</div>
				</div>

				{/* Table */}
				<DebtorsTable
					tableData={data || []}
					handelAddModal={handelAddModal}
					handelEdit={handelEdit}
					tableRef={tableRef}
					handelExportToExcel={onDownload}
				/>
			</main>

			<AddDebtorModal
				show={isAddModal}
				setShow={setIsAddModal}
				setLoading={setIsLoading}
				loading={isLoading}
			/>
			<EditModal
				show={isEditModal}
				setShow={setIsEditModal}
				setLoading={setIsLoading}
				loading={isLoading}
				debtor={debtor}
			/>
			{(isLoading || loading) && <Loader />}
		</>
	);
};

export default Debtors;
