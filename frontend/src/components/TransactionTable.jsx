/* eslint-disable react/prop-types */
import { useState, useMemo } from 'react';
import Table from './Table';
import DebouncedInput from './DebouncedInput';
import DropDowns from './DropDowns';
const queryList = [{ name: 'All' }, { name: 'Credit' }, { name: 'Debit' }];
import { SiMicrosoftexcel } from 'react-icons/si';
// import { Link } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';
// const pageList = [{ name: 'Pages' },{ name: 'All' }, { name: '10' }, { name: '20' }];
// import { formatPrice } from '../hooks/formatPrice';
import formatDate from '../hooks/formatDate';

const Tablle = ({
	handelExportToExcel,
	data,
	isLoading,
	tableRef,
	pageSize,
}) => {
	const [selectedStatus, setSelectedStatus] = useState('');
	const [globalFilter, setGlobalFilter] = useState('');
	// const navigate = useNavigate();
	const name = 'Products';

	const columns = [
		{
			Header: 'Date',
			accessor: 'date',
			Cell: ({ value }) => formatDate(value),
		},
		{
			Header: 'Customer/Desc',
			accessor: 'name',
			Cell: ({ value }) => (
				<span className={`uppercase `}>
					{value?.substr(0, 30)?.toUpperCase()}
				</span>
			),
		},
		{ Header: 'Vehicle', accessor: 'vehicleNumber' },
		{
			Header: 'Mix Qty (kg)',
			accessor: 'mixQuantity',
			Cell: ({ value }) => (
				<span className={`text-[#637381] `}>{value || ' '}</span>
			),
		},
		{
			Header: 'M P ₦',
			accessor: 'mixPrice',
			Cell: ({ value }) => (
				<span className={` text-[#637381]`}>{value || ' '}</span>
			),
		},
		{
			Header: 'Mix Total ₦',
			accessor: 'mixTotal',
			Cell: ({ value }) => (
				<span className={` text-[#DD6107]`}>{value || ' '}</span>
			),
		},
		{
			Header: 'Cast Qty (kg)',
			accessor: 'castQuantity',
			Cell: ({ value }) => (
				<span className={`text-[#637381] `}>{value || ' '}</span>
			),
		},
		{
			Header: 'C P ₦',
			accessor: 'castPrice',
			Cell: ({ value }) => (
				<span className={` text-[#637381]`}>{value || ' '}</span>
			),
		},
		{
			Header: 'Cast Total ₦',
			accessor: 'castTotal',
			Cell: ({ value }) => (
				<span className={` text-[#DD6107]`}>{value || ' '}</span>
			),
		},
		{
			Header: 'S Qty (kg)',
			accessor: 'specialQuantity',
			Cell: ({ value }) => (
				<span className={`text-[#637381] `}>{value || ' '}</span>
			),
		},
		{
			Header: 'S P ₦',
			accessor: 'specialPrice',
			Cell: ({ value }) => (
				<span className={` text-[#637381]`}>{value || ' '}</span>
			),
		},
		{
			Header: 'Special Total ₦',
			accessor: 'specialTotal',
			Cell: ({ value }) => (
				<span className={` text-[#DD6107]`}>{value || ' '}</span>
			),
		},
		{
			Header: 'CB Qty (kg)',
			accessor: 'bundleQuantity',
			Cell: ({ value }) => (
				<span className={`text-[#637381] `}>{value || ' '}</span>
			),
		},
		{
			Header: 'CB P ₦',
			accessor: 'bundlePrice',
			Cell: ({ value }) => (
				<span className={` text-[#637381]`}>{value || ' '}</span>
			),
		},
		{
			Header: 'Bundle Total ₦',
			accessor: 'bundleTotal',
			Cell: ({ value }) => (
				<span className={` text-[#DD6107]`}>{value || ' '}</span>
			),
		},
		{
			Header: 'Credit ₦',
			accessor: 'credit',
			Cell: ({ value }) => (
				<span className={`text-[#4F80E1] `}>{value || ' '}</span>
			),
		},
		{
			Header: 'Dedit ₦',
			accessor: 'debit',
			Cell: ({ value }) => (
				<span className={`text-[#FB4949] `}>{value || ' '}</span>
			),
		},
		{
			Header: 'Balance ₦',
			accessor: 'balance',
			Cell: ({ value }) => <span className={`text-[#10B860] `}>{value}</span>,
		},
	];

	const handleFilter = (e) => {
		setSelectedStatus(e.name);
	};
	// const handlePage = (e) => {
	// 	console.log(e);
	// 	if (e.name === 'All') {
	// 		setPageSise(data.length);
	// 	}
	// 	setPageSise(() => Number(e.name));
	// };
	const filteredData = useMemo(() => {
		if (selectedStatus === '' || selectedStatus === 'All') {
			return data;
		}
		if (selectedStatus === 'Debit') {
			return data.filter((items) => items.debit !== 0);
		}
		return data.filter((items) => items.credit !== 0);
	}, [data, selectedStatus]);
	data = useMemo(() => filteredData, [filteredData]);

	return (
		<div className="w-full p-3 bg-white flex flex-col col-span-12 rounded-xl border border-[#E7E7E7] lg:row-start-4">
			<div className="flex items-center justify-between flex-wrap gap-1 my-2">
				<h3 className="text-[#212B36] text-base font-semibold -tracking-[0.15px] whitespace-nowrap">
					Transactions
				</h3>
			</div>
			<div className="flex items-center justify-between flex-wrap gap-1">
				<div className="lg:max-w-sm  border focus-within:border-blue-600 rounded-lg border-[#E7E7E7] py-3 px-4 justify-between items-center max-h-10 hidden md:flex">
					<DebouncedInput
						type="text"
						className="outline-none w-9/12"
						placeholder="Search..."
						value={globalFilter ?? ''}
						onChange={(value) => setGlobalFilter(String(value))}
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

				<div className="flex gap-2 items-center justify-center w-fit">
					<DropDowns list={queryList} handleFilter={handleFilter} />

					<button
						className="py-2.5 px-2 border border-[#E7E7E7] flex
					justify-center items-center gap-1 rounded text-sm text-white bg-blue-500 hover:bg-blue-700
					font-normal"
						onClick={handelExportToExcel}
					>
						Export <SiMicrosoftexcel className="text-white" />
					</button>
				</div>
			</div>
			<div className="mt-4 flex border focus-within:border-blue-600 rounded-lg border-[#E7E7E7] py-3 px-4 justify-between items-center max-h-12  md:hidden">
				<DebouncedInput
					type="text"
					className="outline-none w-9/12"
					value={globalFilter ?? ''}
					onChange={(value) => setGlobalFilter(String(value))}
					placeholder="Search..."
				/>
				<svg
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
			<Table
				data={data}
				columns={columns}
				globalFilter={globalFilter}
				pageSize={pageSize}
				name={name}
				isLoading={isLoading}
				tableRef={tableRef}
			/>
		</div>
	);
};

export default Tablle;
