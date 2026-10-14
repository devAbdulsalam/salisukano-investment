/* eslint-disable react/prop-types */
import logo from '../assets/logo.jpg';
import Modal from './modals/Modal';
import { downloadPDF } from '../hooks/downLoadPdf';
import { formatDateWat, formatMonthYearWat } from '../utils/watDate';

const ReconciliationPDF = ({ show, setShow, reconciliation, customer }) => {
	if (!reconciliation) return null;

	const totalDeductions = reconciliation.deductions?.reduce(
		(sum, d) => sum + (d.amount || 0),
		0
	);

	// Step-by-step calc to match the handwritten format:
	// totalFromLedger
	// less: lessBank     → subtotal1 = totalFromLedger - lessBank
	// less: each K.C deduction (grouped)  → subtotal2 = subtotal1 - totalDeductions
	// = balanceUnpaid
	const subtotal1 = reconciliation.totalFromLedger - reconciliation.lessBank;

	const monthLabel = formatMonthYearWat(reconciliation.month, 'MMMM, yyyy');
	const filename = `${formatMonthYearWat(reconciliation.month, 'MMM-yyyy')}-reconciliation`;

	const handlePrint = () => downloadPDF('reconciliation-doc');

	return (
		<Modal show={show}>
			<div className="transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all font-josefin w-full md:min-w-[620px] max-h-[90vh] overflow-y-auto">
				{/* Printable area */}
				<div
					id="reconciliation-doc"
					className="w-full bg-white mx-auto p-8 text-sm text-black"
					style={{ fontFamily: 'serif' }}
				>
					{/* Header */}
					<div className="flex items-start justify-between mb-6">
						<img src={logo} className="w-16 h-16 rounded-lg" alt="Logo" />
						<div className="text-center flex-1 px-4">
							<h2 className="font-bold text-base uppercase">
								Salisu Kano International Limited
							</h2>
							<p className="text-xs text-gray-600">Block P5, No.: 1-3 Dalar Gyada Market.</p>
							<p className="text-xs text-gray-600">Opp. Hajj Camp. IBB Way, Kano State - Nigeria.</p>
						</div>
					</div>

					{/* Title */}
					<div className="text-center mb-6">
						<h3 className="font-bold text-lg underline uppercase tracking-wide">
							{monthLabel} Reconciliation A/c
						</h3>
						<p className="text-sm font-medium mt-1">
							Between{' '}
							<span className="font-bold capitalize">{customer?.name}</span>{' '}
							&amp; Salisu Kano
						</p>
					</div>

					{/* Statement table */}
					<table className="w-full text-sm border-collapse mt-4">
						<thead>
							<tr className="border-b-2 border-black">
								<th className="text-left py-1 pr-4 font-bold w-2/3">Statement</th>
								<th className="text-right py-1 pr-6 font-bold">₦</th>
								<th className="text-right py-1 font-bold">₦</th>
							</tr>
						</thead>
						<tbody>
							{/* Row 1: Total from Ledger */}
							<tr>
								<td className="py-2 pr-4">
									Total From Ledger @ {customer?.name}
								</td>
								<td className="text-right py-2 pr-6"></td>
								<td className="text-right py-2 font-medium border-b border-gray-400">
									{reconciliation.totalFromLedger?.toLocaleString()}
								</td>
							</tr>

							{/* Row 2: Less Bank @ SKIL */}
							<tr>
								<td className="py-2 pr-4">Less: Bank @ SKIL</td>
								<td className="text-right py-2 pr-6"></td>
								<td className="text-right py-2 font-medium border-b border-gray-400">
									{reconciliation.lessBank?.toLocaleString()}
								</td>
							</tr>

							{/* Subtotal after bank deduction */}
							<tr>
								<td className="py-1 pr-4"></td>
								<td className="text-right py-1 pr-6"></td>
								<td className="text-right py-1 font-medium border-b border-gray-400">
									{subtotal1?.toLocaleString()}
								</td>
							</tr>

							{/* Row 3: Less: K.C deductions block header */}
							{reconciliation.deductions?.length > 0 && (
								<>
									<tr>
										<td className="pt-3 pb-1 pr-4 font-medium">
											Less: K.C Contractor / Not Reflected
										</td>
										<td className="text-right py-1 pr-6 font-bold">₦</td>
										<td></td>
									</tr>
									{reconciliation.deductions.map((d, i) => (
										<tr key={i}>
											<td className="py-1 pr-4 pl-4 text-gray-700 capitalize">
												{d.description}
											</td>
											<td className="text-right py-1 pr-6 border-b border-gray-400">
												{d.amount?.toLocaleString()}
											</td>
											<td></td>
										</tr>
									))}
									{/* Sum of deductions */}
									<tr>
										<td></td>
										<td className="text-right py-1 pr-6 font-medium border-b-2 border-black">
											{totalDeductions?.toLocaleString()}
										</td>
										<td className="text-right py-1 font-medium border-b border-gray-400">
											{totalDeductions?.toLocaleString()}
										</td>
									</tr>
								</>
							)}

							{/* Balance Unpaid */}
							<tr className="border-t-2 border-black">
								<td className="py-3 pr-4 font-bold">
									Balance Unpaid {monthLabel} =
								</td>
								<td></td>
								<td className="text-right py-3 font-bold text-lg border-b-4 border-double border-black">
									{reconciliation.balanceUnpaid?.toLocaleString()}
								</td>
							</tr>
						</tbody>
					</table>

					{/* Notes */}
					{reconciliation.notes && (
						<div className="mt-6">
							<p className="font-semibold">Notes:</p>
							<p className="text-gray-700">{reconciliation.notes}</p>
						</div>
					)}

					{/* Footer */}
					<div className="mt-10 flex justify-between items-end">
						<div>
							<p className="font-medium">Prepared by:</p>
							<div className="mt-4 border-b border-black w-40"></div>
							<p className="mt-1">{reconciliation.preparedBy}</p>
							<p className="text-gray-600 text-xs">
								{formatDateWat(
									reconciliation.updatedAt || reconciliation.createdAt,
									'dd/MM/yyyy'
								)}
							</p>
							<p className="font-semibold mt-1">Salisu Kano.</p>
						</div>
						<div className="text-right text-xs text-gray-400">
							<p>{filename}.pdf</p>
						</div>
					</div>
				</div>

				{/* Action buttons */}
				<div className="flex justify-center gap-3 border-t-2 border-neutral-200 p-4">
					<button
						onClick={() => setShow(false)}
						className="text-sm font-bold text-white bg-red-500 px-6 py-2 rounded-md hover:bg-red-400"
					>
						Close
					</button>
					<button
						onClick={handlePrint}
						className="text-sm font-bold text-white bg-blue-500 px-6 py-2 rounded-md hover:bg-blue-400"
					>
						Download PDF
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default ReconciliationPDF;
