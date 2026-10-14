/* eslint-disable react/prop-types */
import { formatDateTimeWat } from '../utils/watDate';
const OrderDetails = ({ data }) => {
	return (
		<>
			<div
				id="receipt"
				className="w-full p-3 bg-white flex flex-col col-span-12 rounded-xl border border-[#E7E7E7] lg:row-start-4"
			>
				<div className="flex items-center justify-between flex-wrap gap-1">
					<h2 className="text-[#212B36] text-base font-semibold -tracking-[0.15px] whitespace-nowrap">
						Customer Transaction
					</h2>
				</div>
				<div className="w-full overflow-x-scroll md:overflow-auto max-w-xl xs:max-w-xl sm:max-w-xl md:max-w-7xl 2xl:max-w-none mt-1">
					<div className="p-3">
						<h2 className="pb-2 text-[#212B36] font-bold text-sm  whitespace-nowrap capitalize">
							Name : {data?.name}
						</h2>
						<h2 className="py-2 text-[#212B36] text-sm font-normal whitespace-nowrap">
							Vehicle: {data?.vehicleNumber}
						</h2>
						<h2 className="py-2  text-[#212B36] text-sm font-normal whitespace-nowrap">
							Transaction:{' '}
							<span
								className={`${
									data?.credit ? 'text-[#4F80E1]' : 'text-red-500'
								} font-bold whitespace-nowrap`}
							>
								₦ {data?.credit || data?.debit}
							</span>
						</h2>
						<h2 className="py-2  text-[#212B36] text-sm font-normal whitespace-nowrap rounded-l-lg">
							Date:{' '}
							{formatDateTimeWat(
								data?.date || data?.createdAt,
								'dd-MM-yyyy HH:mm'
							)}
						</h2>
					</div>
				</div>
				{data?.materials?.length > 0 && (
					<div className="px-3">
						<div className="flex items-center justify-between flex-wrap gap-1 mt-4">
							<h2 className="text-[#212B36] text-base font-semibold -tracking-[0.15px] whitespace-nowrap">
								Customer Products
							</h2>
						</div>
						<div className="w-full overflow-x-scroll md:overflow-auto max-w-xl xs:max-w-xl sm:max-w-xl md:max-w-7xl 2xl:max-w-none mt-1">
							<table className="table-auto overflow-scroll md:overflow-auto w-full text-left font-inter border-separate border-spacing-y-1">
								<thead className="bg-[#222E3A]/[6%] rounded-lg text-base text-white font-semibold w-full">
									<tr className="">
										<th className="py-3 pl-3 text-[#212B36] text-sm font-normal whitespace-nowrap">
											Material
										</th>
										<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
											Quantity
										</th>
										<th className="py-3 px-2.5 text-[#768594] text-sm font-normal whitespace-nowrap md:w-[100px]">
											Rate (kg)
										</th>
										<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
											Cost ₦
										</th>
									</tr>
								</thead>
								<tbody>
									{data?.materials?.map((data) => (
										<tr
											key={data?._id}
											className="drop-shadow-[0_0_10px_rgba(34,46,58,0.02)] bg-[#f6f8fa] hover:shadow-2xl cursor-pointer "
										>
											<td className="py-3 pl-3 text-sm font-normal text-[#637381] whitespace-nowrap capitalize">
												{data?.product}
											</td>
											<td className="py-4 px-1 text-sm font-normal text-[#637381] whitespace-nowrap">
												{data?.qty}
											</td>

											<td className="py-4 px-1 text-sm font-normal text-[#637381] noBorder whitespace-nowrap">
												{data?.rate || ''}
											</td>
											<td className="py-4 px-1 text-sm font-normal text-[#637381] noBorder whitespace-nowrap">
												{data?.cost || ''}
											</td>
										</tr>
									))}
									<tr>
										<td
											colSpan={3}
											className="w-full py-3 pl-3 text-[#212B36] text-sm font-bold whitespace-nowrap "
										>
											Total Cost
										</td>
										<td className="w-full py-3  text-sm font-bold  pl-3 text-right text-[#10B860] whitespace-nowrap">
											₦ {data?.total}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				)}
				<div className="mb-1 mt-4 p-3">
					<h2 className="text-[#212B36] text-base font-semibold -tracking-[0.15px] whitespace-nowrap">
						Remark
					</h2>
					<textarea
						value={data?.description}
						readOnly
						disabled
						className="input p-2 rounded-md h-[200px] resize-none w-full border border-gray6  text-black"
					></textarea>
				</div>
			</div>
		</>
	);
};

export default OrderDetails;
