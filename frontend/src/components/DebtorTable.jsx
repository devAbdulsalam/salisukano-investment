/* eslint-disable react/prop-types */
import { useState, useMemo } from 'react';
import { AiFillEdit, AiFillDelete } from 'react-icons/ai';
import { FiSearch } from 'react-icons/fi';
import { SiMicrosoftexcel } from 'react-icons/si';
import moment from 'moment';

const DebtorTable = ({ tableData, handelEdit, handelDelete, tableRef, handelExportToExcel }) => {
	const [query, setQuery] = useState('');

	const filteredData = useMemo(() => {
		return tableData?.filter((data) => {
			const q = query.toLowerCase();
			return (
				data._id?.toLowerCase().includes(q) ||
				data.name?.toLowerCase().includes(q) ||
				data.phone?.toLowerCase().includes(q) ||
				data.description?.toLowerCase().includes(q) ||
				data.credit?.toString().includes(q) ||
				data.debit?.toString().includes(q) ||
				data.balance?.toString().includes(q) ||
				moment(data.createdAt).format('DD-MM-YYYY').includes(q)
			);
		});
	}, [query, tableData]);

	return (
		<div className="w-full bg-white rounded-2xl border border-[#E7E7E7] overflow-hidden shadow-sm">
			{/* Header */}
			<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#F0F0F0]">
				<div className="flex items-center gap-2">
					<h3 className="font-semibold text-sm text-[#212B36]">Transactions</h3>
					{filteredData?.length > 0 && (
						<span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
							{filteredData.length}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Search */}
					<div className="flex items-center gap-2 border border-[#E7E7E7] rounded-lg px-3 py-2 focus-within:border-blue-500 transition-colors bg-[#F9FAFB]">
						<FiSearch className="text-[#9CA3AF] shrink-0" size={14} />
						<input
							type="text"
							className="outline-none bg-transparent text-sm w-36 placeholder-[#9CA3AF]"
							placeholder="Search…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>

					{/* Export */}
					<button
						onClick={handelExportToExcel}
						className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
					>
						<SiMicrosoftexcel size={13} />
						Export
					</button>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table ref={tableRef} className="w-full text-left text-sm">
					<thead>
						<tr className="bg-[#F4F6F8] text-[#637381] text-xs font-semibold uppercase tracking-wide">
							<th className="py-3 pl-5 pr-3 whitespace-nowrap">Date</th>
							<th className="py-3 px-3 whitespace-nowrap">Description</th>
							<th className="py-3 px-3 whitespace-nowrap text-right">Credit (₦)</th>
							<th className="py-3 px-3 whitespace-nowrap text-right">Debit (₦)</th>
							<th className="py-3 px-3 whitespace-nowrap text-right">Balance (₦)</th>
							<th className="py-3 px-3 whitespace-nowrap">Remarks</th>
							<th className="py-3 px-3 whitespace-nowrap text-center w-20">Action</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[#F4F6F8]">
						{filteredData?.length === 0 && (
							<tr>
								<td colSpan={7} className="py-12 text-center text-[#9CA3AF] text-sm">
									No transactions found
								</td>
							</tr>
						)}
						{filteredData?.map((data) => (
							<tr
								key={data._id}
								className="hover:bg-[#F9FAFB] transition-colors group"
							>
								{/* Date */}
								<td className="py-3 pl-5 pr-3 text-[#637381] whitespace-nowrap">
									{moment(data?.date || data?.createdAt).format('DD MMM YYYY')}
								</td>

								{/* Description */}
								<td className="py-3 px-3 text-[#212B36] capitalize max-w-[200px] truncate">
									{data?.description || <span className="text-[#D1D5DB]">—</span>}
								</td>

								{/* Credit */}
								<td className="py-3 px-3 text-right whitespace-nowrap">
									{data?.credit > 0 ? (
										<span className="font-semibold text-red-500">
											₦{data.credit.toLocaleString()}
										</span>
									) : (
										<span className="text-[#D1D5DB]">—</span>
									)}
								</td>

								{/* Debit */}
								<td className="py-3 px-3 text-right whitespace-nowrap">
									{data?.debit > 0 ? (
										<span className="font-semibold text-blue-500">
											₦{data.debit.toLocaleString()}
										</span>
									) : (
										<span className="text-[#D1D5DB]">—</span>
									)}
								</td>

								{/* Balance */}
								<td className="py-3 px-3 text-right whitespace-nowrap">
									<span className="font-semibold text-emerald-600">
										₦{data?.balance?.toLocaleString() || '0'}
									</span>
								</td>

								{/* Remark */}
								<td className="py-3 px-3 text-[#637381] max-w-[160px] truncate">
									{data?.remark || <span className="text-[#D1D5DB]">—</span>}
								</td>

								{/* Actions */}
								<td className="py-3 px-3">
									<div className="flex items-center justify-center gap-1">
										<button
											onClick={() => handelEdit(data)}
											title="Edit"
											className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
										>
											<AiFillEdit size={15} />
										</button>
										<button
											onClick={() => handelDelete(data)}
											title="Delete"
											className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
										>
											<AiFillDelete size={15} />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{filteredData?.length > 0 && (
				<div className="px-5 py-3 border-t border-[#F0F0F0] text-xs text-[#9CA3AF]">
					Showing {filteredData.length} of {tableData?.length} transaction{tableData?.length !== 1 ? 's' : ''}
				</div>
			)}
		</div>
	);
};

export default DebtorTable;
