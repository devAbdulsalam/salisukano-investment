import CreditTable from '../components/CreditTable.jsx';
import CompanyTable from '../components/CompanyTable.jsx';
import Loader from '../components/Loader.jsx';
import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/authContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { fetchCreditor } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa6';
import { MdSaveAlt } from 'react-icons/md';
import { SiMicrosoftexcel } from 'react-icons/si';
import { TbReportMoney } from 'react-icons/tb';
import { IoMdOptions } from 'react-icons/io';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import DepositeModal from '../components/modals/DepositModal.jsx';

const Creditor = () => {
	const [loading, setIsLoading] = useState(false);
	const [isDepositModal, setIsDepositModal] = useState(false);
	const [activeTab, setActiveTab] = useState('monthly');
	const { user } = useContext(AuthContext);
	const navigate = useNavigate();
	const { id } = useParams();

	const { data, isLoading, error } = useQuery({
		queryKey: ['creditors', id],
		queryFn: async () => fetchCreditor({ user, id }),
	});

	useEffect(() => {
		if (error) {
			const message = getError(error);
			toast.error(message);
		}
	}, [data, error]);

	const handleExport = () => {
		console.log('export');
	};

	return (
		<>
			<main className="w-full py-5 px-5 md:px-7 flex flex-col gap-5">

				{/* Breadcrumb + actions row */}
				<div className="flex items-center justify-between gap-2 flex-wrap">
					<nav className="flex items-center gap-2 text-sm">
						<Link
							to="/creditors"
							className="font-semibold text-[#212B36] hover:text-blue-600 transition-colors text-base"
						>
							Creditors
						</Link>
						<span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
						<span className="text-blue-600 font-semibold capitalize text-base">
							{data?.creditor?.name || '…'}
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
								onClick={() => navigate(`/creditors/${id}/new-credit`)}
							>
								<FaPlus className="text-blue-500" size={13} />
								Supply
							</MenuItem>
							<MenuItem
								as="button"
								className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
								onClick={() => setIsDepositModal(true)}
							>
								<MdSaveAlt className="text-emerald-500" size={15} />
								Payment
							</MenuItem>
							<MenuItem
								as="button"
								className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
								onClick={handleExport}
							>
								<SiMicrosoftexcel className="text-emerald-500" size={14} />
								Export
							</MenuItem>
						</MenuItems>
					</Menu>
				</div>

				{/* Balance card */}
				<div className="bg-white rounded-2xl border border-[#E7E7E7] p-5 flex items-center gap-4 md:max-w-sm shadow-sm hover:shadow-md transition-shadow">
					<div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
						<TbReportMoney className="text-emerald-500" size={24} />
					</div>
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">
							Total Balance
						</span>
						<span className="text-xl font-bold text-[#212B36]">
							₦{data?.creditor?.balance?.toLocaleString() || '0'}
						</span>
					</div>
				</div>

				{/* Tab switcher */}
				<div className="flex items-center gap-1 bg-[#F4F6F8] p-1 rounded-xl w-fit border border-[#E7E7E7]">
					<button
						onClick={() => setActiveTab('monthly')}
						className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
							activeTab === 'monthly'
								? 'bg-white text-blue-600 shadow-sm border border-[#E7E7E7]'
								: 'text-[#637381] hover:text-[#212B36]'
						}`}
					>
						Monthly
					</button>
					<button
						onClick={() => setActiveTab('company')}
						className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
							activeTab === 'company'
								? 'bg-white text-blue-600 shadow-sm border border-[#E7E7E7]'
								: 'text-[#637381] hover:text-[#212B36]'
						}`}
					>
						By Company
					</button>
				</div>

				{/* Monthly tab */}
				{activeTab === 'monthly' && (
					<CreditTable
						tableData={data?.monthlyData || []}
						creditorId={data?.creditor?._id}
					/>
				)}

				{/* By Company tab */}
				{activeTab === 'company' && (
					<CompanyTable tableData={data?.companyData || []} />
				)}
			</main>

			<DepositeModal
				show={isDepositModal}
				setShow={setIsDepositModal}
				setLoading={setIsLoading}
				loading={isLoading}
				account={data?.creditor}
			/>

			{(isLoading || loading) && <Loader />}
		</>
	);
};

export default Creditor;
