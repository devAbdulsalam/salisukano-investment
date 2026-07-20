import Asset from '../models/Asset.js';

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * GET /assets/dashboard
 * Returns summary stats:
 * - total assets
 * - total cost
 * - total value
 * - total margin
 * - sold assets
 * - sold value
 * - sold profit
 */
/**
 * GET /assets/dashboard
 * Returns dashboard summary
 */
export const getAssetDashboard = async (req, res) => {
	try {
		const [result] = await Asset.aggregate([
			{
				$addFields: {
					maintenanceCost: {
						$sum: {
							$map: {
								input: { $ifNull: ['$maintenances', []] },
								as: 'm',
								in: '$$m.cost',
							},
						},
					},
				},
			},
			{
				$addFields: {
					totalCost: {
						$add: [{ $ifNull: ['$purchasePrice', 0] }, '$maintenanceCost'],
					},
					latestValuation: {
						$cond: [
							{ $ne: ['$salePrice', null] },
							'$salePrice',
							{
								$let: {
									vars: {
										lastValuation: {
											$arrayElemAt: [
												{
													$ifNull: ['$valuations', []],
												},
												-1,
											],
										},
									},
									in: '$$lastValuation.valuation',
								},
							},
						],
					},
				},
			},
			{
				$facet: {
					activeAssets: [
						{
							$match: {
								status: {
									$nin: ['sold', 'disposed', 'desposed'],
								},
							},
						},
						{
							$group: {
								_id: null,
								totalAssets: { $sum: 1 },
								totalCost: { $sum: '$totalCost' },
								totalValue: {
									$sum: {
										$ifNull: ['$latestValuation', 0],
									},
								},
								totalMargin: {
									$sum: {
										$cond: [
											{
												$ne: ['$latestValuation', null],
											},
											{
												$subtract: ['$latestValuation', '$totalCost'],
											},
											0,
										],
									},
								},
								valuedAssets: {
									$sum: {
										$cond: [
											{
												$ne: ['$latestValuation', null],
											},
											1,
											0,
										],
									},
								},
							},
						},
					],
					soldAssets: [
						{
							$match: {
								status: {
									$in: ['sold', 'disposed', 'desposed'],
								},
							},
						},
						{
							$group: {
								_id: null,

								totalSoldCount: {
									$sum: 1,
								},

								// Total amount sold for
								totalSold: {
									$sum: {
										$ifNull: ['$salePrice', 0],
									},
								},

								// Total acquisition + maintenance cost of sold assets
								totalCostForSold: {
									$sum: '$totalCost',
								},

								// Total profit from sold assets
								totalProfitForSold: {
									$sum: {
										$subtract: [
											{
												$ifNull: ['$salePrice', 0],
											},
											'$totalCost',
										],
									},
								},
							},
						},
					],
				},
			},
			{
				$project: {
					active: {
						$ifNull: [
							{
								$arrayElemAt: ['$activeAssets', 0],
							},
							{
								totalAssets: 0,
								totalCost: 0,
								totalValue: 0,
								totalMargin: 0,
								valuedAssets: 0,
							},
						],
					},
					sold: {
						$ifNull: [
							{
								$arrayElemAt: ['$soldAssets', 0],
							},
							{
								totalSoldCount: 0,
								totalSold: 0,
								totalProfitForSold: 0,
							},
						],
					},
				},
			},
		]);

		res.status(200).json({
			success: true,
			data: {
				totalAssets: result?.active?.totalAssets || 0,
				totalCost: result?.active?.totalCost || 0,
				totalValue: result?.active?.totalValue || 0,
				totalMargin: result?.active?.totalMargin || 0,
				valuedAssets: result?.active?.valuedAssets || 0,

				totalSoldCount: result?.sold?.totalSoldCount || 0,
				totalSold: result?.sold?.totalSold || 0,
				totalCostForSold: result?.sold?.totalCostForSold || 0,
				totalProfitForSold: result?.sold?.totalProfitForSold || 0,
			},
		});
	} catch (error) {
		console.error('Asset Dashboard Error:', error);

		res.status(500).json({
			success: false,
			message: 'Internal Server Error',
		});
	}
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * GET /assets
 * List all assets with computed virtuals.
 */
export const getAssets = async (req, res) => {
	try {
		const { status, search } = req.query;
		const query = {};

		if (status) query.status = status;
		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ serialNumber: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } },
			];
		}

		const assets = await Asset.find(query).sort({ createdAt: -1 });
		res.status(200).json({ success: true, count: assets.length, data: assets });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};

/**
 * GET /assets/:id
 * Get a single asset.
 */
export const getAsset = async (req, res) => {
	const { id } = req.params;
	try {
		const asset = await Asset.findById(id);
		if (!asset)
			return res.status(404).json({ success: false, error: 'Asset not found' });
		res.status(200).json({ success: true, data: asset });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};

/**
 * POST /assets
 * Create a new asset.
 */
export const createAsset = async (req, res) => {
	try {
		const {
			name,
			description,
			purchasePrice,
			purchaseDate,
			agent,
			status,
			serialNumber,
		} = req.body;

		if (!name || purchasePrice == null || !purchaseDate) {
			return res.status(400).json({
				success: false,
				error: 'name, purchasePrice and purchaseDate are required',
			});
		}

		const asset = new Asset({
			serialNumber: serialNumber || `ASSET-${Date.now()}`,
			name,
			description,
			purchasePrice,
			purchaseDate: new Date(purchaseDate),
			agent,
			status: status || 'active',
		});

		await asset.save();
		res.status(201).json({ success: true, data: asset });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};

/**
 * PATCH /assets/:id
 * Update basic asset fields.
 */
export const updateAsset = async (req, res) => {
	const { id } = req.params;
	try {
		const asset = await Asset.findById(id);
		if (!asset)
			return res.status(404).json({ success: false, error: 'Asset not found' });

		const allowed = [
			'name',
			'description',
			'purchasePrice',
			'purchaseDate',
			'agent',
			'status',
			'salePrice',
			'saleDate',
			'serialNumber',
		];
		for (const key of allowed) {
			if (req.body[key] !== undefined) {
				asset[key] = req.body[key];
			}
		}

		// When status is set to 'sold', require salePrice
		if (asset.status === 'sold' && !asset.salePrice) {
			return res.status(400).json({
				success: false,
				error: 'salePrice is required when marking an asset as sold',
			});
		}

		await asset.save();
		res.status(200).json({ success: true, data: asset });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};

/**
 * DELETE /assets/:id
 */
export const deleteAsset = async (req, res) => {
	const { id } = req.params;
	try {
		const asset = await Asset.findByIdAndDelete(id);
		if (!asset)
			return res.status(404).json({ success: false, error: 'Asset not found' });
		res
			.status(200)
			.json({ success: true, message: 'Asset deleted successfully' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};

// ─── Maintenance ──────────────────────────────────────────────────────────────

/**
 * POST /assets/:id/maintenance
 * Add a maintenance record to an asset.
 */
export const addMaintenance = async (req, res) => {
	const { id } = req.params;
	try {
		const { cost, date, remark } = req.body;

		if (cost == null || !date) {
			return res
				.status(400)
				.json({ success: false, error: 'cost and date are required' });
		}

		const asset = await Asset.findById(id);
		if (!asset)
			return res.status(404).json({ success: false, error: 'Asset not found' });

		asset.maintenances.push({ cost, date: new Date(date), remark });

		// Automatically set status to under_maintenance if active
		if (asset.status === 'active') {
			asset.status = 'under_maintenance';
		}

		await asset.save();
		res.status(201).json({ success: true, data: asset });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};

/**
 * PATCH /assets/:id/maintenance/:maintenanceId
 * Update a maintenance record.
 */
export const updateMaintenance = async (req, res) => {
	const { id, maintenanceId } = req.params;
	try {
		const asset = await Asset.findById(id);
		if (!asset)
			return res.status(404).json({ success: false, error: 'Asset not found' });

		const record = asset.maintenances.id(maintenanceId);
		if (!record) {
			return res
				.status(404)
				.json({ success: false, error: 'Maintenance record not found' });
		}

		const { cost, date, remark } = req.body;
		if (cost != null) record.cost = cost;
		if (date) record.date = new Date(date);
		if (remark !== undefined) record.remark = remark;

		await asset.save();
		res.status(200).json({ success: true, data: asset });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};

/**
 * DELETE /assets/:id/maintenance/:maintenanceId
 * Remove a maintenance record.
 */
export const deleteMaintenance = async (req, res) => {
	const { id, maintenanceId } = req.params;
	try {
		const asset = await Asset.findById(id);
		if (!asset)
			return res.status(404).json({ success: false, error: 'Asset not found' });

		const idx = asset.maintenances.findIndex(
			(m) => m._id.toString() === maintenanceId,
		);
		if (idx === -1) {
			return res
				.status(404)
				.json({ success: false, error: 'Maintenance record not found' });
		}

		asset.maintenances.splice(idx, 1);
		await asset.save();
		res.status(200).json({ success: true, data: asset });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};

// ─── Valuations ───────────────────────────────────────────────────────────────

/**
 * POST /assets/:id/valuation
 * Add a valuation entry.
 */
export const addValuation = async (req, res) => {
	const { id } = req.params;
	try {
		const { valuation, valuationDate, remark } = req.body;

		if (valuation == null || !valuationDate) {
			return res.status(400).json({
				success: false,
				error: 'valuation and valuationDate are required',
			});
		}

		const asset = await Asset.findById(id);
		if (!asset)
			return res.status(404).json({ success: false, error: 'Asset not found' });

		asset.valuations.push({
			valuation,
			valuationDate: new Date(valuationDate),
			remark,
		});
		await asset.save();

		res.status(201).json({ success: true, data: asset });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};

/**
 * PATCH /assets/:id/valuation/:valuationId
 * Update a valuation entry.
 */
export const updateValuation = async (req, res) => {
	const { id, valuationId } = req.params;
	try {
		const asset = await Asset.findById(id);
		if (!asset)
			return res.status(404).json({ success: false, error: 'Asset not found' });

		const record = asset.valuations.id(valuationId);
		if (!record) {
			return res
				.status(404)
				.json({ success: false, error: 'Valuation record not found' });
		}

		const { valuation, valuationDate, remark } = req.body;
		if (valuation != null) record.valuation = valuation;
		if (valuationDate) record.valuationDate = new Date(valuationDate);
		if (remark !== undefined) record.remark = remark;

		await asset.save();
		res.status(200).json({ success: true, data: asset });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};

/**
 * DELETE /assets/:id/valuation/:valuationId
 * Remove a valuation entry.
 */
export const deleteValuation = async (req, res) => {
	const { id, valuationId } = req.params;
	try {
		const asset = await Asset.findById(id);
		if (!asset)
			return res.status(404).json({ success: false, error: 'Asset not found' });

		const idx = asset.valuations.findIndex(
			(v) => v._id.toString() === valuationId,
		);
		if (idx === -1) {
			return res
				.status(404)
				.json({ success: false, error: 'Valuation record not found' });
		}

		asset.valuations.splice(idx, 1);
		await asset.save();
		res.status(200).json({ success: true, data: asset });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};

/**
 * POST /assets/:id/sell
 * Mark an asset as sold and record the sale price.
 * Margin is auto-calculated from totalCost vs salePrice.
 */
export const sellAsset = async (req, res) => {
	const { id } = req.params;
	try {
		const { salePrice, saleDate } = req.body;

		if (salePrice == null) {
			return res
				.status(400)
				.json({ success: false, error: 'salePrice is required' });
		}

		const asset = await Asset.findById(id);
		if (!asset)
			return res.status(404).json({ success: false, error: 'Asset not found' });

		if (asset.status === 'sold') {
			return res
				.status(400)
				.json({ success: false, error: 'Asset is already marked as sold' });
		}

		asset.salePrice = salePrice;
		asset.saleDate = saleDate ? new Date(saleDate) : new Date();
		asset.status = 'sold';

		await asset.save();

		// Return asset with margin virtuals
		res.status(200).json({
			success: true,
			message: 'Asset marked as sold',
			data: asset,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: 'Internal Server Error' });
	}
};
