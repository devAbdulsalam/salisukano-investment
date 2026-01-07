import CreditorTable from '../components/CreditTable.jsx';
import Loader from '../components/Loader.jsx';
import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/authContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchCreditor } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa6';
import { IoMdOptions } from 'react-icons/io';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { SiMicrosoftexcel } from 'react-icons/si';
import DepositeModal from '../components/modals/DepositModal.jsx';
import { MdSaveAlt } from 'react-icons/md';
const Creditor = () => {
	const [loading, setIsLoading] = useState(false);
	// const [isAddModal, setIsAddModal] = useState(false);
	const [isDepositModal, setIsDepositModal] = useState(false);
	// const [tableData, setTableDate] = useState([]);
	const { user } = useContext(AuthContext);

	const navigate = useNavigate();
	const { id } = useParams();
	const { data, isLoading, error } = useQuery({
		queryKey: ['creditors', id],
		queryFn: async () => fetchCreditor({ user, id }),
	});
	useEffect(() => {
		// if (data && data.length > 0) {
		if (data) {
			// setBusiness(data);
			// setTableDate(() => );
			console.log('Business companyData Creditors', data?.companyData);
			// navigate('/');
		}
		if (error) {
			console.log(error);
			const message = getError(error);
			toast.error(message);
		}
	}, [data, error]);

	const handleExport = () => {
		console.log('export');
	};
	const formatMonth = (month) => {
if (!month) return '';
// If month is a string, convert to Date
const date = typeof month === 'string' ? new Date(month) : month;
// Check if date is valid
if (isNaN(date.getTime())) return '';
return date.toLocaleDateString();
}

	return (
		<>
			<main className="w-full py-3 pl-7 pr-5 gap-5 flex flex-col space-y-3">
				<div className="flex justify-between">
					<ul className="text-tiny font-medium flex items-center space-x-2 text-text3">
						<li className="breadcrumb-item text-muted">
							<Link
								to={'/creditors'}
								className="font-semibold text-lg hover:text-blue-500"
							>
								{' '}
								Creditors
							</Link>
						</li>
						<li className="breadcrumb-item flex items-center">
							<span className="inline-block bg-blue-500/60 w-[4px] h-[4px] rounded-full"></span>
						</li>
						<li className="breadcrumb-item capitalize text-blue-500 hover:text-blue-500/50 cursor-pointer">
							<Link to={`/creditors/${id}`}>{data?.creditor?.name}</Link>
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
								className="pl-3 py-2 px-2  flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-green-100 font-normal"
								onClick={() => setIsDepositModal(true)}
							>
								<MdSaveAlt className="text-green-500" />
								Deposit
							</MenuItem>
							<MenuItem
								as="button"
								className="pl-3 py-2 px-2 flex w-full justify-start items-center gap-1 rounded text-sm  text-gray-700 hover:bg-green-100 font-normal"
								onClick={handleExport}
							>
								<SiMicrosoftexcel className="text-green-500" />
								Export
							</MenuItem>
						</MenuItems>
					</Menu>
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
							₦ {data?.creditor?.balance?.toLocaleString() || 0}
						</span>
						<img
							src="/assets/admin/dashboard/graph1.svg"
							className="w-10 h-10"
							alt="graph"
						/>
					</div>
				</div>
				<div className=" mb-4 flex flex-col md:flex-row w-full gap-2 ">
					{data?.companyData?.length > 0 &&
						data?.companyData?.map((item, index) => (
							<Link
								to={
									item?.company?._id
										? `./months/${item?.month._id}/${item?.company?._id}`
										: `./months/${item?.month._id}`
								}
								key={index}
								className="p-5 mb-4  bg-white flex flex-col justify-end md:max-w-md w-full rounded-xl gap-2 border border-[#E7E7E7] hover:shadow-xl cursor-pointer"
							>
								{item?.company ? (
									<>
										<div className={`flex justify-between `}>
											<span className="text-[#637381] text-sm font-medium">
												Company:
											</span>
											<div className="flex gap-1 items-center">
												<span className="">{item?.company?.name}</span>
											</div>
										</div>
										<div className={`flex justify-between `}>
											<span className="text-[#637381] text-sm font-medium">
												Phone:
											</span>
											<div className="flex gap-1 items-center">
												<span className="">{item?.company?.phone}</span>
											</div>
										</div>
									</>
								) : (
									<span className="text-red-500">No Company Linked</span>
								)}
								<div
									className={`flex gap-4 justify-between flex-nowrap items-center`}
								>
									<span className="text-lg font-semibold whitespace-nowrap">
										₦ {item.balance?.toLocaleString() || 0}
									</span>
								</div>
								<div className="flex gap-4 justify-between flex-nowrap items-center">
									<span className="text-lg whitespace-nowrap">
										Month: {formatMonth(item?.month?.month)}
									</span>
								</div>
							</Link>
						))}
				</div>
				<CreditorTable
					tableData={data?.monthlyData || []}
					creditorId={data?.creditor?._id}
				/>
			</main>
			<DepositeModal
				show={isDepositModal}
				setShow={setIsDepositModal}
				setLoading={setIsLoading}
				loading={isLoading}
				account={data?.creditor}
			/>

			{isLoading || (loading && <Loader />)}
		</>
	);
};

export default Creditor;
