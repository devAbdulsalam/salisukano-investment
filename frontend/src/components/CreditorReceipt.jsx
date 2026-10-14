/* eslint-disable react/prop-types */
import logo from '../assets/logo.jpg';
import Modal from './modals/Modal';
import formatDate from '../hooks/formatDate';
import { downloadPDF, generateRandomNumber } from '../hooks/downLoadPdf';
import { nowWat } from '../utils/watDate';

const Receipt = ({
	tableData,
	show,
	setShow,
	title,
	infoData,
	InvoiceDate,
}) => {
	const invoiceNumber = generateRandomNumber();
	const totalCredit = tableData?.reduce(
		(total, item) => total + item.credit,
		0
	);
	const totalDebit = tableData?.reduce((total, item) => total + item.debit, 0);
	// console.log('totalDebit', totalDebit);
	// console.log('totalCredit', totalCredit);
	const handelPrint = async () => {
		await downloadPDF('receipt');
	};
	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin w-full md:min-w-[650px]">
				<div
					id="receipt"
					className="w-full  bg-white mx-auto rounded-md mt-4 p-2 md:p-6 lg:p-10 xl:p-14  text-xs"
				>
					<div className="w-full bg-white mx-auto rounded-md">
						<div className="w-full text-black">
							<div className="w-full sm:flex justify-between">
								<div>
									<div>
										<img src={logo} className="w-24 h-24 rounded-xl" alt="" />
									</div>
									<div className="mt-3 space-y-3">
										<h2 className="text-center text-xs md:text-sm font-bold uppercase">
											Salisu Kano International Limited
										</h2>
										<p className="text-xs md:text-sm font-normal text-[#637381]">
											Block P5, No.: 1-3 Dalar Gyada Market.
										</p>
										<p className="text-xs md:text-sm font-normal text-[#637381]">
											Opp. Hajj Camp. Traffic 🚥 By IBB Way,
										</p>
										<p className="text-xs md:text-sm font-normal text-[#637381]">
											Kano State - Nigeria.
										</p>
									</div>
								</div>
								<div>
									<h2 className="font-bold text-center sm:text-left">
										{title}
									</h2>
								</div>
							</div>
							<div className="sm:flex justify-between mt-6 w-full">
								<div className="space-y-3">
									<p className="text-xs md:text-sm font-bold ">Bill To</p>
									<p className="text-xs md:text-sm uppercase font-normal text-[#637381]">
										{infoData?.name}
									</p>
									<p className="text-xs md:text-sm font-normal text-[#637381]">
										{infoData?.phone}
									</p>
								</div>
								<div className="space-y-3">
									<p className="text-xs md:text-sm font-bold ">
										Invoice No: {invoiceNumber}
									</p>
									{InvoiceDate && (
										<p className="text-xs md:text-sm font-normal text-[#637381]">
											From:{InvoiceDate}{' '}
										</p>
									)}
									<p className="text-xs md:text-sm font-normal text-[#637381]">
										Date: {nowWat('PP')}
									</p>
								</div>
							</div>
						</div>
						<div className="w-full mt-6 md:mt-10">
							<table className="table-auto overflow-scroll md:overflow-auto w-full text-left font-inter border-collapse border-spacing-y-1">
								<thead className="p-3 ">
									<tr className="bg-[#222E3A]/[15%] text-[#212B36] rounded-none ">
										<th
											className="text-xs md:text-sm font-normal whitespace-nowrap py-2 px-2 rounded-none"
											style={{ borderRadius: 'none' }}
										>
											Date
										</th>
										<th className="p-3 text-xs md:text-sm font-normal whitespace-nowrap">
											Description
										</th>
										<th className="p-3 text-xs md:text-sm font-normal whitespace-nowrap">
											₦ Credit
										</th>
										<th className="p-3 text-xs md:text-sm font-normal whitespace-nowrap">
											₦ Debit
										</th>
										<th className="p-3 text-xs md:text-sm font-normal whitespace-nowrap">
											₦ Balance
										</th>
									</tr>
								</thead>
								<tbody className="">
									{tableData && tableData.length > 0
										? tableData.map((item, index) => (
												<tr key={index} className="">
													<td className="py-2 px-2 text-xs md:text-sm font-normal text-[#637381] whitespace-nowrap border">
														{formatDate(item?.date || item?.createdAt)}
													</td>
													<td className="py-2 px-2 text-xs md:text-sm font-normal text-[#637381] whitespace-nowrap border">
														{item.vehicleNumber}
													</td>
													<td
														className={`py-2 px-2 text-xs md:text-sm font-normal  whitespace-nowrap text-center border`}
													>
														{' '}
														{item?.credit || item?.debit}
													</td>
													<td
														className={`py-2 px-2 text-xs md:text-sm font-normal  whitespace-nowrap text-center border`}
													>
														{item?.debit}
													</td>
													<td className="whitespace-nowrap p-3 border">
														{item.balance.toLocaleString() || 0}
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
									<p className="text-xs md:text-sm font-bold bg-[#cccfd1] text-black p-1 pb-2 px-2">
										Credit Balance: ₦{infoData?.balance.toLocaleString() || 0}
									</p>
								</div>
							</div>
							<div className="mt-6">
								<h2 className="font-bold text-xs md:text-sm py-2">Notes</h2>
								<p className="font-normal text-xs md:text-sm  text-[#637381]">
									It was great doing business with you.
								</p>
							</div>
						</div>
					</div>
				</div>
				<div className="flex justify-center gap-3 mt-6 border-t-2 border-neutral-200 p-2 md:p-6">
					<button
						onClick={() => setShow(false)}
						className="text-xs md:text-sm font-bold text-white bg-red-500 px-6 pb-2 pt-2.5  rounded-md hover:bg-red-400"
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
			</div>
		</Modal>
	);
};

export default Receipt;
