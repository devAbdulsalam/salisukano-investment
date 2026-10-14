/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa6';
// import { formatPrice } from '../hooks/formatPrice';
import { formatDateWat } from '../utils/watDate';
import { useEffect, useState } from 'react';

const RecentTransactions = ({ orderTableData, handelAddModal }) => {
	const navigate = useNavigate();
	const [tableData, setTableData] = useState(orderTableData);
	useEffect(() => {
		setTableData(orderTableData);
	}, [orderTableData]);

	const handelClick = (item) => {
		navigate(`/transactions/${item}`);
	};
	return (
		<div className="w-full p-3 bg-white flex flex-col col-span-12 rounded-xl border border-[#E7E7E7] lg:row-start-4">
			<div className="flex items-center justify-between flex-wrap gap-1">
				<span className="text-[#212B36] text-base font-semibold -tracking-[0.15px] whitespace-nowrap">
					Recent Transactions
				</span>
				<div className="flex gap-2 items-center justify-center mt-">
					<button
						className="py-2.5 px-2 border border-[#E7E7E7] flex
					justify-center items-center gap-1 rounded text-sm text-white bg-blue-500 hover:bg-blue-700
					font-normal"
						onClick={handelAddModal}
					>
						Add <FaPlus className="text-white" />
					</button>
				</div>
			</div>
			<div className="w-full overflow-x-scroll md:overflow-auto max-w-xl xs:max-w-xl sm:max-w-xl md:max-w-7xl 2xl:max-w-none mt-1">
				<table className="table-auto overflow-scroll md:overflow-auto w-full text-left font-inter border-separate border-spacing-y-1">
					<thead className="bg-[#222E3A]/[6%] rounded-lg text-base text-white font-semibold w-full">
						<tr className="">
							<th className="py-3 pl-3 text-[#212B36] text-sm font-normal whitespace-nowrap rounded-l-lg">
								Date
							</th>

							<th className="py-3 pl-1 text-[#212B36] text-sm font-normal whitespace-nowrap">
								Customer
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap">
								Vehicle
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap">
								Quantity (kg)
							</th>
							<th className="py-3 px-2.5 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								Credit ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								Debit ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								Balance ₦
							</th>
						</tr>
					</thead>
					<tbody>
						{tableData?.map((data) => (
							<tr
								key={data._id}
								onClick={() => handelClick(data._id)}
								className="drop-shadow-[0_0_10px_rgba(34,46,58,0.02)] bg-[#f6f8fa] hover:shadow-2xl cursor-pointer"
							>
								<td className="py-2 pl-3 text-sm font-normal text-[#637381] rounded-l-lg whitespace-nowrap">
									{formatDateWat(data?.date || data?.createdAt, 'PP')}
								</td>
								<td className="py-2 px-1 text-sm font-normal text-[#637381] uppercase whitespace-nowrap bg-gray-50">
									{data?.name}
								</td>
								<td className="py-2 px-1 text-sm font-normal text-[#637381] whitespace-nowrap">
									{data?.vehicleNumber?.slice(0, 15)}
								</td>
								<td className="py-2 px-1 text-sm font-normal text-[#637381] whitespace-nowrap">
									{data?.quantity || ''}
								</td>
								<td className="py-2 px-1 text-sm font-normal text-[#4F80E1] whitespace-nowrap bg-gray-50 max-w-fit">
									{data?.credit || ''}
								</td>
								<td className="py-2 px-1 text-sm font-normal text-[#FB4949]  whitespace-nowrap max-w-fit">
									{data?.debit || ''}
								</td>
								<td className="py-2 px-1 text-sm font-normal text-[#10B860] whitespace-nowrap max-w-fit">
									{data?.balance || ''}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
export default RecentTransactions;
