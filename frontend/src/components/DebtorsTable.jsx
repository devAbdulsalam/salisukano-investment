/* eslint-disable react/prop-types */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa6';
import { AiFillEdit } from 'react-icons/ai';
import { FiSearch } from 'react-icons/fi';
import { SiMicrosoftexcel } from 'react-icons/si';
import { LuArrowUpDown, LuArrowUp, LuArrowDown } from 'react-icons/lu';
import { formatDateWat } from '../utils/watDate';

const SortIcon = ({ column, sortConfig }) => {
	if (sortConfig.key !== column)
		return <LuArrowUpDown size={13} className="text-[#C4CDD5] group-hover/th:text-[#637381] transition-colors" />;
	return sortConfig.dir === 'asc'
		? <LuArrowUp size={13} className="text-blue-500" />
		: <LuArrowDown size={13} className="text-blue-500" />;
};

const DebtorsTable = ({ tableData, handelAddModal, handelEdit, tableRef, handelExportToExcel }) => {
	const navigate = useNavigate();
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
		const searched = tableData?.filter((data) => {
			const q = query.toLowerCase();
			return (
				data?._id?.toLowerCase().includes(q) ||
				data?.name?.toLowerCase().includes(q) ||
				data?.phone?.toLowerCase().includes(q) ||
				data?.balance?.toString().includes(q) ||
				formatDateWat(data?.createdAt, 'dd-MM-yyyy').includes(q)
			);
		});

		if (!sortConfig.key) return searched;

		return [...(searched || [])].sort((a, b) => {
			let aVal, bVal;
			if (sortConfig.key === 'name') {
				aVal = a?.name?.toLowerCase() ?? '';
				bVal = b?.name?.toLowerCase() ?? '';
			} else if (sortConfig.key === 'balance') {
				aVal = a?.balance ?? 0;
				bVal = b?.balance ?? 0;
			}
			if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
			return 0;
		});
	}, [query, tableData, sortConfig]);

	return (
		<div className="w-full bg-white rounded-2xl border border-[#E7E7E7] overflow-hidden shadow-sm">
			{/* Header */}
			<div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#F0F0F0]">
				<div className="flex items-center gap-2">
					<h2 className="font-semibold text-base text-[#212B36]">All Debtors</h2>
					{filteredData?.length > 0 && (
						<span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
							{filteredData.length}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Search */}
					<div className="flex items-center gap-2 border border-[#E7E7E7] rounded-lg px-3 py-2 focus-within:border-blue-500 transition-colors bg-[#F9FAFB]">
						<FiSearch className="text-[#9CA3AF] shrink-0" size={15} />
						<input
							type="text"
							className="outline-none bg-transparent text-sm w-40 placeholder-[#9CA3AF]"
							placeholder="Search debtors…"
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

					{/* Add */}
					<button
						onClick={handelAddModal}
						className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
					>
						<FaPlus size={12} />
						New
					</button>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table
					ref={tableRef}
					className="w-full text-left text-sm"
				>
					<thead>
						<tr className="bg-[#F4F6F8] text-[#637381] text-xs font-semibold uppercase tracking-wide">
							<th className="py-3 pl-5 pr-3 w-12">S/N</th>

							{/* Sortable: Name */}
							<th
								className="py-3 px-3 group/th cursor-pointer select-none"
								onClick={() => toggleSort('name')}
							>
								<div className="flex items-center gap-1.5">
									Name
									<SortIcon column="name" sortConfig={sortConfig} />
								</div>
							</th>

							<th className="py-3 px-3">Phone</th>

							{/* Sortable: Balance */}
							<th
								className="py-3 px-3 group/th cursor-pointer select-none"
								onClick={() => toggleSort('balance')}
							>
								<div className="flex items-center gap-1.5">
									Balance (₦)
									<SortIcon column="balance" sortConfig={sortConfig} />
								</div>
							</th>

							<th className="py-3 px-3 text-center w-20">Action</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-[#F4F6F8]">
						{filteredData?.length === 0 && (
							<tr>
								<td colSpan={5} className="py-12 text-center text-[#9CA3AF] text-sm">
									No debtors found
								</td>
							</tr>
						)}
						{filteredData?.map((data, index) => (
							<tr
								key={data?._id}
								className="hover:bg-[#F9FAFB] transition-colors group"
							>
								<td
									onClick={() => navigate(`/debtors/${data?._id}`)}
									className="py-3 pl-5 pr-3 text-[#9CA3AF] cursor-pointer"
								>
									{index + 1}
								</td>
								<td
									onClick={() => navigate(`/debtors/${data?._id}`)}
									className="py-3 px-3 font-semibold text-[#212B36] uppercase cursor-pointer group-hover:text-blue-600 transition-colors"
								>
									{data?.name}
								</td>
								<td
									onClick={() => navigate(`/debtors/${data?._id}`)}
									className="py-3 px-3 text-[#637381] cursor-pointer"
								>
									{data?.phone || '—'}
								</td>
								<td
									onClick={() => navigate(`/debtors/${data?._id}`)}
									className="py-3 px-3 cursor-pointer"
								>
									<span className={`font-semibold ${data?.balance > 0 ? 'text-red-500' : 'text-blue-500'}`}>
										₦{data?.balance?.toLocaleString() || '0'}
									</span>
								</td>
								<td className="py-3 px-3">
									<div className="flex justify-center">
										<button
											onClick={() => handelEdit(data)}
											title="Edit"
											className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
										>
											<AiFillEdit size={16} />
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
					Showing {filteredData.length} of {tableData?.length} debtor{tableData?.length !== 1 ? 's' : ''}
				</div>
			)}
		</div>
	);
};

export default DebtorsTable;
