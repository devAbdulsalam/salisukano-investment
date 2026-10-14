import Cards from '../components/TransactionCard.jsx';
import Loader from '../components/Loader.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import { useContext, useEffect, useState, useRef } from 'react';
import AddModal from '../components/modals/AddAccountModal.jsx';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/authContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactions } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { exportToExcel } from '../components/ExportToExcel';
import { cleanTableData } from '../hooks/cleanData';
import { formatMonthYearWat } from '../utils/watDate';
import { FaPlus } from 'react-icons/fa6';
// import { useDownloadExcel } from 'react-export-table-to-excel';

const Transaction = () => {
	const [loading, setIsLoading] = useState(false);
	const [isAddModal, setIsAddModal] = useState(false);
	const { user } = useContext(AuthContext);
	const navigate = useNavigate();
	const [tableData, setTableData] = useState([]);
	const { data, isLoading, error } = useQuery({
		queryKey: ['transactions'],
		queryFn: async () => fetchTransactions(user),
	});
	const [month, setMonth] = useState('');
	useEffect(() => {
		if (data) {
			// Month label is derived in WAT so it stays correct on any device.
			setMonth(formatMonthYearWat(data?.account?.month));
			// setBusiness(data);
			console.log(data);
			setTableData(cleanTableData(data?.transactions));
			// navigate('/');
		}
		if (error) {
			console.log(error);
			const message = getError(error);
			toast.error(message);
		}
	}, [data, error]);
	const handelAddModal = () => {
		navigate(`/add-supply/${data?.account?._id}`);
	};
	const tableRef = useRef(null);

	// const { onDownload } = useDownloadExcel({
	// 	currentTableRef: tableRef.current,
	// 	filename: `${month} transactions`,
	// 	sheet: 'Users',
	// });
	const handelExportToExcel = async () => {
		// const dataToExport =
		// 	(await formatDataForExcel(data?.transactions)) || data?.transactions;
		// console.log('handelExportToExcel', dataToExport);
		exportToExcel(tableData, `${month} transactions`);
	};
	return (
		<>
			<main className="w-full py-3 pl-7 pr-5 gap-5 flex flex-col space-y-3">
				<div className="flex justify-between items-center">
					<div>
						<ul className="text-tiny font-medium flex items-center space-x-2 text-text3">
							<li className="breadcrumb-item text-muted">
								<Link to={'/transactions'} className="hover:text-blue-500">
									Transactions
								</Link>
							</li>
							<li className="breadcrumb-item flex items-center">
								<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full"></span>
							</li>
							<li className="breadcrumb-item text-blue-500/60 hover:text-blue-500 cursor-pointer">
								{month}
							</li>
						</ul>
					</div>
					<button
						className="pl-3 py-2 px-2 border border-[#E7E7E7] flex
					justify-center items-center gap-1 rounded text-sm text-white bg-blue-500 hover:bg-blue-700
					font-normal"
						onClick={handelAddModal}
					>
						New <FaPlus className="text-white" />
					</button>
				</div>
				<Cards data={data} />
				<TransactionTable
					data={tableData || []}
					isLoading={isLoading}
					handelExportToExcel={handelExportToExcel}
					tableRef={tableRef}
					pageSize={tableData?.length + 1}
				/>
			</main>
			<AddModal
				show={isAddModal}
				setShow={setIsAddModal}
				setIsLoading={setIsLoading}
				isLoading={isLoading}
			/>
			{isLoading || (loading && <Loader />)}
		</>
	);
};

export default Transaction;
