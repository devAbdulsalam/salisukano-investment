import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, PlusCircle, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

import AuthContext from '../context/authContext';
import Loader from '../components/Loader';
import getError from '../hooks/getError';
import {
	fetchShareholders,
	fetchDividendRates,
	createShareholderApi,
	startNewFinancialYearApi,
} from '../hooks/axiosApis';
import { useNavigate } from 'react-router-dom';

/* ─── helpers ─────────────────────────────────────────────────────────── */

const currency = (amount) =>
	Number(amount || 0).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

const createNewRow = () => ({
	_tempId: crypto.randomUUID(),
	/** shareholderId is null → brand-new shareholder (needs createShareholderApi)
	 *  shareholderId is set  → existing shareholder (needs startNewFinancialYearApi) */
	shareholderId: null,
	name: '',
	amount: '',
	isNew: true,
});

/* ─── component ───────────────────────────────────────────────────────── */

const AddShareholders = () => {
	const { user } = useContext(AuthContext);
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear);

	/* ── rows that will be submitted ── */
	const [rows, setRows] = useState([]);

	/* ── "add removed shareholder" dropdown selection ── */
	const [selectedRemoved, setSelectedRemoved] = useState('');

	/* ── fetch all existing FinancialYear records (all years) ── */
	const {
		data: allShareholders = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ['shareholders'],
		queryFn: () => fetchShareholders(user),
		enabled: !!user,
	});

	// console.log('allShareholders', allShareholders);

	/* ── fetch dividend rates for the chosen year ── */
	const { data: dividendRatesData } = useQuery({
		queryKey: ['dividendRates', year],
		queryFn: () => fetchDividendRates(user, year),
		enabled: !!user,
	});

	const dividendRates = dividendRatesData?.data || [];

	/* ── total monthly dividend percentage for the year ── */
	const totalDividendPct = useMemo(
		() => dividendRates.reduce((sum, r) => sum + Number(r.percentage || 0), 0),
		[dividendRates],
	);

	/* ── shareholders already in the chosen year ── */
	const shareholdersInYear = useMemo(
		() => allShareholders.filter((s) => s.year === year),
		[allShareholders, year],
	);

	useEffect(() => {
		setRows(
			shareholdersInYear.map((s) => ({
				_tempId: crypto.randomUUID(),
				shareholderId: s.shareholderId,
				name: s.name,
				amount: s.currentInvestment,
				isNew: false,
			})),
		);
	}, [shareholdersInYear]);
	console.log('shareholdersInYear', shareholdersInYear);
	/* ── previous year's records — used for auto-populating closing balance ── */
	const prevYear = year - 1;
	const shareholdersInPrevYear = useMemo(
		() => allShareholders.filter((s) => s.year === prevYear),
		[allShareholders, prevYear],
	);

	/* ── shareholders NOT yet added to chosen year (candidates to re-add) ── */
	const removedShareholders = useMemo(() => {
		const idsInYear = new Set(
			shareholdersInYear.map((s) => String(s.shareholderId)),
		);
		/* Use prev-year list as the authoritative shareholder roster */
		return shareholdersInPrevYear.filter(
			(s) => !idsInYear.has(String(s.shareholderId)),
		);
	}, [shareholdersInYear, shareholdersInPrevYear]);

	/* ── available years from data + sensible range ── */
	const availableYears = useMemo(() => {
		const fromData = allShareholders.map((s) => s.year);
		const range = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
		return [...new Set([...fromData, ...range])].sort((a, b) => b - a);
	}, [allShareholders, currentYear]);

	/* ─── initialise rows from previous year when year changes ─────────── */
	/* The user sees prev-year shareholders pre-filled; they can edit amounts
	   or remove individuals before saving. */
	const handleYearChange = (newYear) => {
		setYear(() => newYear);
		// populate rows of current year
		// setRows(() => allShareholders.filter((s) => s.year === year));
		setRows([]);
		setSelectedRemoved('');
	};

	/* Pre-populate from prev year's closing balance */
	const handleAutoPopulate = () => {
		if (shareholdersInPrevYear.length === 0) {
			toast('No shareholders found for previous year to auto-populate.');
			return;
		}
		const idsInYear = new Set(
			shareholdersInYear.map((s) => String(s.shareholderId)),
		);
		console.log('shareholdersInPrevYear', shareholdersInPrevYear);
		const preRows = shareholdersInPrevYear
			.filter((s) => !idsInYear.has(String(s.shareholderId)))
			.map((s) => ({
				_tempId: crypto.randomUUID(),
				shareholderId: s.shareholderId,
				name: s.name,
				// amount: s.closingBalance ??  s.currentInvestment ?? 0,
				amount: s.closingBalance
					? s.closingBalance
					: s.currentInvestment + s.totalDividendEarned,
				isNew: false,
			}));
		if (preRows.length === 0) {
			toast('All previous shareholders are already added to this year.');
			return;
		}
		setRows(preRows);
	};

	/* ─── row CRUD ──────────────────────────────────────────────────────── */

	const addNewRow = () => setRows((prev) => [...prev, createNewRow()]);

	const addRemovedShareholder = () => {
		if (!selectedRemoved) return;
		const found = removedShareholders.find(
			(s) => String(s.shareholderId) === selectedRemoved,
		);
		if (!found) return;
		/* Don't add duplicates */
		if (rows.some((r) => String(r.shareholderId) === selectedRemoved)) {
			toast('Shareholder already in the list.');
			return;
		}
		setRows((prev) => [
			...prev,
			{
				_tempId: crypto.randomUUID(),
				shareholderId: found.shareholderId,
				name: found.name,
				amount: found.closingBalance ?? found.currentInvestment ?? 0,
				isNew: false,
			},
		]);
		setSelectedRemoved('');
	};

	const updateRow = (tempId, field, value) =>
		setRows((prev) =>
			prev.map((row) =>
				row._tempId === tempId
					? {
							...row,
							[field]: field === 'amount' ? value : value,
						}
					: row,
			),
		);

	const removeRow = (tempId) =>
		setRows((prev) => prev.filter((r) => r._tempId !== tempId));

	/* ─── derived totals ────────────────────────────────────────────────── */

	const totalInvestment = useMemo(
		() => rows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
		[rows],
	);

	/** Projected annual dividend per row (sum of monthly rates × investment) */
	const projectedDividends = useMemo(() => {
		if (totalDividendPct === 0) return {};
		return rows.reduce((acc, r) => {
			acc[r._tempId] = (Number(r.amount || 0) * totalDividendPct) / 100;
			return acc;
		}, {});
	}, [rows, totalDividendPct]);

	const totalProjectedDividend = useMemo(
		() => Object.values(projectedDividends).reduce((s, v) => s + v, 0),
		[projectedDividends],
	);

	/* ─── mutations ─────────────────────────────────────────────────────── */

	const { mutate: saveRows, isPending: saving } = useMutation({
		mutationFn: async () => {
			const results = [];
			for (const row of rows) {
				const amount = Number(row.amount);
				if (!amount || amount < 0) {
					throw new Error(
						`Invalid amount for ${row.name || 'new shareholder'}`,
					);
				}
				if (row.isNew) {
					/* Brand-new shareholder */
					if (!row.name.trim()) {
						throw new Error('Name is required for new shareholders');
					}
					const res = await createShareholderApi(
						{
							name: row.name.trim(),
							openingBalance: amount,
							date: `${year}-01-01`,
							description: `Opening balance for ${year}`,
						},
						user,
					);
					results.push(res);
				} else {
					/* Existing shareholder starting a new financial year */
					const res = await startNewFinancialYearApi(
						{
							shareholderId: row.shareholderId,
							year,
							openingBalance: amount,
							description: `Opening balance for ${year}`,
						},
						user,
					);
					results.push(res);
				}
			}
			return results;
		},
		onSuccess: () => {
			toast.success(`Shareholders saved for ${year}`);
			setRows([]);
			queryClient.invalidateQueries({ queryKey: ['shareholders'] });
			queryClient.invalidateQueries({ queryKey: ['dividends'] });
		},
		onError: (err) => {
			toast.error(
				err?.response?.data?.message || err?.message || 'Failed to save',
			);
		},
	});

	const handleSave = () => {
		if (rows.length === 0) {
			toast('Add at least one shareholder row.');
			return;
		}
		saveRows();
	};

	/* ─── render ────────────────────────────────────────────────────────── */

	if (isLoading) return <Loader />;
	if (error) {
		return (
			<div className="p-6 text-center text-red-500">
				Failed to load shareholders: {getError(error)}
			</div>
		);
	}

	return (
		<main className="p-3 md:p-6 bg-gray-50 min-h-screen">
			{/* ── Header ── */}
			<div className="flex flex-wrap justify-between items-start gap-4 mb-6">
				<div>
					<h1 className="text-xl md:text-3xl font-bold text-gray-800">
						Add Shareholders
					</h1>
					<p className="text-sm text-gray-500 mt-1">
						Set up shareholders for a new financial year
					</p>
				</div>

				{/* Year selector */}
				<div>
					<label className="text-xs text-gray-500 block mb-1">
						Financial Year
					</label>
					<select
						className="border rounded px-3 py-2 text-sm"
						value={year}
						onChange={(e) => handleYearChange(Number(e.target.value))}
					>
						{availableYears.map((yr) => (
							<option key={yr} value={yr}>
								{yr}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* ── Summary Cards ── */}
			<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
				<div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md">
					<p className="text-xs text-gray-500 mb-1">Already in {year}</p>
					<p className="text-xl font-bold">{shareholdersInYear.length}</p>
					<p className="text-xs text-gray-400">shareholders</p>
				</div>
				<div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md">
					<p className="text-xs text-gray-500 mb-1">Pending to add</p>
					<p className="text-xl font-bold">{rows.length}</p>
					<p className="text-xs text-gray-400">in this batch</p>
				</div>
				<div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md">
					<p className="text-xs text-gray-500 mb-1">Batch Investment</p>
					<p className="text-xl font-bold text-blue-600">
						₦{currency(totalInvestment)}
					</p>
				</div>
				<div
					onClick={() => navigate(`/dividend-rates/${year}`)}
					className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md"
				>
					<p className="text-xs text-gray-500 mb-1">
						Projected Dividend
						{totalDividendPct > 0 && (
							<span className="ml-1 text-green-600">
								({totalDividendPct.toFixed(2)}%)
							</span>
						)}
					</p>
					<p className="text-xl font-bold text-green-600">
						{totalDividendPct > 0
							? `₦${currency(totalProjectedDividend)}`
							: '—'}
					</p>
					{totalDividendPct === 0 && (
						<p className="text-xs text-gray-400">
							Set dividend rates to see projection
						</p>
					)}
				</div>
			</div>

			{/* ── Controls ── */}
			<div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
				{/* Auto-populate from prev year */}
				<button
					onClick={handleAutoPopulate}
					className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
				>
					<UserPlus size={15} />
					Auto-populate from {prevYear}
				</button>

				{/* Re-add a removed shareholder */}
				{removedShareholders.length > 0 && (
					<div className="flex gap-2 items-center">
						<select
							className="border rounded px-3 py-2 text-sm"
							value={selectedRemoved}
							onChange={(e) => setSelectedRemoved(e.target.value)}
						>
							<option value="">Select removed shareholder…</option>
							{removedShareholders.map((s) => (
								<option
									key={String(s.shareholderId)}
									value={String(s.shareholderId)}
								>
									{s.name}
								</option>
							))}
						</select>
						<button
							onClick={addRemovedShareholder}
							disabled={!selectedRemoved}
							className="cursor-pointer bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded text-sm disabled:opacity-40"
						>
							Add
						</button>
					</div>
				)}

				{/* Add blank row for brand-new shareholder */}
				<button
					onClick={addNewRow}
					className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm flex items-center gap-2 ml-auto"
				>
					<PlusCircle size={15} />
					New Shareholder
				</button>
			</div>

			{/* ── Table ── */}
			<div className="bg-white rounded-xl border border-gray-200 overflow-x-auto mb-4">
				<table className="min-w-full divide-y divide-gray-200 text-sm">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
								#
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Shareholder
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Type
							</th>
							<th className="px-4 py-3 text-xs  text-left font-medium text-gray-500 uppercase whitespace-nowrap">
								Opening Balance (₦)
							</th>
							{totalDividendPct > 0 && (
								<th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
									Projected Dividend
								</th>
							)}
							<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">
								Remove
							</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-gray-100">
						{rows.length === 0 ? (
							<tr>
								<td
									colSpan={totalDividendPct > 0 ? 6 : 5}
									className="px-4 py-10 text-center text-gray-400"
								>
									No rows yet. Use &quot;Auto-populate&quot; or &quot;New
									Shareholder&quot; above.
								</td>
							</tr>
						) : (
							rows.map((row, index) => (
								<tr key={row._tempId} className="hover:bg-gray-50">
									<td className="px-4 py-3 text-gray-400">{index + 1}</td>

									{/* Name — editable only for new shareholders */}
									<td className="px-4 py-2">
										{row.isNew ? (
											<input
												type="text"
												placeholder="Enter shareholder name"
												value={row.name}
												onChange={(e) =>
													updateRow(row._tempId, 'name', e.target.value)
												}
												className="border rounded px-2 py-1 w-full text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-blue-400"
											/>
										) : (
											<span className="font-medium">{row.name}</span>
										)}
									</td>

									{/* Badge */}
									<td className="px-4 py-3">
										{row.isNew ? (
											<span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
												New
											</span>
										) : (
											<span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
												Existing
											</span>
										)}
									</td>

									{/* Amount */}
									<td className="px-4 py-2">
										<input
											type="number"
											min="0"
											placeholder="0.00"
											value={row.amount}
											onChange={(e) =>
												updateRow(row._tempId, 'amount', e.target.value)
											}
											className="border rounded px-2 py-1 w-full  text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-blue-400"
										/>
									</td>

									{/* Projected dividend (conditional column) */}
									{totalDividendPct > 0 && (
										<td className="px-4 py-3 text-center  text-green-600 font-medium">
											₦{currency(projectedDividends[row._tempId] ?? 0)}
										</td>
									)}

									{/* Remove */}
									<td className="px-4 py-3 text-center">
										<button
											onClick={() => removeRow(row._tempId)}
											className="cursor-pointer text-red-500 hover:text-red-700 p-1 rounded"
											aria-label="Remove row"
										>
											<Trash2 size={15} />
										</button>
									</td>
								</tr>
							))
						)}
					</tbody>

					{/* Footer totals */}
					{rows.length > 0 && (
						<tfoot className="bg-gray-50 border-t">
							<tr>
								<td
									colSpan={3}
									className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
								>
									Total ({rows.length} shareholder
									{rows.length !== 1 ? 's' : ''})
								</td>
								<td className="px-4 py-3  font-bold text-gray-800">
									₦{currency(totalInvestment)}
								</td>
								{totalDividendPct > 0 && (
									<td className="px-4 py-3 text-center font-bold text-green-600">
										₦{currency(totalProjectedDividend)}
									</td>
								)}
								<td />
							</tr>
						</tfoot>
					)}
				</table>
			</div>

			{/* ── Actions ── */}
			<div className="flex justify-end">
				<button
					onClick={handleSave}
					disabled={saving || rows.length === 0}
					className="cursor-pointer bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded text-sm font-medium flex items-center gap-2"
				>
					{saving
						? 'Saving…'
						: `Save ${rows.length} Shareholder${rows.length !== 1 ? 's' : ''} for ${year}`}
				</button>
			</div>
		</main>
	);
};

export default AddShareholders;
