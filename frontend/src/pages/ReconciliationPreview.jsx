import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AuthContext from '../context/authContext.jsx';
import { fetchReconciliation } from '../hooks/axiosApis.js';
import getError from '../hooks/getError.js';
import toast from 'react-hot-toast';
import Loader from '../components/Loader.jsx';
import moment from 'moment';
import jsPDF from 'jspdf';
import logo from '../assets/logo.png';
import seal from '../assets/seal.png';
import callIcon from '../assets/call.png';

const ReconciliationPreview = () => {
	const { id: customerId, reconId } = useParams();
	const navigate = useNavigate();
	const { user } = useContext(AuthContext);

	const [loading, setLoading] = useState(false);
	const [logoBase64, setLogoBase64] = useState('');
	const [sealBase64, setSealBase64] = useState('');
	const [callBase64, setCallBase64] = useState('');

	// ── Load images as base64 for jsPDF ──────────────────────────────────────
	useEffect(() => {
		const toBase64 = (src, setter) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.src = src;
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				canvas.getContext('2d').drawImage(img, 0, 0);
				setter(canvas.toDataURL('image/png'));
			};
		};
		toBase64(logo, setLogoBase64);
		toBase64(seal, setSealBase64);
		toBase64(callIcon, setCallBase64);
	}, []);

	const { data, isLoading, error } = useQuery({
		queryKey: ['reconciliation', reconId],
		queryFn: () => fetchReconciliation({ user, id: reconId }),
		enabled: Boolean(reconId),
	});

	useEffect(() => {
		if (error) toast.error(getError(error));
	}, [error]);

	const recon = data?.reconciliation;
	const customer = data?.customer;

	// ── Computed values ───────────────────────────────────────────────────────
	const totalDeductions =
		recon?.deductions?.reduce((s, d) => s + (d.amount || 0), 0) ?? 0;
	const subtotal1 =
		(recon?.totalFromLedger ?? 0) - (recon?.lessBank ?? 0);
	const monthLabel = recon ? moment(recon.month).format('MMMM, YYYY') : '';
	const filename = recon
		? `${moment(recon.month).format('MMM-YYYY')}-reconciliation`
		: 'reconciliation';

	// ── jsPDF download ────────────────────────────────────────────────────────
	const downloadPDF = async () => {
		if (!recon) return;
		setLoading(true);

		try {
			const doc = new jsPDF('p', 'mm', 'a4');
			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();

			// ── WATERMARK ────────────────────────────────────────────────────
			if (logoBase64) {
				const ww = 120, wh = 140;
				const cx = (pageWidth - ww) / 2;
				const cy = (pageHeight - wh) / 2;
				if (doc.setGState) doc.setGState(new doc.GState({ opacity: 0.04 }));
				doc.addImage(logoBase64, 'PNG', cx, cy, ww, wh);
				if (doc.setGState) doc.setGState(new doc.GState({ opacity: 1 }));
			}

			// ── HEADER ───────────────────────────────────────────────────────
			if (logoBase64) doc.addImage(logoBase64, 'PNG', 14, 10, 25, 25);

			doc.setFont('helvetica', 'bold');
			doc.setFontSize(15);
			doc.text('SALISU KANO INTERNATIONAL LIMITED', pageWidth / 2, 18, {
				align: 'center',
			});

			doc.setFont('helvetica', 'normal');
			doc.setFontSize(9);
			doc.text(
				"Scrap Materials' Suppliers and General Contractors",
				pageWidth / 2,
				24,
				{ align: 'center' }
			);
			doc.text(
				'No. 2 & 3 Block P, Dalar Gyade Market, Kano State',
				pageWidth / 2,
				29,
				{ align: 'center' }
			);

			// Phone icon + numbers top-right
			const phoneX = pageWidth - 14;
			if (callBase64) {
				doc.addImage(callBase64, 'PNG', phoneX - 28, 18, 8, 8);
			}
			doc.text('08023239018', phoneX, 20, { align: 'right' });
			doc.text('08067237273', phoneX, 26, { align: 'right' });

			// Divider + black title banner
			doc.setLineWidth(0.5);
			doc.line(14, 36, pageWidth - 14, 36);

			doc.setFillColor(0, 0, 0);
			doc.rect(pageWidth / 2 - 52, 37, 104, 10, 'F');
			doc.setTextColor(255, 255, 255);
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(12);
			doc.text('RECONCILIATION STATEMENT', pageWidth / 2, 44, {
				align: 'center',
			});
			doc.setTextColor(0, 0, 0);

			// ── SUB-TITLE ────────────────────────────────────────────────────
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(11);
			doc.text(`${monthLabel} Reconciliation A/c`, pageWidth / 2, 56, {
				align: 'center',
			});
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(10);
			doc.text(
				`Between ${customer?.name?.toUpperCase() ?? ''} & Salisu Kano`,
				pageWidth / 2,
				63,
				{ align: 'center' }
			);

			doc.setLineWidth(0.3);
			doc.line(14, 67, pageWidth - 14, 67);

			// ── STATEMENT TABLE ──────────────────────────────────────────────
			const colLeft = 20;
			const colMid = pageWidth - 65;
			const colRight = pageWidth - 22;
			let y = 77;
			const rowGap = 9;

			// jsPDF helvetica doesn't render ₦ — use "NGN" label in headers
			const naira = 'NGN';
			const fmt = (n) => Number(n || 0).toLocaleString('en-NG');

			// Column headers
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(10);
			doc.text('Statement', colLeft, y);
			doc.text(naira, colMid, y, { align: 'right' });
			doc.text(naira, colRight, y, { align: 'right' });
			y += 3;
			doc.setLineWidth(0.4);
			doc.line(colLeft, y, pageWidth - 14, y);
			y += rowGap;

			// Row: Total from ledger
			doc.setFont('helvetica', 'normal');
			doc.text(
				`Total From Ledger @ ${customer?.name ?? 'Company'}`,
				colLeft,
				y
			);
			doc.text(fmt(recon.totalFromLedger), colRight, y, { align: 'right' });
			y += rowGap;

			// Row: Less bank
			doc.text('Less: Bank @ SKIL', colLeft, y);
			doc.text(fmt(recon.lessBank), colRight, y, { align: 'right' });
			doc.setLineWidth(0.2);
			doc.line(colMid + 4, y + 2, colRight + 2, y + 2);
			y += rowGap;

			// Subtotal after bank
			doc.setFont('helvetica', 'bold');
			doc.text(fmt(subtotal1), colRight, y, { align: 'right' });
			doc.setLineWidth(0.2);
			doc.line(colMid + 4, y + 2, colRight + 2, y + 2);
			y += rowGap + 2;

			// Deductions block
			if (recon.deductions?.length > 0) {
				doc.setFont('helvetica', 'bold');
				doc.text('Less: K.C Contractor / Not Reflected', colLeft, y);
				doc.text(naira, colMid, y, { align: 'right' });
				y += rowGap;

				doc.setFont('helvetica', 'normal');
				recon.deductions.forEach((d) => {
					doc.text(`   ${d.description}`, colLeft, y);
					doc.text(fmt(d.amount), colMid, y, { align: 'right' });
					doc.setLineWidth(0.2);
					doc.line(colMid - 22, y + 2, colMid + 2, y + 2);
					y += rowGap;
				});

				// Sum of deductions
				doc.setFont('helvetica', 'bold');
				doc.text(fmt(totalDeductions), colMid, y, { align: 'right' });
				doc.text(fmt(totalDeductions), colRight, y, { align: 'right' });
				doc.setLineWidth(0.3);
				doc.line(colMid - 22, y + 2, colMid + 2, y + 2);
				doc.line(colMid + 4, y + 2, colRight + 2, y + 2);
				y += rowGap + 3;
			}

			// Balance Unpaid
			doc.setLineWidth(0.5);
			doc.line(14, y - 2, pageWidth - 14, y - 2);
			doc.setFont('helvetica', 'bold');
			doc.setFontSize(11);
			doc.text(`Balance Unpaid ${monthLabel}  =`, colLeft, y + 5);
			doc.text(fmt(recon.balanceUnpaid), colRight, y + 5, { align: 'right' });
			// double underline
			doc.setLineWidth(0.4);
			doc.line(colMid + 4, y + 8, colRight + 2, y + 8);
			doc.line(colMid + 4, y + 9, colRight + 2, y + 9);
			y += 22;

			// Notes
			if (recon.notes) {
				doc.setFont('helvetica', 'italic');
				doc.setFontSize(9);
				const noteLines = doc.splitTextToSize(
					`Note: ${recon.notes}`,
					pageWidth - 28
				);
				doc.text(noteLines, colLeft, y);
				y += noteLines.length * 5 + 6;
			}

			// ── SIGNATURE SECTION ────────────────────────────────────────────
			const footerY = Math.max(y + 20, pageHeight - 65);

			doc.setFont('helvetica', 'normal');
			doc.setFontSize(10);

			// LEFT — Prepared by (label above line, name/date below)
			doc.text('Prepared by:', colLeft, footerY - 10);
			doc.setLineWidth(0.4);
			doc.line(colLeft, footerY + 14, colLeft + 58, footerY + 14);
			doc.setFont('helvetica', 'bold');
			doc.text("For: Salisu Kano Int'l Ltd", colLeft, footerY + 20);
			doc.setFont('helvetica', 'normal');
			doc.text(
				moment(recon.updatedAt || recon.createdAt).format('DD/MM/YYYY'),
				colLeft,
				footerY + 26
			);
			if (sealBase64) {
				doc.addImage(sealBase64, 'PNG', colLeft - 10, footerY - 20, 68, 48);
			}

			// Footer filename
			doc.setFont('helvetica', 'italic');
			doc.setFontSize(7);
			doc.setTextColor(150, 150, 150);
			doc.text(`${filename}: Printed on: ${new Date.now()}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

			doc.save(`${filename}.pdf`);
		} catch (err) {
			console.error(err);
			toast.error('Failed to generate PDF');
		} finally {
			setLoading(false);
		}
	};

	if (isLoading) return <Loader />;
	if (!recon) return null;

	return (
		<div className="w-full flex flex-col p-4 justify-center">
			{/* ── Preview card ── */}
			<div className="w-full mx-auto md:w-[800px] bg-white border border-[#E7E7E7] rounded-lg p-4 md:px-10 flex flex-col gap-4">

				{/* ── HEADER ── */}
				<div className="flex items-center gap-3 mb-2">
					<img
						src={logo}
						alt="Logo"
						className="w-20 h-20 object-contain flex-shrink-0"
					/>
					<div className="flex-1 text-center">
						<h2 className="font-bold text-xl uppercase">
							Salisu Kano International Limited
						</h2>
						<p className="font-semibold text-sm">
							Scrap Materials&apos; Suppliers and General Contractors
						</p>
						<p className="text-sm mt-1">
							<strong>Address:</strong> No. 2 & 3 Block P, Dalar Gyade Market,
							Kano State
						</p>
						{/* Phone with call icon */}
						<div className="flex justify-center items-center gap-1.5 mt-1 text-sm">
							<img src={callIcon} alt="phone" className="w-4 h-4" />
							<span>08023239018 &nbsp;|&nbsp; 08067237273</span>
						</div>
					</div>
				</div>

				<hr className="border border-black" />

				{/* ── TITLE BANNER ── */}
				<div className="flex justify-center">
					<h3 className="text-base font-bold bg-black text-white px-8 py-1.5 uppercase tracking-wide">
						Reconciliation Statement
					</h3>
				</div>

				{/* ── SUB-TITLE ── */}
				<div className="text-center">
					<p className="font-bold text-base">{monthLabel} Reconciliation A/c</p>
					<p className="text-sm text-gray-600">
						Between{' '}
						<strong className="capitalize">{customer?.name}</strong> &amp; Salisu
						Kano
					</p>
				</div>

				<hr className="border-gray-300" />

				{/* ── STATEMENT TABLE ── */}
				<table className="w-full text-sm border-collapse">
					<thead>
						<tr className="border-b-2 border-black">
							<th className="text-left py-2 font-bold w-3/5">Statement</th>
							<th className="text-right py-2 pr-8 font-bold">&#8358;</th>
							<th className="text-right py-2 font-bold">&#8358;</th>
						</tr>
					</thead>
					<tbody>
						{/* Total from ledger */}
						<tr>
							<td className="py-2">
								Total From Ledger @{' '}
								<span className="capitalize">{customer?.name}</span>
							</td>
							<td />
							<td className="text-right py-2 border-b border-gray-300">
								{recon.totalFromLedger?.toLocaleString()}
							</td>
						</tr>

						{/* Less bank */}
						<tr>
							<td className="py-2">Less: Bank @ SKIL</td>
							<td />
							<td className="text-right py-2 border-b border-gray-300">
								{recon.lessBank?.toLocaleString()}
							</td>
						</tr>

						{/* Subtotal */}
						<tr>
							<td />
							<td />
							<td className="text-right py-1 font-semibold border-b border-gray-400">
								{subtotal1?.toLocaleString()}
							</td>
						</tr>

						{/* Deductions block */}
						{recon.deductions?.length > 0 && (
							<>
								<tr>
									<td className="pt-3 pb-1 font-semibold">
										Less: K.C Contractor / Not Reflected
									</td>
									<td className="text-right font-bold pr-8">&#8358;</td>
									<td />
								</tr>
								{recon.deductions.map((d, i) => (
									<tr key={i}>
										<td className="py-1 pl-4 text-gray-600 capitalize">
											{d.description}
										</td>
										<td className="text-right py-1 pr-8 border-b border-gray-300">
											{d.amount?.toLocaleString()}
										</td>
										<td />
									</tr>
								))}
								{/* Sum of deductions */}
								<tr>
									<td />
									<td className="text-right py-1 pr-8 font-semibold border-b-2 border-black">
										{totalDeductions?.toLocaleString()}
									</td>
									<td className="text-right py-1 border-b border-gray-300">
										{totalDeductions?.toLocaleString()}
									</td>
								</tr>
							</>
						)}

						{/* Balance unpaid */}
						<tr className="border-t-2 border-black">
							<td className="py-3 font-bold text-base">
								Balance Unpaid {monthLabel} =
							</td>
							<td />
							<td
								className="text-right py-3 font-bold text-lg"
								style={{ borderBottom: '4px double black' }}
							>
								{recon.balanceUnpaid?.toLocaleString()}
							</td>
						</tr>
					</tbody>
				</table>

				{/* Notes */}
				{recon.notes && (
					<div className="mt-2 text-sm text-gray-600 italic">
						<strong>Note:</strong> {recon.notes}
					</div>
				)}

				{/* ── SIGNATURE SECTION ── */}
				<div className="flex justify-between items-start mt-10 gap-4">
					{/* LEFT — Prepared by: label → line → name/date */}
					<div className="flex flex-col gap-0">
						<p className="text-sm text-gray-500 mb-1">Prepared by:</p>
						<div className="h-10" />
						<div className="border-b border-black w-48" />
						<p className="mt-1 font-semibold capitalize">{recon.preparedBy}</p>
						<p className="text-xs text-gray-500">
							{moment(recon.updatedAt || recon.createdAt).format('DD/MM/YYYY')}
						</p>
						<p className="font-bold mt-1">Salisu Kano.</p>
					</div>

					{/* RIGHT — Authorized signature + seal */}
					<div className="flex flex-col items-center">
						<p className="text-sm text-gray-500 mb-1">Authorized Signature</p>
						<img
							src={seal}
							alt="Seal"
							className="w-28 h-28 object-cover"
							style={{ marginBottom: '-24px' }}
						/>
						<div className="border-b border-black w-52" />
						<p className="font-semibold text-sm text-center mt-1">
							For: Salisu Kano Int&apos;l Ltd
						</p>
					</div>
				</div>

				{/* File label */}
				<p className="text-center text-xs text-gray-400 mt-4">{filename}.pdf</p>
			</div>

			{/* ── ACTIONS ── */}
			<div className="flex flex-col md:flex-row gap-3 justify-center mt-6 mb-10">
				<button
					onClick={() => navigate(`/analysis/${customerId}`)}
					className="w-full md:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded cursor-pointer transition-colors"
				>
					&#8592; Back
				</button>
				<button
					onClick={downloadPDF}
					disabled={loading}
					className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded cursor-pointer transition-colors disabled:opacity-60"
				>
					{loading ? 'Generating...' : `Download ${filename}.pdf`}
				</button>
			</div>

			{(isLoading || loading) && <Loader />}
		</div>
	);
};

export default ReconciliationPreview;
