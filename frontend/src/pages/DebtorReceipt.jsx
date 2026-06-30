/* eslint-disable react/prop-types */
import { useEffect, useState, useContext } from 'react';
import logo from '../assets/logo.jpg';
import { downloadPDF, generateRandomNumber } from '../hooks/downLoadPdf';
import { fetchDebtor } from '../hooks/axiosApis';
import getError from '../hooks/getError';
import toast from 'react-hot-toast';
import AuthContext from '../context/authContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';

const Receipt = () => {
	const [infoData, setInfoData] = useState(null);
	const [tableData, setTableData] = useState([]);
	const navigate = useNavigate();
	const [InvoiceDate, setInvoiceDate] = useState('');
	const invoiceNumber = generateRandomNumber();
	const { user } = useContext(AuthContext);
	const { id } = useParams();
	const { data, isLoading, error } = useQuery({
		queryKey: ['debtors', id],
		queryFn: async () => fetchDebtor({ user, id }),
	});
	const title = "Debtor's Ledger";
	useEffect(() => {
		// if (data && data.length > 0) {
		if (data) {
			console.log(data);
			console.log('Business debtor', data?.debtor);
			setInfoData(data?.debtor?.debtor);
			setInvoiceDate(data?.debtor?.createdAt);
			setTableData(data?.debtor?.transactions);
		}
		if (error) {
			console.log(error);
			const message = getError(error);
			toast.error(message);
		}
	}, [data, error]);

	const handelPrint = async () => {
		await downloadPDF('receipt');
	};

	return (
		<div>
			{isLoading ? (
				<Loader />
			) : (
				<>
					<div
						id="receipt"
						className="w-full md:max-w-3xl bg-white mx-auto rounded-md mt-4 p-2 md:p-6 lg:p-10 xl:p-14"
					>
						<div className="w-full p-2 sm:p-0 bg-white mx-auto rounded-md text-xs">
							<div className="w-full text-black">
								<div className="w-full sm:flex justify-between">
									<div>
										<div>
											<img
												src={logo}
												className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl"
												alt=""
											/>
										</div>
										<div className="mt-3 space-y-3">
											<h2 className="text-xs sm:text-sm font-bold uppercase">
												Salisu Kano International Limited
											</h2>
											<p className="text-xs sm:text-sm font-normal text-[#637381]">
												Block P5, No.: 1-3 Dalar Gyada Market.
											</p>
											<p className="text-xs sm:text-sm font-normal text-[#637381]">
												Opp. Hajj Camp. Traffic 🚥 By IBB Way,
											</p>
											<p className="text-xs sm:text-sm font-normal text-[#637381]">
												Kano State - Nigeria.
											</p>
										</div>
									</div>
									<div className="">
										<h2 className="font-bold text-right mt-2">{title}</h2>
									</div>
								</div>
								<div className="sm:flex justify-between mt-6 w-full">
									<div className="space-y-3">
										<p className="text-sm font-bold ">Bill To</p>
										<p className="text-sm uppercase font-normal text-[#637381]">
											{infoData?.name}
										</p>
										<p className="text-sm font-normal text-[#637381]">
											{infoData?.phone}
										</p>
									</div>
									<div className="space-y-3">
										<p className="text-sm font-bold ">
											Invoice No: {invoiceNumber}
										</p>
										{InvoiceDate && (
											<p className="text-sm font-normal text-[#637381]">
												From:{InvoiceDate?.toLocaleDateString()}
											</p>
										)}
										<p className="text-sm font-normal text-[#637381]">
											Date: {new Date().toLocaleDateString()}
										</p>
									</div>
								</div>
							</div>
							<div className="w-full mt-6 md:mt-10">
								<table className="table-auto overflow-scroll md:overflow-auto w-full text-left font-inter border-separate border-spacing-y-1">
									<thead className="sm:p-3 ">
										<tr className="bg-[#222E3A]/[15%] text-[#212B36] rounded-none ">
											<th
												className="text-sm font-normal whitespace-nowrap py-2 px-2 rounded-none"
												style={{ borderRadius: 'none' }}
											>
												Date
											</th>
											<th className="p-3 text-sm font-normal whitespace-nowrap">
												Description
											</th>
											<th className="p-3 text-sm font-normal whitespace-nowrap">
												₦ Credit
											</th>
											<th className="p-3 text-sm font-normal whitespace-nowrap">
												₦ Debit
											</th>
											<th className="p-3 text-sm font-normal whitespace-nowrap">
												₦ Balance
											</th>
										</tr>
									</thead>
									<tbody>
										{tableData && tableData?.length > 0
											? tableData?.map((item, index) => (
													<tr key={index} className="">
														<td className="py-2 px-2 text-sm font-normal text-[#637381] whitespace-nowrap border">
															{new Date(item.date).toLocaleDateString()}
														</td>
														<td className="py-2 px-2 text-sm font-normal text-[#637381] whitespace-nowrap border">
															{item.description?.substr(0, 10)}
														</td>
														<td
															className={`py-2 px-2 text-sm font-normal text-[#637381] whitespace-nowrap border`}
														>
															{item?.credit}
														</td>
														<td
															className={`py-2 px-2 text-sm font-normal text-[#637381] whitespace-nowrap border text-center`}
														>
															{' '}
															{item?.debit}
														</td>
														<td className="whitespace-nowrap border p-3">
															{item.balance}
														</td>
													</tr>
												))
											: ''}
									</tbody>
								</table>
							</div>
							<div>
								<div className="flex  justify-end">
									<div className="mt-6">
										<p className="text-sm font-bold bg-[#cccfd1] text-black p-1 px-2">
											Debit Balance: ₦{infoData?.balance}
										</p>
									</div>
								</div>
								<div className="mt-6">
									<h2 className="font-bold text-sm py-2">Notes</h2>
									<p className="font-normal text-sm  text-[#637381]">
										It was great doing business with you.
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className="flex justify-center gap-3 mt-6 border-t-2 border-neutral-200 p-2 md:p-6">
						<button
							onClick={() => navigate(`/debtors/${id}`)}
							className="text-sm font-bold text-white bg-red-500 px-6 pb-2 pt-2.5  rounded-md hover:bg-red-400"
						>
							Cancel
						</button>
						<button
							onClick={handelPrint}
							className=" font-bold text-white bg-blue-500 px-6 pb-2 pt-2.5 text-xs rounded-md hover:bg-blue-400"
						>
							Print
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export default Receipt;
