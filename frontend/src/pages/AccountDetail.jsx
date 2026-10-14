import TransactionTable from '../components/TransactionTable.jsx';
import Cards from '../components/AccountDetailCard.jsx';
import Loader from '../components/Loader.jsx';
import { useContext, useEffect, useState, useRef } from 'react';
import AddModal from '../components/modals/AddAccountModal.jsx';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../context/authContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchAccount } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { FaMinus, FaPlus } from 'react-icons/fa6';
import moment from 'moment';
import OpeningBalanceModal from '../components/modals/OpeningBalance.jsx';
import { cleanTableData } from '../hooks/cleanData';
import { IoMdOptions } from 'react-icons/io';
import { TfiTruck } from 'react-icons/tfi';
import { GiReceiveMoney } from 'react-icons/gi';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useDownloadExcel } from 'react-export-table-to-excel';
import { FiPercent } from 'react-icons/fi';

const Transaction = () => {
	const [loading, setIsLoading] = useState(false);
	const [isAddModal, setIsAddModal] = useState(false);
	const [isBalanceModal, setIsBalanceModal] = useState(false);
	const [tableData, setTableData] = useState([]);
	const [pageSize, setPageSize] = useState(20);
	const { user } = useContext(AuthContext);
	const navigate = useNavigate();
	// const queryClient = useQueryClient();
	const tableRef = useRef(null);

	const { id } = useParams();
	// console.log('user accounts', user);
	const { data, isLoading, error } = useQuery({
		queryKey: ['transactions', id],
		queryFn: async () => fetchAccount({ token: user?.token, id }),
	});
	useEffect(() => {
		// if (data && data.length > 0) {
		if (data) {
			console.log(data?.commission);
			console.log(
				'transaction data',
				Number(data?.account?.balance || 0) + Number(data?.commission?.balance)
			);
			setTableData(() => cleanTableData(data?.transactions));
			console.log(data?.transactions?.length || 20);
			setPageSize(data?.transactions?.length || 20);
		}
		if (error) {
			console.log(error);
			const message = getError(error);
			toast.error(message);
		}
	}, [data, error]);
	const handelSupply = () => {
		navigate(`/add-supply/${id}`);
	};
	const handelPayment = () => {
		navigate(`/payment/new/${id}`);
	};
	const handelSuppliers = () => {
		navigate(`/supplies/${id}`);
	};
	const handleOpeningBalance = () => {
		setIsBalanceModal(true);
	};
	const { onDownload } = useDownloadExcel({
		currentTableRef: tableRef.current,
		filename: `${data?.customer?.name} ${moment(data?.account?.month).format(
			'MMM YYYY'
		)} transactions`,
		sheet: 'Users',
	});
	return (
		<>
			<main className="w-full py-3 pl-7 pr-5 gap-5 flex flex-col space-y-3">
				<div className="flex justify-between">
					<div>
						<h4 className="font-semibold text-lg text-primary">Transactions</h4>
						<ul className="text-tiny font-medium flex items-center space-x-2 text-text3">
							<li className="breadcrumb-item text-muted">
								<Link
									className="text-blue-500/60 hover:text-blue-500"
									to={`/companies/${data?.account?.customerId}`}
								>
									Accounts
								</Link>
							</li>
							<li className="breadcrumb-item flex items-center">
								<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full"></span>
							</li>
							<li className="breadcrumb-item hover:text-blue-500/60 text-blue-500 cursor-pointer">
								<Link to={`/accounts/${id}`}>
									{moment(data?.account?.month).format('ll')}
								</Link>
							</li>
						</ul>
					</div>
					<Menu as="div" className="relative ml-1">
						<div>
							<MenuButton className="pl-3 py-2 px-2  flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 bg-blue-100 hover:bg-blue-200 font-normal">
								<IoMdOptions />
							</MenuButton>
						</div>
						<MenuItems
							transition
							className="absolute right-0 z-10 mt-0 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
						>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2  flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-blue-100 font-normal"
								onClick={handelSupply}
							>
								<FaPlus />
								New Supply
							</MenuItem>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2 flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-red-100 font-normal"
								onClick={handelPayment}
							>
								<FaMinus />
								New Payment
							</MenuItem>

							<MenuItem
								as="button"
								className="pl-3 py-2 px-2 flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-yellow-100 font-normal"
								onClick={() => navigate(`/commission/${id}`)}
							>
								<FiPercent /> Commission
							</MenuItem>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2 flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-green-100 font-normal"
								onClick={handelSuppliers}
							>
								<TfiTruck /> Supplies
							</MenuItem>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2  flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-blue-100 font-normal"
								onClick={() => navigate(`/payments/${id}`)}
							>
								<GiReceiveMoney className="" /> Payments
							</MenuItem>
						</MenuItems>
					</Menu>
				</div>
				<Cards
					balance={
						data?.commission?.balance != 0
							? (data?.account?.balance?.toLocaleString() || 0) +
								data?.commission?.balance?.toLocaleString()
							: data?.account?.balance?.toLocaleString() || 0
					}
					credit={data?.account?.credit?.toLocaleString() || 0}
					debit={data?.account?.debit?.toLocaleString() || 0}
					openingBalance={data?.account?.openingBalance?.toLocaleString() || 0}
					handleOpeningBalance={handleOpeningBalance}
				/>
				<TransactionTable
					data={tableData || []}
					pageSize={pageSize}
					isLoading={isLoading}
					handelExportToExcel={onDownload}
					tableRef={tableRef}
				/>
			</main>

			<AddModal
				show={isAddModal}
				setShow={setIsAddModal}
				setIsLoading={setIsLoading}
				isLoading={isLoading}
			/>
			<OpeningBalanceModal
				show={isBalanceModal}
				setShow={setIsBalanceModal}
				setLoading={setIsLoading}
				loading={isLoading}
				account={data?.account}
				openbal={data?.account?.openingBalance || 0}
			/>
			{isLoading || (loading && <Loader />)}
		</>
	);
};

export default Transaction;
