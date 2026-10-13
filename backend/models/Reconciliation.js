import mongoose, { Schema } from 'mongoose';

// Each "less" deduction line item
const deductionSchema = new mongoose.Schema({
	description: { type: String, required: true },
	amount: { type: Number, required: true, default: 0 },
});

const ReconciliationSchema = new mongoose.Schema(
	{
		customerId: {
			type: Schema.Types.ObjectId,
			ref: 'Customer',
			required: true,
		},
		// e.g. "February, 2026"
		month: { type: Date, required: true },
		// Total from Ledger @ Company (Quantum side)
		totalFromLedger: { type: Number, default: 0 },
		// Less: Bank @ SKIL
		lessBank: { type: Number, default: 0 },
		// Additional "Less:" deduction line items (e.g. K.C Contractor, etc.)
		deductions: [deductionSchema],
		// Computed: totalFromLedger - lessBank - sum(deductions)
		balanceUnpaid: { type: Number, default: 0 },
		// Free-text note (optional)
		notes: { type: String, default: '' },
		preparedBy: { type: String, default: 'Salisu Kano' },
	},
	{ timestamps: true }
);

// Auto-calculate balanceUnpaid before save
ReconciliationSchema.pre('save', function (next) {
	const totalDeductions = this.deductions.reduce(
		(sum, d) => sum + (d.amount || 0),
		0
	);
	this.balanceUnpaid = this.totalFromLedger - this.lessBank - totalDeductions;
	next();
});

const Reconciliation = mongoose.model('Reconciliation', ReconciliationSchema);
export default Reconciliation;
