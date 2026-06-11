import { Download, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
	createStatementApi,
	duplicateStatementApi,
	fetchStatementByYear,
	fetchStatements,
	updateStatementApi,
} from '../hooks/axiosApis';

/* ─────────────────────────────────────────── */
/* Constants                                   */
/* ─────────────────────────────────────────── */

const DEFAULT_CATEGORIES = [
	'Cash',
	'Bank Balance',
	'Debtors',
	'Stocks',
	'Investments',
	'Fixed Assets',
	'Liabilities',
	'Creditors',
	'Shareholders',
	'Other',
];

const createEmptyRow = () => ({
	_tempId: crypto.randomUUID(),
	category: 'Cash',
	title: '',
	description: '',
	type: 'credit',
	amount: 0,
});

const buildDefaultStatement = (year = new Date().getFullYear()) => ({
	year,
	statementName: `Financial Statement ${year}`,
	openingCapital: 0,
	zakatRate: 2.5,
	items: [createEmptyRow()],
});

/* ─────────────────────────────────────────── */
/* Helpers                                     */
/* ─────────────────────────────────────────── */

const currency = (amount) =>
	Number(amount || 0).toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

/** Attach _tempId to each item for React keying */
const normaliseItems = (items = []) =>
	items.map((item) => ({ _tempId: item._id || crypto.randomUUID(), ...item }));

/** Strip _tempId before sending to the API */
const stripTempIds = (items = []) => items.map(({ _tempId, ...rest }) => rest);

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */

const FinancialStatement = () => {
	const queryClient = useQueryClient();
	const currentYear = new Date().getFullYear();

	const [statement, setStatement] = useState(
		buildDefaultStatement(currentYear),
	);
	const [isExisting, setIsExisting] = useState(false);
	const [loadingYear, setLoadingYear] = useState(false);

	/* ── List of all statements (year selector) ── */
	const {
		data: savedStatements = [],
		isLoading: loadingList,
		refetch: refetchList,
	} = useQuery({
		queryKey: ['statements'],
		queryFn: fetchStatements,
		staleTime: 30 * 1000,
	});

	/* ── Create ── */
	const { mutate: createStatement, isPending: creating } = useMutation({
		mutationFn: createStatementApi,
		onSuccess: (data) => {
			toast.success('Statement created');
			setStatement({ ...data, items: normaliseItems(data.items) });
			setIsExisting(true);
			queryClient.invalidateQueries({ queryKey: ['statements'] });
		},
		onError: (err) => {
			toast.error(err?.response?.data?.message || 'Failed to create statement');
		},
	});

	/* ── Update ── */
	const { mutate: updateStatement, isPending: updating } = useMutation({
		mutationFn: ({ year, payload }) => updateStatementApi({ year, payload }),
		onSuccess: (data) => {
			toast.success('Statement saved');
			setStatement({ ...data, items: normaliseItems(data.items) });
			queryClient.invalidateQueries({ queryKey: ['statements'] });
		},
		onError: (err) => {
			toast.error(err?.response?.data?.message || 'Failed to save statement');
		},
	});

	/* ── Duplicate ── */
	const { mutate: duplicateStatementMutation, isPending: duplicating } =
		useMutation({
			mutationFn: ({ year, newYear }) =>
				duplicateStatementApi({ year, newYear }),
			onSuccess: (data) => {
				toast.success(`Duplicated to ${data.year}`);
				setStatement({ ...data, items: normaliseItems(data.items) });
				setIsExisting(true);
				queryClient.invalidateQueries({ queryKey: ['statements'] });
			},
			onError: (err) => {
				toast.error(
					err?.response?.data?.message || 'Failed to duplicate statement',
				);
			},
		});

	const isSaving = creating || updating;

	/* ── Load a year from the selector ── */
	const loadYear = async (year) => {
		if (!year) return;
		setLoadingYear(true);
		try {
			const data = await fetchStatementByYear(year);
			setStatement({ ...data, items: normaliseItems(data.items) });
			setIsExisting(true);
		} catch (err) {
			toast.error(err?.response?.data?.message || 'Failed to load statement');
		} finally {
			setLoadingYear(false);
		}
	};

	/* ── Save (create or update) ── */
	const handleSave = () => {
		const payload = {
			year: statement.year,
			statementName: statement.statementName,
			openingCapital: statement.openingCapital,
			zakatRate: statement.zakatRate,
			items: stripTempIds(statement.items),
		};

		if (isExisting || statement._id) {
			updateStatement({ year: statement.year, payload });
		} else {
			createStatement(payload);
		}
	};

	/* ── Duplicate to next year ── */
	const handleDuplicate = () => {
		const nextYear = Number(statement.year) + 1;
		duplicateStatementMutation({ year: statement.year, newYear: nextYear });
	};

	/* ─────────────────────────────────────────── */
	/* Entry helpers                               */
	/* ─────────────────────────────────────────── */

	const addRow = () =>
		setStatement((prev) => ({
			...prev,
			items: [...prev.items, createEmptyRow()],
		}));

	const updateRow = (tempId, field, value) =>
		setStatement((prev) => ({
			...prev,
			items: prev.items.map((row) =>
				row._tempId === tempId
					? { ...row, [field]: field === 'amount' ? Number(value) : value }
					: row,
			),
		}));

	const deleteRow = (tempId) =>
		setStatement((prev) => ({
			...prev,
			items: prev.items.filter((row) => row._tempId !== tempId),
		}));

	/* ─────────────────────────────────────────── */
	/* Calculations (real-time, client-side)       */
	/* ─────────────────────────────────────────── */

	const calc = useMemo(() => {
		const totalCredits = statement.items
			.filter((i) => i.type === 'credit')
			.reduce((sum, i) => sum + Number(i.amount || 0), 0);

		const totalDebits = statement.items
			.filter((i) => i.type === 'debit')
			.reduce((sum, i) => sum + Number(i.amount || 0), 0);

		const grossCapital = Number(statement.openingCapital || 0) + totalCredits;
		const netCapital = grossCapital - totalDebits;
		const zakatAmount = (netCapital * Number(statement.zakatRate || 0)) / 100;
		const closingCapital = netCapital - zakatAmount;

		return {
			totalCredits,
			totalDebits,
			grossCapital,
			netCapital,
			zakatAmount,
			closingCapital,
		};
	}, [statement]);

	const handleDownload = () => {
		console.log('statement', statement, 'calc', calc);
		toast.success('Download coming soon');
	};

	/* ─────────────────────────────────────────── */
	/* Render                                      */
	/* ─────────────────────────────────────────── */
	return (
		<div className="p-6 space-y-4">
			{/* Header */}
			<div className="flex justify-between items-center flex-wrap gap-2">
				<h2 className="text-2xl font-bold">Financial Statement</h2>

				<div className="flex gap-2 flex-wrap">
					<button
						onClick={() => refetchList()}
						disabled={loadingList}
						title="Refresh list"
						className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer flex items-center gap-1 text-sm"
					>
						<RefreshCw
							className={`h-4 w-4 ${loadingList ? 'animate-spin' : ''}`}
						/>
					</button>

					<button
						onClick={handleDuplicate}
						disabled={duplicating || !statement.year}
						className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded cursor-pointer text-sm"
					>
						{duplicating ? 'Duplicating…' : 'Duplicate +1yr'}
					</button>

					<button
						onClick={handleSave}
						disabled={isSaving}
						className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded cursor-pointer text-sm"
					>
						{isSaving ? 'Saving…' : isExisting ? 'Update' : 'Save'}
					</button>
				</div>
			</div>

			{/* Year selector */}
			<div className="flex gap-2 items-center">
				<select
					className="border p-2 rounded text-sm"
					defaultValue=""
					disabled={loadingList || loadingYear}
					onChange={(e) => loadYear(e.target.value)}
				>
					<option value="" disabled>
						{loadingList ? 'Loading…' : 'Load statement…'}
					</option>
					{savedStatements?.length > 0 &&
						savedStatements?.map((item) => (
							<option key={item._id || item.year} value={item.year}>
								{item.year} —{' '}
								{item.statementName || `Financial Statement ${item.year}`}
							</option>
						))}
				</select>

				{loadingYear && <span className="text-xs text-gray-500">Loading…</span>}
				{isExisting && !loadingYear && (
					<span className="text-xs text-green-600 font-medium">✓ Synced</span>
				)}
			</div>

			{/* Meta fields */}
			<div className="grid md:grid-cols-4 gap-3">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Name
					</label>
					<input
						className="border p-2 rounded w-full text-sm"
						value={statement.statementName}
						onChange={(e) =>
							setStatement((prev) => ({
								...prev,
								statementName: e.target.value,
							}))
						}
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Year
					</label>
					<input
						type="number"
						className="border p-2 rounded w-full text-sm"
						value={statement.year}
						onChange={(e) =>
							setStatement((prev) => ({
								...prev,
								year: Number(e.target.value),
								statementName: `Financial Statement ${e.target.value}`,
							}))
						}
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Opening Capital
					</label>
					<input
						type="number"
						className="border p-2 rounded w-full text-sm"
						value={statement.openingCapital}
						onChange={(e) =>
							setStatement((prev) => ({
								...prev,
								openingCapital: Number(e.target.value),
							}))
						}
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Zakat Rate (%)
					</label>
					<input
						type="number"
						step="0.1"
						className="border p-2 rounded w-full text-sm"
						value={statement.zakatRate}
						onChange={(e) =>
							setStatement((prev) => ({
								...prev,
								zakatRate: Number(e.target.value),
							}))
						}
					/>
				</div>
			</div>

			{/* Entries table */}
			<div className="bg-white rounded-lg shadow-md p-4 overflow-auto">
				<table className="w-full border text-sm">
					<thead>
						<tr className="bg-gray-100 text-left">
							<th className="p-2 whitespace-nowrap">Category</th>
							<th className="p-2 whitespace-nowrap">Name</th>
							<th className="p-2 whitespace-nowrap">Description</th>
							<th className="p-2 whitespace-nowrap">Type</th>
							<th className="p-2 whitespace-nowrap text-right">Amount</th>
							<th className="p-2 whitespace-nowrap">Action</th>
						</tr>
					</thead>
					<tbody>
						{statement.items.map((row) => (
							<tr key={row._tempId} className="hover:bg-gray-50">
								<td className="border px-1 whitespace-nowrap min-w-[140px]">
									<select
										className="w-full p-1 bg-transparent"
										value={row.category}
										onChange={(e) =>
											updateRow(row._tempId, 'category', e.target.value)
										}
									>
										{DEFAULT_CATEGORIES.map((cat) => (
											<option key={cat} value={cat}>
												{cat}
											</option>
										))}
									</select>
								</td>
								<td className="border px-1 min-w-[140px]">
									<input
										className="w-full p-1 bg-transparent"
										value={row.title}
										onChange={(e) =>
											updateRow(row._tempId, 'title', e.target.value)
										}
									/>
								</td>
								<td className="border px-1 min-w-[160px]">
									<input
										className="w-full p-1 bg-transparent"
										value={row.description}
										onChange={(e) =>
											updateRow(row._tempId, 'description', e.target.value)
										}
									/>
								</td>
								<td className="border px-1 whitespace-nowrap">
									<select
										className="p-1 bg-transparent"
										value={row.type}
										onChange={(e) =>
											updateRow(row._tempId, 'type', e.target.value)
										}
									>
										<option value="credit">Credit</option>
										<option value="debit">Debit</option>
									</select>
								</td>
								<td className="border px-1 whitespace-nowrap min-w-[130px]">
									<input
										type="number"
										className="w-full p-1 bg-transparent"
										value={row.amount}
										onChange={(e) =>
											updateRow(row._tempId, 'amount', e.target.value)
										}
									/>
								</td>
								<td className="border p-2 whitespace-nowrap">
									<button
										onClick={() => deleteRow(row._tempId)}
										className="text-red-600 hover:text-red-800 p-1 cursor-pointer text-xs"
									>
										Delete
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				<button
					onClick={addRow}
					className="cursor-pointer bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-sm mt-4"
				>
					+ Add Row
				</button>
			</div>

			{/* Summary */}
			<div className="border rounded p-4 bg-gray-50">
				<h3 className="font-bold text-lg mb-4">Statement Summary</h3>

				<div className="grid md:grid-cols-2 gap-3 text-sm">
					<div>
						Opening Capital:
						<strong className="ml-1">
							{currency(statement.openingCapital)}
						</strong>
					</div>
					<div>
						Total Credits:
						<strong className="ml-1 text-green-700">
							{currency(calc.totalCredits)}
						</strong>
					</div>
					<div>
						Gross Capital:
						<strong className="ml-1">{currency(calc.grossCapital)}</strong>
					</div>
					<div>
						Total Debits:
						<strong className="ml-1 text-red-600">
							{currency(calc.totalDebits)}
						</strong>
					</div>
					<div>
						Net Capital:
						<strong className="ml-1">{currency(calc.netCapital)}</strong>
					</div>
					<div>
						Zakat ({statement.zakatRate}%):
						<strong className="ml-1 text-orange-600">
							{currency(calc.zakatAmount)}
						</strong>
					</div>
					<div className="md:col-span-2 border-t pt-2 mt-1">
						Closing Capital:
						<strong className="ml-1 text-lg">
							{currency(calc.closingCapital)}
						</strong>
					</div>
				</div>

				<div className="flex justify-between mt-4">
					<button
						onClick={handleDownload}
						className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2 w-full md:w-auto justify-center"
					>
						<Download className="h-4 w-4" />
						Download
					</button>
				</div>
			</div>
		</div>
	);
};

export default FinancialStatement;
