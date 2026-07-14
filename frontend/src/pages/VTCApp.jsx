import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState, useCallback, useMemo, useRef } from 'react';
// import '../vtc.css';

// ─── helpers (same as before) ──────────────────────────────
const formatCurrency = (val) => {
	const num = parseFloat(val) || 0;
	return num.toLocaleString('en-NG', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
};

const numberToWords = (num) => {
	if (num === 0 || isNaN(num) || num < 0) return 'Zero';
	const ones = [
		'',
		'One',
		'Two',
		'Three',
		'Four',
		'Five',
		'Six',
		'Seven',
		'Eight',
		'Nine',
		'Ten',
		'Eleven',
		'Twelve',
		'Thirteen',
		'Fourteen',
		'Fifteen',
		'Sixteen',
		'Seventeen',
		'Eighteen',
		'Nineteen',
	];
	const tens = [
		'',
		'',
		'Twenty',
		'Thirty',
		'Forty',
		'Fifty',
		'Sixty',
		'Seventy',
		'Eighty',
		'Ninety',
	];
	const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

	const convertHundreds = (n) => {
		let str = '';
		const h = Math.floor(n / 100);
		const r = n % 100;
		if (h > 0) {
			str += ones[h] + ' Hundred';
			if (r > 0) str += ' and ';
		}
		if (r > 0) {
			if (r < 20) str += ones[r];
			else {
				str += tens[Math.floor(r / 10)];
				if (r % 10 > 0) str += '-' + ones[r % 10];
			}
		}
		return str;
	};

	const whole = Math.floor(num);
	const decimal = Math.round((num - whole) * 100);

	let words = '';
	let scaleIdx = 0;
	let n = whole;
	while (n > 0) {
		const chunk = n % 1000;
		if (chunk > 0) {
			const chunkWords = convertHundreds(chunk);
			if (scaleIdx > 0) {
				words =
					chunkWords + ' ' + scales[scaleIdx] + (words ? ' ' + words : '');
			} else {
				words = chunkWords + (words ? ' ' + words : '');
			}
		}
		n = Math.floor(n / 1000);
		scaleIdx++;
	}

	if (decimal > 0) {
		const decStr = decimal < 10 ? '0' + decimal : String(decimal);
		words += ' and ' + decStr + '/100';
	}

	return words || 'Zero';
};

// ─── main App ─────────────────────────────────────────────
const VTCApp = () => {
	// ── state ──
	const [receiptNo, setReceiptNo] = useState('VTC-2026-001');
	const [customerName, setCustomerName] = useState('');
	const [vehicleReg, setVehicleReg] = useState('');
	const [destination, setDestination] = useState('');
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [timeIn, setTimeIn] = useState('');
	const [timeOut, setTimeOut] = useState('');
	const [comments, setComments] = useState('');

	const [items, setItems] = useState([
		{ id: 1, description: '', qty: '', rate: '', amount: 0 },
	]);
	const nextIdRef = useRef(2);

	// ── computed total ──
	const totalAmount = useMemo(() => {
		return items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
	}, [items]);

	const totalWords = useMemo(() => {
		return numberToWords(totalAmount);
	}, [totalAmount]);

	// ── item handlers ──
	const addItem = () => {
		setItems((prev) => [
			...prev,
			{
				id: nextIdRef.current++,
				description: '',
				qty: '',
				rate: '',
				amount: 0,
			},
		]);
	};

	const removeItem = (id) => {
		if (items.length <= 1) return;
		setItems((prev) => prev.filter((it) => it.id !== id));
	};

	const updateItem = (id, field, value) => {
		setItems((prev) =>
			prev.map((it) => {
				if (it.id !== id) return it;
				const updated = { ...it, [field]: value };
				if (field === 'qty' || field === 'rate') {
					const qty = parseFloat(field === 'qty' ? value : it.qty) || 0;
					const rate = parseFloat(field === 'rate' ? value : it.rate) || 0;
					updated.amount = qty * rate;
				}
				if (field === 'amount') {
					updated.amount = parseFloat(value) || 0;
				}
				return updated;
			}),
		);
	};

	// ── generate PDF (identical to before) ──
	const generatePDF = useCallback(() => {
		const doc = new jsPDF('p', 'mm', 'a4');
		const pageW = 210;
		const margin = 16;
		const maxW = pageW - margin * 2;
		let y = margin;

		const hr = (yPos) => {
			doc.setDrawColor(180, 190, 205);
			doc.setLineWidth(0.3);
			doc.line(margin, yPos, pageW - margin, yPos);
		};

		doc.setFontSize(16);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(11, 43, 74);
		doc.text('V.T.C. LIMITED', margin, y);
		y += 6.5;
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(60, 70, 90);
		doc.text('VICTORY TRUST COMPANY LIMITED', margin, y);
		y += 5;
		doc.setFontSize(8);
		doc.setTextColor(80, 90, 110);
		doc.text(
			'Dealers and Suppliers of general goods, Contractors and General Merchandise',
			margin,
			y,
		);
		y += 5.5;

		doc.setFontSize(8);
		doc.setTextColor(50, 60, 80);
		doc.text(
			'HEAD OFFICE: Suite A11, Mustard Seed Plaza, 5th Avenue, Gwarimpa, Abuja, Nigeria.',
			margin,
			y,
		);
		y += 4.5;
		doc.text('GSM: 08038131020, 08133405917', margin, y);
		y += 7;

		hr(y);
		y += 5;

		doc.setFontSize(18);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(11, 43, 74);
		doc.text('WAYBILL / RECEIPT', pageW / 2, y, { align: 'center' });
		y += 9;

		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(30, 40, 60);
		doc.text('No. ' + receiptNo, pageW - margin - 20, y - 2);
		y += 2;

		const fieldLabels = [
			['Customer Name', customerName || '_________________'],
			['Vehicle Reg. No.', vehicleReg || '_________________'],
			['Destination', destination || '_________________'],
			['Date', date || '________'],
			['Time In', timeIn || '________'],
			['Time Out', timeOut || '________'],
		];

		doc.setFont('helvetica', 'normal');
		doc.setFontSize(9);
		let col1 = margin;
		let col2 = margin + 75;
		let rowH = 7.5;

		fieldLabels.forEach(([label, value], idx) => {
			const x = idx < 3 ? col1 : col2;
			const yy = y + (idx % 3) * rowH;
			doc.setTextColor(80, 90, 110);
			doc.setFont('helvetica', 'bold');
			doc.text(label + ':', x, yy);
			doc.setTextColor(20, 30, 50);
			doc.setFont('helvetica', 'normal');
			doc.text(String(value), x + 38, yy);
		});

		y += 3 * rowH + 5;
		hr(y);
		y += 6;

		const tableData = items.map((it, idx) => [
			idx + 1,
			it.description || '—',
			it.qty || '0',
			it.rate ? '₦' + formatCurrency(it.rate) : '₦0.00',
			it.amount ? '₦' + formatCurrency(it.amount) : '₦0.00',
		]);

		autoTable(doc, {
			startY: y,
			margin: { left: margin, right: margin },
			head: [
				['S/N', 'Description of Goods', 'Qty/Tonnage', 'Rate/Kg', 'Amount'],
			],
			body: tableData,
			theme: 'grid',
			headStyles: {
				fillColor: [245, 248, 253],
				textColor: [30, 50, 70],
				fontStyle: 'bold',
				fontSize: 8,
				halign: 'left',
				cellPadding: 3,
			},
			styles: {
				fontSize: 8,
				cellPadding: 3,
				textColor: [30, 40, 60],
			},
			columnStyles: {
				0: { cellWidth: 16, halign: 'center' },
				1: { cellWidth: 'auto' },
				2: { cellWidth: 28, halign: 'center' },
				3: { cellWidth: 32, halign: 'right' },
				4: { cellWidth: 34, halign: 'right' },
			},
		});

		const finalY = doc.lastAutoTable.finalY || y + 50;
		y = finalY + 4;

		hr(y);
		y += 4;
		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(11, 43, 74);
		doc.text('TOTAL', pageW - margin - 60, y);
		doc.text('₦' + formatCurrency(totalAmount), pageW - margin - 8, y, {
			align: 'right',
		});
		y += 7;

		doc.setFontSize(8);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(40, 50, 70);
		doc.text('Amount in Words:', margin, y);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(20, 30, 50);
		const wordsLine =
			totalWords + ' Naira' + (totalAmount % 1 !== 0 ? ' Kobo' : '');
		doc.text(wordsLine, margin + 35, y);
		y += 7;

		if (comments) {
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(40, 50, 70);
			doc.text('Other Comments:', margin, y);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(20, 30, 50);
			doc.text(comments, margin + 35, y);
			y += 6;
		}

		hr(y);
		y += 6;
		doc.setFontSize(9);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(60, 70, 90);
		doc.text("Customer/Driver's Sign: ________________________", margin, y);
		doc.text('FOR: V.T.C. Limited', pageW - margin - 40, y);
		y += 8;

		doc.setDrawColor(200, 210, 225);
		doc.setLineWidth(0.2);
		doc.line(margin, y, pageW - margin, y);

		doc.save('VTC_Receipt_' + receiptNo + '.pdf');
	}, [
		receiptNo,
		customerName,
		vehicleReg,
		destination,
		date,
		timeIn,
		timeOut,
		comments,
		items,
		totalAmount,
		totalWords,
	]);

	const resetForm = () => {
		setReceiptNo('VTC-2026-001');
		setCustomerName('');
		setVehicleReg('');
		setDestination('');
		setDate(new Date().toISOString().slice(0, 10));
		setTimeIn('');
		setTimeOut('');
		setComments('');
		setItems([{ id: 1, description: '', qty: '', rate: '', amount: 0 }]);
		nextIdRef.current = 2;
	};

	// ── render with Tailwind classes ──
	return (
		<div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 my-6 transition-all">
			{/* header */}
			<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
				<h1 className="text-xl font-bold text-[#0b2b4a] flex items-center gap-2">
					📄 V.T.C. Receipt
					<span className="text-sm font-normal text-gray-500">Generator</span>
				</h1>
				<div className="flex flex-wrap gap-2">
					<button
						onClick={resetForm}
						className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
					>
						⟳ Reset
					</button>
					<button
						onClick={generatePDF}
						className="px-4 py-1.5 text-sm font-medium bg-green-700 text-white rounded-lg hover:bg-green-800 shadow-sm transition"
					>
						⬇ PDF
					</button>
				</div>
			</div>

			{/* form grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
				<div>
					<label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
						Receipt No.
					</label>
					<input
						value={receiptNo}
						onChange={(e) => setReceiptNo(e.target.value)}
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50"
					/>
				</div>
				<div>
					<label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
						Date
					</label>
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50"
					/>
				</div>
				<div>
					<label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
						Customer Name
					</label>
					<input
						value={customerName}
						onChange={(e) => setCustomerName(e.target.value)}
						placeholder="Full name"
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50"
					/>
				</div>
				<div>
					<label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
						Vehicle Reg. No.
					</label>
					<input
						value={vehicleReg}
						onChange={(e) => setVehicleReg(e.target.value)}
						placeholder="e.g. ABC-123-XY"
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50"
					/>
				</div>
				<div>
					<label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
						Destination
					</label>
					<input
						value={destination}
						onChange={(e) => setDestination(e.target.value)}
						placeholder="City / Address"
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50"
					/>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
							Time In
						</label>
						<input
							type="time"
							value={timeIn}
							onChange={(e) => setTimeIn(e.target.value)}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50"
						/>
					</div>
					<div>
						<label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
							Time Out
						</label>
						<input
							type="time"
							value={timeOut}
							onChange={(e) => setTimeOut(e.target.value)}
							className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50"
						/>
					</div>
				</div>
			</div>

			{/* items section */}
			<div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
				<div className="bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between border-b border-gray-200">
					<h3 className="text-sm font-semibold text-[#0b2b4a]">
						📦 Goods / Items
					</h3>
					<button
						onClick={addItem}
						className="px-3 py-1 text-sm font-medium bg-[#0b2b4a] text-white rounded-lg hover:bg-[#143a5e] transition"
					>
						+ Add Row
					</button>
				</div>
				<div className="overflow-x-auto p-1">
					<table className="w-full text-sm min-w-[480px]">
						<thead>
							<tr className="bg-gray-100 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600">
								<th className="py-2 px-3 w-10 text-center">#</th>
								<th className="py-2 px-3 min-w-[140px]">Description</th>
								<th className="py-2 px-3 w-24">Qty/Tonnage</th>
								<th className="py-2 px-3 w-28">Rate/Kg (₦)</th>
								<th className="py-2 px-3 w-28">Amount (₦)</th>
								<th className="py-2 px-3 w-10"></th>
							</tr>
						</thead>
						<tbody>
							{items.map((it, idx) => (
								<tr
									key={it.id}
									className="border-b border-gray-100 last:border-0"
								>
									<td className="py-1.5 px-3 text-center font-medium text-gray-600">
										{idx + 1}
									</td>
									<td className="py-1.5 px-3">
										<input
											value={it.description}
											onChange={(e) =>
												updateItem(it.id, 'description', e.target.value)
											}
											placeholder="Item description"
											className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50"
										/>
									</td>
									<td className="py-1.5 px-3">
										<input
											type="number"
											step="any"
											value={it.qty}
											onChange={(e) => updateItem(it.id, 'qty', e.target.value)}
											placeholder="0"
											className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50"
										/>
									</td>
									<td className="py-1.5 px-3">
										<input
											type="number"
											step="any"
											value={it.rate}
											onChange={(e) =>
												updateItem(it.id, 'rate', e.target.value)
											}
											placeholder="0.00"
											className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50"
										/>
									</td>
									<td className="py-1.5 px-3">
										<input
											type="number"
											step="any"
											value={it.amount}
											onChange={(e) =>
												updateItem(it.id, 'amount', e.target.value)
											}
											placeholder="0.00"
											className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm font-semibold text-[#0b2b4a] focus:ring-1 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50"
										/>
									</td>
									<td className="py-1.5 px-3 text-center">
										<button
											onClick={() => removeItem(it.id)}
											disabled={items.length <= 1}
											className={`text-sm font-medium ${items.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-800'}`}
										>
											✕
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between">
					<div className="text-sm font-bold text-[#0b2b4a]">
						<span className="font-normal text-gray-600">Total:</span> ₦
						{formatCurrency(totalAmount)}
					</div>
					<div className="text-xs text-gray-500 font-medium">
						({totalWords || 'Zero'} Naira)
					</div>
				</div>
			</div>

			{/* comments & signature */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
				<div className="sm:col-span-2">
					<label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
						Other Comments
					</label>
					<textarea
						value={comments}
						onChange={(e) => setComments(e.target.value)}
						placeholder="Additional notes, special instructions…"
						rows="2"
						className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0b2b4a] focus:border-transparent outline-none bg-gray-50 resize-y"
					/>
				</div>
				<div className="signature-box-dash rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 text-center min-h-[70px]">
					<div className="text-sm font-semibold text-[#0b2b4a]">
						✍ Customer / Driver’s Sign
					</div>
					<div className="text-xs text-gray-400 mt-1">_________________</div>
					<div className="text-[10px] text-gray-400 mt-0.5">
						FOR: V.T.C. Limited
					</div>
				</div>
			</div>

			{/* bottom actions */}
			<div className="flex flex-wrap justify-end gap-3 mt-6">
				<button
					onClick={resetForm}
					className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition"
				>
					Clear All
				</button>
				<button
					onClick={generatePDF}
					className="px-5 py-2 text-sm font-medium bg-green-700 text-white rounded-lg hover:bg-green-800 shadow-sm transition flex items-center gap-2"
				>
					⬇ Download PDF Receipt
				</button>
			</div>
		</div>
	);
};

export default VTCApp;
