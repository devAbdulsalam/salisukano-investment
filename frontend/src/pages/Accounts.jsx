import AccountsTable from '../components/AccountsTable.jsx';
import Cards from '../components/AccountCard.jsx';
import Loader from '../components/Loader.jsx';
import { useContext, useEffect, useRef, useState } from 'react';
import AddAccountModal from '../components/modals/AddAccountModal.jsx';
import AccountStatusModal from '../components/modals/AccountStatusModal.jsx';
import AuthContext from '../context/authContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchCustomer } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa6';
import { IoMdOptions } from 'react-icons/io';
import { useDownloadExcel } from 'react-export-table-to-excel';
import { TbCurrencyNaira } from 'react-icons/tb';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChartSpline, Wallet } from 'lucide-react';

const Transaction = () => {
	const [loading, setIsLoading] = useState(false);
	const [isAddModal, setIsAddModal] = useState(false);
	const [isStatusModal, setIsStatusModal] = useState(false);
	const [selectedAccount, setSelectedAccount] = useState(null);
	const { user } = useContext(AuthContext);
	const { id } = useParams();
	const navigate = useNavigate();
	const tableRef = useRef(null);
	const { data, isLoading, error } = useQuery({
		queryKey: ['customers', 'accounts', id],
		queryFn: async () => fetchCustomer({ token: user.token, id }),
	});
	useEffect(() => {
		// if (data && data.length > 0) {
		if (data) {
			// setBusiness(data);
			console.log(data);
			// navigate('/');
		}
		if (error) {
			console.log(error);
			const message = getError(error);
			toast.error(message);
		}
	}, [data, error]);
	const handelAddModal = () => {
		setIsAddModal(true);
	};
	const handelChangeActive = async (data) => {
		setSelectedAccount(data);
		setIsStatusModal(true);
	};

	const { onDownload } = useDownloadExcel({
		currentTableRef: tableRef.current,
		filename: `${data?.customer?.name} transactions`,
		sheet: 'Users',
	});

	return (
		<>
			<main className="w-full py-3 pl-7 pr-5 gap-5 flex flex-col space-y-3">
				<div className="flex justify-between items-center">
					<div>
						<h4 className="font-semibold text-lg text-primary">Accounts</h4>
						<ul className="text-tiny font-medium flex items-center space-x-2 text-text3">
							<li className="breadcrumb-item text-muted">
								<Link to={'/companies'} className="hover:text-blue-500">
									Companies
								</Link>
							</li>
							<li className="breadcrumb-item flex items-center">
								<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full"></span>
							</li>
							<li className="breadcrumb-item capitalize text-blue-500 hover:text-blue-500/50 cursor-pointer">
								<Link to={`/companies/${id}`}>{data?.customer?.name}</Link>
							</li>
						</ul>
					</div>
					<Menu as="div" className="relative ml-1">
						<div>
							<MenuButton className="pl-3 py-2 px-2  flex w-full justify-start items-center gap-1 rounded text-sm  text-white bg-blue-500 hover:bg-blue-400 font-normal">
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
								onClick={handelAddModal}
							>
								<FaPlus />
								New Account
							</MenuItem>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2  flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-blue-100 font-normal"
								onClick={() => navigate(`/pricing/${id}`)}
							>
								<TbCurrencyNaira className="text-lg" /> Pricing
							</MenuItem>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2  flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-blue-100 font-normal"
								onClick={() => navigate(`/advance/${id}`)}
							>
								<ChartSpline className="text-md" /> Advance Account
							</MenuItem>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2  flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-blue-100 font-normal"
								onClick={() => navigate(`/analysis/${id}`)}
							>
								<ChartSpline className="text-md" /> Analysis
							</MenuItem>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2  flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-blue-100 font-normal"
								onClick={() => navigate(`/advance/${id}`)}
							>
								<Wallet className="text-md" /> Advance Account
							</MenuItem>
						</MenuItems>
					</Menu>
				</div>
				<Cards data={data} />
				<AccountsTable
					tableData={data?.accounts}
					handelChangeActive={handelChangeActive}
					handelExportToExcel={onDownload}
					tableRef={tableRef}
				/>
			</main>
			<AddAccountModal
				show={isAddModal}
				setShow={setIsAddModal}
				setLoading={setIsLoading}
				loading={isLoading}
			/>
			<AccountStatusModal
				show={isStatusModal}
				setShow={setIsStatusModal}
				setLoading={setIsLoading}
				loading={isLoading}
				account={selectedAccount}
			/>

			{isLoading || (loading && <Loader />)}
		</>
	);
};

export default Transaction;
