import React, { useState, useRef, useMemo, useCallback } from 'react';
import '../vtc.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// ─── helpers ──────────────────────────────────────────────
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

const VTCLimited = () => {
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
				// auto-calc amount if qty & rate present
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

	// ── generate PDF ──
	const generatePDF = useCallback(() => {
		// const { jsPDF } = window.jspdf;
		const doc = new jsPDF('p', 'mm', 'a4');
		const pageW = 210;
		const margin = 16;
		const maxW = pageW - margin * 2;
		let y = margin;

		// ── helper: draw line ──
		const hr = (yPos) => {
			doc.setDrawColor(180, 190, 205);
			doc.setLineWidth(0.3);
			doc.line(margin, yPos, pageW - margin, yPos);
		};

		// ── header ──
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

		// ── title ──
		doc.setFontSize(18);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(11, 43, 74);
		doc.text('WAYBILL / RECEIPT', pageW / 2, y, { align: 'center' });
		y += 9;

		// ── receipt no ──
		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(30, 40, 60);
		doc.text('No. ' + receiptNo, pageW - margin - 20, y - 2);
		y += 2;

		// ── fields grid ──
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

		// ── table ──
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
			didDrawPage: (data) => {
				// we'll capture final y
			},
		});

		// get final y from autoTable
		const finalY = doc.lastAutoTable.finalY || y + 50;
		y = finalY + 4;

		// ── total ──
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

		// ── amount in words ──
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

		// ── comments ──
		if (comments) {
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(40, 50, 70);
			doc.text('Other Comments:', margin, y);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(20, 30, 50);
			doc.text(comments, margin + 35, y);
			y += 6;
		}

		// ── signature ──
		hr(y);
		y += 6;
		doc.setFontSize(9);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(60, 70, 90);
		doc.text("Customer/Driver's Sign: ________________________", margin, y);
		doc.text('FOR: V.T.C. Limited', pageW - margin - 40, y);
		y += 8;

		// ── footer line ──
		doc.setDrawColor(200, 210, 225);
		doc.setLineWidth(0.2);
		doc.line(margin, y, pageW - margin, y);

		// ── save ──
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

	// ── reset form ──
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

	// ── render ──
	return (
		<div className="app">
			<div className="app-header">
				<h1>
					📄 V.T.C. Receipt
					<small>Generator</small>
				</h1>
				<div className="header-actions">
					<button className="btn btn-outline btn-sm" onClick={resetForm}>
						⟳ Reset
					</button>
					<button className="btn btn-success" onClick={generatePDF}>
						⬇ PDF
					</button>
				</div>
			</div>

			{/* ── main form ── */}
			<div className="form-grid">
				<div className="form-group">
					<label>Receipt No.</label>
					<input
						value={receiptNo}
						onChange={(e) => setReceiptNo(e.target.value)}
					/>
				</div>
				<div className="form-group">
					<label>Date</label>
					<input
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
					/>
				</div>
				<div className="form-group">
					<label>Customer Name</label>
					<input
						value={customerName}
						onChange={(e) => setCustomerName(e.target.value)}
						placeholder="Full name"
					/>
				</div>
				<div className="form-group">
					<label>Vehicle Reg. No.</label>
					<input
						value={vehicleReg}
						onChange={(e) => setVehicleReg(e.target.value)}
						placeholder="e.g. ABC-123-XY"
					/>
				</div>
				<div className="form-group">
					<label>Destination</label>
					<input
						value={destination}
						onChange={(e) => setDestination(e.target.value)}
						placeholder="City / Address"
					/>
				</div>
				<div className="form-group">
					<label>Time In</label>
					<input
						type="time"
						value={timeIn}
						onChange={(e) => setTimeIn(e.target.value)}
					/>
				</div>
				<div className="form-group">
					<label>Time Out</label>
					<input
						type="time"
						value={timeOut}
						onChange={(e) => setTimeOut(e.target.value)}
					/>
				</div>
			</div>

			{/* ── items ── */}
			<div className="items-section">
				<div className="items-header">
					<h3>📦 Goods / Items</h3>
					<button className="btn btn-primary btn-sm" onClick={addItem}>
						+ Add Row
					</button>
				</div>
				<div className="items-table-wrap">
					<table className="items-table">
						<thead>
							<tr>
								<th className="col-sn">#</th>
								<th className="col-desc">Description</th>
								<th className="col-qty">Qty / Tonnage</th>
								<th className="col-rate">Rate / Kg (₦)</th>
								<th className="col-amount">Amount (₦)</th>
								<th className="col-action"></th>
							</tr>
						</thead>
						<tbody>
							{items.map((it, idx) => (
								<tr key={it.id}>
									<td className="col-sn">{idx + 1}</td>
									<td className="col-desc">
										<input
											value={it.description}
											onChange={(e) =>
												updateItem(it.id, 'description', e.target.value)
											}
											placeholder="Item description"
										/>
									</td>
									<td className="col-qty">
										<input
											type="number"
											step="any"
											value={it.qty}
											onChange={(e) => updateItem(it.id, 'qty', e.target.value)}
											placeholder="0"
										/>
									</td>
									<td className="col-rate">
										<input
											type="number"
											step="any"
											value={it.rate}
											onChange={(e) =>
												updateItem(it.id, 'rate', e.target.value)
											}
											placeholder="0.00"
										/>
									</td>
									<td className="col-amount">
										<input
											type="number"
											step="any"
											value={it.amount}
											onChange={(e) =>
												updateItem(it.id, 'amount', e.target.value)
											}
											placeholder="0.00"
											style={{ fontWeight: 600, color: '#0b2b4a' }}
										/>
									</td>
									<td className="col-action">
										<button
											className="btn btn-danger btn-sm"
											onClick={() => removeItem(it.id)}
											disabled={items.length <= 1}
											style={{
												padding: '2px 8px',
												fontSize: '14px',
												lineHeight: 1,
											}}
										>
											✕
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="items-total">
					<span>Total:</span> ₦{formatCurrency(totalAmount)}
					<span style={{ fontWeight: 400, fontSize: '13px', color: '#4a5b77' }}>
						({totalWords || 'Zero'} Naira)
					</span>
				</div>
			</div>

			{/* ── comments & signature ── */}
			<div className="footer-form">
				<div className="form-group">
					<label>Other Comments</label>
					<textarea
						value={comments}
						onChange={(e) => setComments(e.target.value)}
						placeholder="Additional notes, special instructions…"
						rows={2}
					/>
				</div>
				<div className="signature-box">
					<div className="sig-label">✍ Customer / Driver’s Sign</div>
					<div style={{ fontSize: '12px', color: '#8a9bb5' }}>
						_________________
					</div>
					<div style={{ fontSize: '10px', marginTop: '4px', color: '#8a9bb5' }}>
						FOR: V.T.C. Limited
					</div>
				</div>
			</div>

			<div
				style={{
					marginTop: '18px',
					display: 'flex',
					justifyContent: 'flex-end',
					gap: '12px',
				}}
			>
				<button className="btn btn-outline" onClick={resetForm}>
					Clear All
				</button>
				<button className="btn btn-success" onClick={generatePDF}>
					⬇ Download PDF Receipt
				</button>
			</div>
		</div>
	);
};

export default VTCLimited;
