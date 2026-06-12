/* eslint-disable react/prop-types */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiFillDelete } from 'react-icons/ai';
import moment from 'moment';
// import moment from 'moment';

const Table = ({ tableData, handelDelete }) => {
	const navigate = useNavigate();
	const [query, setQuery] = useState('');

	const handleChange = (e) => {
		setQuery(e.target.value);
	};

	const filteredData = useMemo(() => {
		return tableData?.filter((data) => {
			// Filter by query (search)
			const matchesQuery = data?._id
				?.toLowerCase()
				.includes(query.toLowerCase());
			// data?.name?.toLowerCase().includes(query.toLowerCase()) ||
			// data?.phone?.toLowerCase().includes(query.toLowerCase()) ||
			// data?.balance?.toString().includes(query) ||
			// moment(data?.createdAt).format('DD-MM-YYYY').includes(query);

			return matchesQuery;
		});
	}, [query, tableData]);
	return (
		<div className="w-full p-3 bg-white flex flex-col col-span-12 rounded-xl border border-[#E7E7E7] lg:row-start-4">
			<div className="flex items-center justify-between flex-wrap gap-1">
				<div className="flex gap-2 items-center justify-center w-fit">
					<div className="lg:max-w-sm  border focus-within:border-blue-600 rounded-lg border-[#E7E7E7] py-3 px-4 justify-between items-center max-h-10 hidden md:flex">
						<input
							type="text"
							className="outline-none w-9/12"
							placeholder="Search..."
							value={query}
							onChange={handleChange}
						/>
						<svg
							width="16"
							height="16"
							viewBox="0 0 20 20"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M9.16667 3.33335C5.94501 3.33335 3.33334 5.94503 3.33334 9.16669C3.33334 12.3883 5.94501 15 9.16667 15C12.3883 15 15 12.3883 15 9.16669C15 5.94503 12.3883 3.33335 9.16667 3.33335ZM1.66667 9.16669C1.66667 5.02455 5.02454 1.66669 9.16667 1.66669C13.3088 1.66669 16.6667 5.02455 16.6667 9.16669C16.6667 13.3088 13.3088 16.6667 9.16667 16.6667C5.02454 16.6667 1.66667 13.3088 1.66667 9.16669Z"
								fill="#637381"
							/>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M13.2857 13.2858C13.6112 12.9603 14.1388 12.9603 14.4643 13.2858L18.0893 16.9108C18.4147 17.2362 18.4147 17.7638 18.0893 18.0893C17.7638 18.4147 17.2362 18.4147 16.9108 18.0893L13.2857 14.4643C12.9603 14.1388 12.9603 13.6112 13.2857 13.2858Z"
								fill="#637381"
							/>
						</svg>
					</div>
				</div>
			</div>

			<div className="mt-4 flex border focus-within:border-blue-600 rounded-lg border-[#E7E7E7] py-3 px-4 justify-between items-center max-h-12  md:hidden">
				<input
					type="text"
					className="outline-none w-9/12"
					placeholder="Search..."
					value={query}
					onChange={handleChange}
				/>
				<svg
					// onClick={handleFilter}
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M9.16667 3.33335C5.94501 3.33335 3.33334 5.94503 3.33334 9.16669C3.33334 12.3883 5.94501 15 9.16667 15C12.3883 15 15 12.3883 15 9.16669C15 5.94503 12.3883 3.33335 9.16667 3.33335ZM1.66667 9.16669C1.66667 5.02455 5.02454 1.66669 9.16667 1.66669C13.3088 1.66669 16.6667 5.02455 16.6667 9.16669C16.6667 13.3088 13.3088 16.6667 9.16667 16.6667C5.02454 16.6667 1.66667 13.3088 1.66667 9.16669Z"
						fill="#637381"
					/>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M13.2857 13.2858C13.6112 12.9603 14.1388 12.9603 14.4643 13.2858L18.0893 16.9108C18.4147 17.2362 18.4147 17.7638 18.0893 18.0893C17.7638 18.4147 17.2362 18.4147 16.9108 18.0893L13.2857 14.4643C12.9603 14.1388 12.9603 13.6112 13.2857 13.2858Z"
						fill="#637381"
					/>
				</svg>
			</div>
			<div className="w-full overflow-x-scroll md:overflow-auto max-w-xl xs:max-w-xl sm:max-w-xl md:max-w-7xl 2xl:max-w-none mt-1">
				<table className="table-auto overflow-scroll md:overflow-auto w-full text-left font-inter border-separate border-spacing-y-1">
					<thead className="bg-[#222E3A]/[6%] rounded-lg text-base text-white font-semibold w-full">
						<tr className="">
							<th className="py-3 pl-3 text-[#212B36] text-sm font-normal whitespace-nowrap rounded-l-lg md:w-[100px]">
								Date
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								Old Mix ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								New Mix ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								Diff ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								Old Cast ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								New Cast ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								Diff ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								Old Special ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								New Special ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								Old Bundle ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px]">
								New Bundle ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap">
								Diff ₦
							</th>
							<th className="py-3 text-[#212B36] text-sm font-normal whitespace-nowrap md:w-[100px] text-center">
								Action
							</th>
						</tr>
					</thead>
					<tbody>
						{filteredData?.map((data, index) => (
							<tr
								key={data?._id || index}
								className="drop-shadow-[0_0_10px_rgba(34,46,58,0.02)] bg-[#f6f8fa] hover:shadow-2xl p-2 cursor-pointer"
							>
								<td className="py-2 pl-3 text-sm font-normal text-[#637381] rounded-l-lg whitespace-nowrap cursor-pointer">
									{moment(data?.date).format('DD MMM YYYY')}
								</td>

								<td className="py-2 px-2.5 text-sm font-normal text-[#637381] whitespace-nowrap bg-gray-50 cursor-pointer uppercase">
									{data?.oldMix}
								</td>
								<td className="py-2 px-2.5 text-sm font-normal text-[#637381] whitespace-nowrap cursor-pointer uppercase">
									{data?.newMix}
								</td>
								<td className="py-2 px-2.5 text-sm font-normal text-[#637381] whitespace-nowrap cursor-pointer uppercase">
									{data.oldMix - data?.newMix}
								</td>
								<td className="py-4 px-1 text-sm font-normal text-[#637381] whitespace-nowrap bg-gray-50 cursor-pointer">
									{data?.oldCast}
								</td>
								<td className="py-2 px-2.5 text-sm font-normal text-[#637381] whitespace-nowrap cursor-pointer uppercase">
									{data?.newCast}
								</td>
								<td className="py-4 px-1 text-sm font-normal text-[#637381] whitespace-nowrap bg-gray-50 cursor-pointer">
									{data?.oldCast - data?.newCast}
								</td>
								<td className="py-4 px-1 text-sm font-normal text-[#637381] whitespace-nowrap bg-gray-50 cursor-pointer">
									{data?.oldSpecial}
								</td>
								<td className="py-2 px-2.5 text-sm font-normal text-[#637381] whitespace-nowrap cursor-pointer uppercase">
									{data?.newSpecial}
								</td>
								<td className="py-4 px-1 text-sm font-normal text-[#637381] whitespace-nowrap bg-gray-50 cursor-pointer">
									{data?.oldSpecial - data?.newSpecial}
								</td>
								<td className="py-2 px-2.5 text-sm font-normal text-[#637381] whitespace-nowrap cursor-pointer uppercase">
									{data?.newBundle}
								</td>
								<td className="py-4 px-1 text-sm font-normal text-[#637381] whitespace-nowrap bg-gray-50 cursor-pointer">
									{data?.oldBundle - data?.newBundle}
								</td>
								<td className="py-2 px-1 text-sm font-normal whitespace-nowrap bg-gray-50 flex gap-2 justify-center items-center h-full">
									{/* <span
										onClick={() => handelEdit(data)}
										className="cursor-pointer"
									>
										<AiFillEdit className="text-blue-500" />
									</span> */}
									<span
										onClick={() => handelDelete(data)}
										className="cursor-pointer mt-1"
									>
										<AiFillDelete className="text-red-500" />{' '}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default Table;
