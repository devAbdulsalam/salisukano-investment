import Reconciliation from '../models/Reconciliation.js';
import Customer from '../models/Customer.js';

// @route GET /reconciliations/:customerId
// Returns all reconciliations for a company, newest first
export const getReconciliations = async (req, res) => {
	try {
		const { customerId } = req.params;
		const customer = await Customer.findById(customerId);
		if (!customer) {
			return res.status(404).json({ message: 'Customer not found' });
		}
		const reconciliations = await Reconciliation.find({ customerId }).sort({
			month: -1,
		});
		res.json({ customer, reconciliations });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// @route GET /reconciliations/detail/:id
// Returns a single reconciliation by its own _id
export const getReconciliation = async (req, res) => {
	try {
		const reconciliation = await Reconciliation.findById(req.params.id);
		if (!reconciliation) {
			return res.status(404).json({ message: 'Reconciliation not found' });
		}
		const customer = await Customer.findById(reconciliation.customerId);
		res.json({ reconciliation, customer });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// @route POST /reconciliations
// Creates a new reconciliation
export const createReconciliation = async (req, res) => {
	try {
		const {
			customerId,
			month,
			totalFromLedger,
			lessBank,
			deductions,
			notes,
			preparedBy,
		} = req.body;

		if (!customerId || !month) {
			return res
				.status(400)
				.json({ message: 'customerId and month are required' });
		}

		const reconciliation = new Reconciliation({
			customerId,
			month: new Date(month),
			totalFromLedger: Number(totalFromLedger) || 0,
			lessBank: Number(lessBank) || 0,
			deductions: deductions || [],
			notes: notes || '',
			preparedBy: preparedBy || 'Salisu Kano',
		});

		await reconciliation.save();
		res.status(201).json(reconciliation);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// @route PUT /reconciliations/:id
// Updates a reconciliation
export const updateReconciliation = async (req, res) => {
	try {
		const reconciliation = await Reconciliation.findById(req.params.id);
		if (!reconciliation) {
			return res.status(404).json({ message: 'Reconciliation not found' });
		}

		const {
			month,
			totalFromLedger,
			lessBank,
			deductions,
			notes,
			preparedBy,
		} = req.body;

		if (month !== undefined) reconciliation.month = new Date(month);
		if (totalFromLedger !== undefined)
			reconciliation.totalFromLedger = Number(totalFromLedger);
		if (lessBank !== undefined) reconciliation.lessBank = Number(lessBank);
		if (deductions !== undefined) reconciliation.deductions = deductions;
		if (notes !== undefined) reconciliation.notes = notes;
		if (preparedBy !== undefined) reconciliation.preparedBy = preparedBy;

		await reconciliation.save(); // pre-save recalculates balanceUnpaid
		res.json(reconciliation);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// @route DELETE /reconciliations/:id
export const deleteReconciliation = async (req, res) => {
	try {
		const result = await Reconciliation.deleteOne({ _id: req.params.id });
		if (result.deletedCount === 0) {
			return res.status(404).json({ message: 'Reconciliation not found' });
		}
		res.json({ message: 'Reconciliation deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};
