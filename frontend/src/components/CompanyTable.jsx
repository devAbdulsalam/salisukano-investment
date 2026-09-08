/* eslint-disable react/prop-types */
import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import { TbBuildingCommunity } from 'react-icons/tb';
import { LuArrowUpDown, LuArrowUp, LuArrowDown } from 'react-icons/lu';
import moment from 'moment';

const SortIcon = ({ column, sortConfig }) => {
	if (sortConfig.key !== column) return <LuArrowUpDown size={13} className="text-[#C4CDD5] group-hover/th:text-[#637381] transition-colors" />;
	return sortConfig.dir === 'asc'
		? <LuArrowUp size={13} className="text-blue-500" />
		: <LuArrowDown size={13} className="text-blue-500" />;
};

const CompanyTable = ({ tableData }) => {
	const navigate = useNavigate();
	const { id } = useParams();
	const [query, setQuery] = useState('');
	const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });

	const toggleSort = (key) => {
		setSortConfig((prev) =>
			prev.key === key
				? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
				: { key, dir: 'asc' }
		);
	};

	const filteredData = useMemo(() => {
		const searched = tableData?.filter((item) => {
			const q = query.toLowerCase();
			return (
				item?.company?.name?.toLowerCase().includes(q) ||
				item?.company?.phone?.toLowerCase().includes(q) ||
				moment(item?.month?.month).format('MMM YYYY').toLowerCase().includes(q) ||
				item?.balance?.toString().includes(q)
			);
		});

		if (!sortConfig.key) return searched;

		return [...(searched || [])].sort((a, b) => {
			let aVal, bVal;
			if (sortConfig.key === 'company') {
				// Rows with no company sort to the bottom regardless of direction
				const aName = a?.company?.name?.toLowerCase() ?? null;
				const bName = b?.company?.name?.toLowerCase() ?? null;
				if (aName === null && bName === null) return 0;
				if (aName === null) return 1;
				if (bName === null) return -1;
				aVal = aName;
				bVal = bName;
			} else if (sortConfig.key === 'month') {
				aVal = new Date(a?.month?.month).getTime() || 0;
				bVal = new Date(b?.month?.month).getTime() || 0;
			} else if (sortConfig.key === 'balance') {
				aVal = a?.balance ?? 0;
				bVal = b?.balance ?? 0;
			}
			if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
			return 0;
		});
	}, [query, tableData, sortConfig]);

	const handleRowClick = (item) => {
		const monthId = item?.month?._id;
		const companyId = item?.company?._id;
		if (companyId) {
			navigate(`/creditors/${id}/months/${monthId}/${companyId}`);
		} else {
			navigate(`/creditors/${id}/months/${monthId}`);
		}
	};

	return (
		<div className="w-full bg-white rounded-2xl border border-[#E7E7E7] overflow-hidden shadow-sm">
			{/* Header */}
			<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#F0F0F0]">
				<div className="flex items-center gap-2">
					<HiOutlineOfficeBuilding className="text-blue-500" size={18} />
					<h3 className="font-semibold text-sm text-[#212B36]">By Company</h3>
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
						className="outline-none bg-transparent text-sm w-36 placeholder-[#9CA3AF]"
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

							{/* Sortable: Company */}
							<th
								className="py-3 px-3 group/th cursor-pointer select-none"
								onClick={() => toggleSort('company')}
							>
								<div className="flex items-center gap-1.5">
									Company
									<SortIcon column="company" sortConfig={sortConfig} />
								</div>
							</th>

							<th className="py-3 px-3">Phone</th>

							{/* Sortable: Month */}
							<th
								className="py-3 px-3 group/th cursor-pointer select-none"
								onClick={() => toggleSort('month')}
							>
								<div className="flex items-center gap-1.5">
									Month
									<SortIcon column="month" sortConfig={sortConfig} />
								</div>
							</th>

							{/* Sortable: Balance */}
							<th
								className="py-3 px-3 group/th cursor-pointer select-none text-right"
								onClick={() => toggleSort('balance')}
							>
								<div className="flex items-center justify-end gap-1.5">
									Balance (₦)
									<SortIcon column="balance" sortConfig={sortConfig} />
								</div>
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[#F4F6F8]">
						{filteredData?.length === 0 && (
							<tr>
								<td colSpan={5} className="py-12 text-center text-[#9CA3AF] text-sm">
									No company records found
								</td>
							</tr>
						)}
						{filteredData?.map((item, index) => (
							<tr
								key={item?.month?._id + (item?.company?._id || 'no-company') + index}
								onClick={() => handleRowClick(item)}
								className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
							>
								<td className="py-3 pl-5 pr-3 text-[#9CA3AF]">{index + 1}</td>

								{/* Company */}
								<td className="py-3 px-3">
									{item?.company ? (
										<div className="flex items-center gap-2">
											<div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
												<HiOutlineOfficeBuilding className="text-blue-400" size={14} />
											</div>
											<span className="font-semibold text-[#212B36] group-hover:text-blue-600 transition-colors capitalize">
												{item.company.name}
											</span>
										</div>
									) : (
										<div className="flex items-center gap-2">
											<div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
												<TbBuildingCommunity className="text-orange-400" size={14} />
											</div>
											<span className="italic text-[#9CA3AF] group-hover:text-orange-500 transition-colors">
												No company linked
											</span>
										</div>
									)}
								</td>

								{/* Phone */}
								<td className="py-3 px-3 text-[#637381]">
									{item?.company?.phone || <span className="text-[#D1D5DB]">—</span>}
								</td>

								{/* Month */}
								<td className="py-3 px-3">
									<span className="inline-flex items-center gap-1 text-xs font-medium bg-[#F4F6F8] text-[#637381] px-2 py-1 rounded-md">
										{moment(item?.month?.month).format('MMM YYYY')}
									</span>
								</td>

								{/* Balance */}
								<td className="py-3 px-3 text-right">
									<span className="font-semibold text-emerald-600">
										₦{item?.balance?.toLocaleString() || '0'}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{filteredData?.length > 0 && (
				<div className="px-5 py-3 border-t border-[#F0F0F0] text-xs text-[#9CA3AF]">
					Showing {filteredData.length} of {tableData?.length} record{tableData?.length !== 1 ? 's' : ''}
				</div>
			)}
		</div>
	);
};

export default CompanyTable;
