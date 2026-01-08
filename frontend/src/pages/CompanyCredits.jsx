import CreditorTable from '../components/CreditorTable.jsx';
import Loader from '../components/Loader.jsx';
import { useContext, useEffect, useState, useRef } from 'react';
import AuthContext from '../context/authContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchCompanyMonthlyCredits } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa6';
import { IoMdOptions } from 'react-icons/io';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { cleanCreditorsData } from '../hooks/cleanData.js';
import { SiMicrosoftexcel } from 'react-icons/si';
// import DepositeModal from '../components/modals/DepositeModal.jsx';
import Receipt from '../components/CreditorReceipt.jsx';
import { useDownloadExcel } from 'react-export-table-to-excel';
// import { MdSaveAlt } from 'react-icons/md';
import moment from 'moment';
import { FiPrinter } from 'react-icons/fi';
const Creditor = () => {
	// const [loading, setIsLoading] = useState(false);
	const [isPrintModal, setIsPrintModal] = useState(false);
	const [tableData, setTableDate] = useState([]);
	const { user } = useContext(AuthContext);
	const tableRef = useRef(null);

	const navigate = useNavigate();
	const { id, month, companyId } = useParams();
	const { data, isLoading, error } = useQuery({
		queryKey: ['creditors', id, month, companyId],
		queryFn: async () =>
			fetchCompanyMonthlyCredits({ user, id, month, companyId }),
	});
	useEffect(() => {
		// if (data && data.length > 0) {
		if (data) {
			// setBusiness(data);
			console.log('Business Creditor', data);
			setTableDate(() => cleanCreditorsData(data?.credits));
			// navigate('/');
		}
		if (error) {
			console.log(error);
			const message = getError(error);
			toast.error(message);
		}
	}, [data, error]);

	const { onDownload } = useDownloadExcel({
		currentTableRef: tableRef.current,
		filename: `${data?.creditor?.name} ${moment(
			data?.creditMonth?.month
		).format('MMM YYYY')} transactions`,
		sheet: 'Users',
	});
	const handelPrint = () => {
		if (!data) {
			return;
		}
		setIsPrintModal(true);
	};

	return (
		<>
			<main className="w-full py-3 pl-7 pr-5 gap-5 flex flex-col space-y-3">
				<div>
					<h4 className="font-semibold text-lg text-primary">
						<Link to={'/creditors'} className="hover:text-blue-500">
							{' '}
							Credits
						</Link>
					</h4>
					<div className="flex justify-between">
						<ul className="text-tiny font-medium flex items-center space-x-2 text-text3">
							<li className="breadcrumb-item text-muted capitalize">
								<Link to={`/creditors/${id}`}>{data?.creditor?.name}</Link>
							</li>
							<li className="breadcrumb-item flex items-center">
								<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full"></span>
							</li>
							<li className="breadcrumb-item capitalize text-blue-500 hover:text-blue-500/50 cursor-pointer">
								<Link to={`/creditors/${id}`}>
									{moment(data?.creditMonth?.month).format('MMM YYYY')}
								</Link>
							</li>
						</ul>

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
									onClick={() => navigate(`/creditors/${id}/new-credit`)}
								>
									<FaPlus className="text-blue-500" />
									Credit
								</MenuItem>
								<MenuItem
									as="button"
									className="pl-3 py-2 px-2 flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-green-100 font-normal"
									onClick={onDownload}
								>
									<SiMicrosoftexcel className="text-green-500" />
									Export
								</MenuItem>
								<MenuItem
									as="button"
									className="pl-3 py-2 px-2 flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-orange-100 font-normal"
									onClick={handelPrint}
								>
									<FiPrinter className="text-orange-500" />
									Print Reciept
								</MenuItem>
							</MenuItems>
						</Menu>
					</div>
				</div>
				<div className={`md:flex justify-start gap-2 `}>
					<div className="p-5 mb-4  bg-white flex flex-col md:max-w-md w-full rounded-xl gap-2 border border-[#E7E7E7] hover:shadow-xl cursor-pointer">
						<div className={`flex justify-between `}>
							<span className="text-[#637381] text-sm font-medium">
								{data?.company?.name}
							</span>
						</div>
						<div
							className={`flex gap-4 justify-between flex-nowrap items-center`}
						>
							<span className="text-xl font-bold whitespace-nowrap">
								₦ {data?.totalSupplied || 0}
							</span>
						</div>
					</div>
					<div className="p-5 mb-4  bg-white flex flex-col md:max-w-md w-full rounded-xl gap-2 border border-[#E7E7E7] hover:shadow-xl cursor-pointer">
						<div className={`flex justify-between `}>
							<span className="text-[#637381] text-sm font-medium">
								Total Balance
							</span>
							<div className="flex gap-1 items-center">
								<span className="">100%</span>
								<img src="/assets/admin/dashboard/uparrow.svg" alt="graph" />
							</div>
						</div>
						<div
							className={`flex gap-4 justify-between flex-nowrap items-center`}
						>
							<span className="text-xl font-bold whitespace-nowrap">
								₦ {data?.creditMonth?.balance?.toLocaleString() || 0}
							</span>
							<img
								src="/assets/admin/dashboard/graph1.svg"
								className="w-10 h-10"
								alt="graph"
							/>
						</div>
					</div>
				</div>
				<CreditorTable tableData={tableData || []} tableRef={tableRef} />
			</main>
			<Receipt
				show={isPrintModal}
				setShow={setIsPrintModal}
				title="Creditor's Receipt"
				infoData={data?.creditor}
				tableData={tableData || []}
			/>

			{isLoading && <Loader />}
		</>
	);
};

export default Creditor;
