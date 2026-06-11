import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
	category: { type: String, default: 'Cash' },
	title: { type: String, default: '' },
	description: { type: String, default: '' },
	// 'credit' | 'debit'
	type: { type: String, enum: ['credit', 'debit'], default: 'credit' },
	amount: { type: Number, default: 0 },
});

const statementSchema = new mongoose.Schema(
	{
		year: { type: Number, required: true, unique: true },
		statementName: { type: String, default: '' },
		openingCapital: { type: Number, default: 0 },
		zakatRate: { type: Number, default: 2.5 }, // stored as percentage e.g. 2.5
		items: [itemSchema],
		// Denormalized computed fields recalculated on every save
		totalCredits: { type: Number, default: 0 },
		totalDebits: { type: Number, default: 0 },
		grossCapital: { type: Number, default: 0 },
		netCapital: { type: Number, default: 0 },
		zakatAmount: { type: Number, default: 0 },
		closingCapital: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

// Pre-save: recalculate all totals from items + openingCapital + zakatRate
statementSchema.pre('save', function (next) {
	let totalCredits = 0;
	let totalDebits = 0;

	for (const item of this.items) {
		if (item.type === 'credit') {
			totalCredits += item.amount || 0;
		} else {
			totalDebits += item.amount || 0;
		}
	}

	const grossCapital = (this.openingCapital || 0) + totalCredits;
	const netCapital = grossCapital - totalDebits;
	const zakatAmount = (netCapital * (this.zakatRate || 0)) / 100;
	const closingCapital = netCapital - zakatAmount;

	this.totalCredits = totalCredits;
	this.totalDebits = totalDebits;
	this.grossCapital = grossCapital;
	this.netCapital = netCapital;
	this.zakatAmount = zakatAmount;
	this.closingCapital = closingCapital;

	next();
});

const Statement = mongoose.model('Statement', statementSchema);
export default Statement;
