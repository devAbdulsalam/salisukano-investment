/* eslint-disable react/prop-types */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { TbCalendarMonth } from 'react-icons/tb';
import { formatDateWat, formatMonthYearWat } from '../utils/watDate';

const CreditTable = ({ tableData, creditorId }) => {
	const navigate = useNavigate();
	const [query, setQuery] = useState('');

	const filteredData = useMemo(() => {
		return tableData?.filter((data) => {
			const q = query.toLowerCase();
			return (
				data?.month?.toLowerCase().includes(q) ||
				data?.balance?.toString().includes(q) ||
				formatDateWat(data?.createdAt, 'dd-MM-yyyy').includes(q)
			);
		});
	}, [query, tableData]);

	return (
		<div className="w-full bg-white rounded-2xl border border-[#E7E7E7] overflow-hidden shadow-sm">
			{/* Header */}
			<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#F0F0F0]">
				<div className="flex items-center gap-2">
					<TbCalendarMonth className="text-blue-500" size={18} />
					<h3 className="font-semibold text-sm text-[#212B36]">Monthly Records</h3>
					{filteredData?.length > 0 && (
						<span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
							{filteredData.length}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2 border border-[#E7E7E7] rounded-lg px-3 py-2 focus-within:border-blue-500 transition-colors bg-[#F9FAFB]">
					<FiSearch className="text-[#9CA3AF] shrink-0" size={14} />
					<input
						type="text"
						className="outline-none bg-transparent text-sm w-32 placeholder-[#9CA3AF]"
						placeholder="Search…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full text-left text-sm">
					<thead>
						<tr className="bg-[#F4F6F8] text-[#637381] text-xs font-semibold uppercase tracking-wide">
							<th className="py-3 pl-5 pr-3 w-12">S/N</th>
							<th className="py-3 px-3">Month</th>
							<th className="py-3 px-3 text-right">Balance (₦)</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[#F4F6F8]">
						{filteredData?.length === 0 && (
							<tr>
								<td colSpan={3} className="py-12 text-center text-[#9CA3AF] text-sm">
									No monthly records found
								</td>
							</tr>
						)}
						{filteredData?.map((data, index) => (
							<tr
								key={data?._id || index}
								onClick={() => navigate(`/creditors/${creditorId}/months/${data._id}`)}
								className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
							>
								<td className="py-3 pl-5 pr-3 text-[#9CA3AF]">{index + 1}</td>
								<td className="py-3 px-3">
									<div className="flex items-center gap-2">
										<span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
										<span className="font-medium text-[#212B36] capitalize group-hover:text-blue-600 transition-colors">
											{formatMonthYearWat(data?.month, 'MMMM yyyy')}
										</span>
									</div>
								</td>
								<td className="py-3 px-3 text-right">
									<span className="font-semibold text-emerald-600">
										₦{data?.balance?.toLocaleString() || '0'}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{filteredData?.length > 0 && (
				<div className="px-5 py-3 border-t border-[#F0F0F0] text-xs text-[#9CA3AF]">
					Showing {filteredData.length} of {tableData?.length} month{tableData?.length !== 1 ? 's' : ''}
				</div>
			)}
		</div>
	);
};

export default CreditTable;
