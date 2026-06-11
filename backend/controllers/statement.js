import Statement from '../models/Statement.js';

// @desc    Get all statements (list with summary)
// @route   GET /statements
export const getStatements = async (req, res) => {
	try {
		const statements = await Statement.find()
			.select(
				'year statementName openingCapital zakatRate totalCredits totalDebits grossCapital netCapital zakatAmount closingCapital updatedAt',
			)
			.sort({ year: -1 });
		res.json(statements);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// @desc    Get single statement by year (full details with items)
// @route   GET /statements/:year
export const getStatementByYear = async (req, res) => {
	try {
		const statement = await Statement.findOne({ year: Number(req.params.year) });
		if (!statement) {
			return res.status(404).json({ message: 'Statement not found' });
		}
		res.json(statement);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// @desc    Create new statement
// @route   POST /statements
export const createStatement = async (req, res) => {
	try {
		const { year, statementName, openingCapital, zakatRate, items } = req.body;

		const existing = await Statement.findOne({ year: Number(year) });
		if (existing) {
			return res
				.status(400)
				.json({ message: 'Statement for this year already exists' });
		}

		const statement = new Statement({
			year: Number(year),
			statementName: statementName || `Financial Statement ${year}`,
			openingCapital: openingCapital || 0,
			zakatRate: zakatRate ?? 2.5,
			items: items || [],
		});

		await statement.save();
		res.status(201).json(statement);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// @desc    Update statement by year (full replace)
// @route   PUT /statements/:year
export const updateStatement = async (req, res) => {
	try {
		const { statementName, openingCapital, zakatRate, items } = req.body;

		const statement = await Statement.findOne({ year: Number(req.params.year) });
		if (!statement) {
			return res.status(404).json({ message: 'Statement not found' });
		}

		if (statementName !== undefined) statement.statementName = statementName;
		if (openingCapital !== undefined)
			statement.openingCapital = Number(openingCapital);
		if (zakatRate !== undefined) statement.zakatRate = Number(zakatRate);
		if (items !== undefined) statement.items = items;

		await statement.save(); // pre-save hook recalculates totals
		res.json(statement);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// @desc    Delete statement by year
// @route   DELETE /statements/:year
export const deleteStatement = async (req, res) => {
	try {
		const result = await Statement.deleteOne({ year: Number(req.params.year) });
		if (result.deletedCount === 0) {
			return res.status(404).json({ message: 'Statement not found' });
		}
		res.json({ message: 'Statement deleted successfully' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// @desc    Duplicate a statement to next year (opening = closingCapital of source)
// @route   POST /statements/:year/duplicate
export const duplicateStatement = async (req, res) => {
	try {
		const { newYear } = req.body;
		const source = await Statement.findOne({ year: Number(req.params.year) });
		if (!source) {
			return res.status(404).json({ message: 'Source statement not found' });
		}

		const targetYear = Number(newYear);
		const alreadyExists = await Statement.findOne({ year: targetYear });
		if (alreadyExists) {
			return res
				.status(400)
				.json({ message: `Statement for year ${targetYear} already exists` });
		}

		const duplicated = new Statement({
			year: targetYear,
			statementName: `Financial Statement ${targetYear}`,
			openingCapital: source.closingCapital,
			zakatRate: source.zakatRate,
			items: source.items.map((item) => ({
				category: item.category,
				title: item.title,
				description: item.description,
				type: item.type,
				amount: item.amount,
			})),
		});

		await duplicated.save();
		res.status(201).json(duplicated);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};
