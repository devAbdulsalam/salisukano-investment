import Invoice from '../models/Invoice.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// AI Text Parser

// Enhanced AI Text Parser with multiple format support
export const parseInvoiceText = (text) => {
	const lines = text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && line.length > 0);

	let parsedData = {
		date: null,
		vehicleNumber: null,
		customerName: null,
		items: [],
		total: 0,
		less: {
			expenses: 0,
			deposit: 0,
		},
		balance: 0,
	};

	// Helper function to extract date
	const extractDate = (text) => {
		const datePatterns = [
			/\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY
			/Date:\s*(\d{2}\/\d{2}\/\d{4})/i, // Date: DD/MM/YYYY
			/(\d{2}\/\d{2}\/\d{4})\s+[A-Z0-9\s-]+:?/, // Date at start with vehicle
		];

		for (const pattern of datePatterns) {
			const match = text.match(pattern);
			if (match) {
				const dateStr = match[0].includes('Date:') ? match[1] : match[0];
				const [day, month, year] = dateStr.split('/');
				return new Date(`${year}-${month}-${day}`);
			}
		}
		return null;
	};

	// Helper function to extract vehicle number
	const extractVehicle = (text) => {
		const vehiclePatterns = [
			/(?:Vehicle|Vehecle):\s*([A-Z0-9\s-]+)/i, // Vehicle: YLA 871 XU
			/(\d{2}\/\d{2}\/\d{4})\s+([A-Z0-9\s-]+:-?)/, // Date followed by vehicle
			/([A-Z]{1,3}\s?\d{1,4}\s?[A-Z]{1,3}):?-?/i, // Standalone vehicle pattern
		];

		for (const pattern of vehiclePatterns) {
			const match = text.match(pattern);
			if (match) {
				let vehicle = match[0].includes(':')
					? match[0].split(':')[0]
					: match[0];
				if (match[2]) vehicle = match[2];
				if (match[1] && !match[1].match(/\d{2}\/\d{2}\/\d{4}/))
					vehicle = match[1];

				// Clean up the vehicle number
				vehicle = vehicle
					.replace(/Vehicle:|Vehecle:|:-/gi, '')
					.trim()
					.replace(/\s+/g, ' ');
				return vehicle;
			}
		}
		return null;
	};

	// Helper function to extract customer name
	const extractCustomerName = (text) => {
		const namePatterns = [
			/(?:Name|customer name):\s*([A-Za-z\s]+)/i,
			/Name~\s*([A-Za-z\s]+)/i,
			/Name:\s*([A-Za-z\s]+)/i,
			/Customer:\s*([A-Za-z\s]+)/i,
		];

		for (const pattern of namePatterns) {
			const match = text.match(pattern);
			if (match) {
				return match[1].trim();
			}
		}
		return null;
	};

	// Helper function to parse items
	const parseItemLine = (line) => {
		const itemPatterns = [
			// Format: M~19,900kg*809 =N16,099,100
			/([MCS])~([\d,]+)kg\*(\d+)(?:\s*=\s*N([\d,]+))?/i,
			// Format: Mix:19,900kg*809 = N16,099,100
			/(Mix|Cast|Special|Bundle):\s*([\d,]+)kg\*(\d+)(?:\s*=\s*N([\d,]+))?/i,
			// Format: Mix:19,900kg*809 (without amount)
			/(Mix|Cast|Special|Bundle):\s*([\d,]+)kg\*(\d+)/i,
			// Format: Mix:19,900kg*809 (without amount)
			/(M|C|S|B):\s*([\d,]+)kg\*(\d+)/i,
			// Format: M~19,900kg*809 (without amount)
			/([MCSB])~([\d,]+)kg\*(\d+)/i,
		];

		for (const pattern of itemPatterns) {
			const match = line.match(pattern);
			if (match) {
				let typeCode = match[1];
				let typeName;

				// Map type codes to full names
				const typeMap = {
					M: 'Mix',
					C: 'Cast',
					S: 'Special',
					B: 'Bundle',
					mix: 'Mix',
					cast: 'Cast',
					special: 'Special',
					bundle: 'Bundle',
					Mix: 'Mix',
					Cast: 'Cast',
					Special: 'Special',
					Bundle: 'Bundle',
				};

				typeName = typeMap[typeCode] || typeCode;

				const weight = parseFloat(match[2].replace(/,/g, ''));
				const rate = parseInt(match[3]);
				let amount = match[4] ? parseFloat(match[4].replace(/,/g, '')) : null;

				// Calculate amount if not provided
				if (!amount) {
					amount = weight * rate;
				}

				return {
					type: typeName,
					weight: weight,
					rate: rate,
					amount: amount,
				};
			}
		}
		return null;
	};

	// Helper function to extract financial values
	const extractFinancialValue = (line, pattern) => {
		const patterns = [
			new RegExp(`${pattern}:?\\s*N([\\d,]+)`, 'i'), // Expenses: N130,500
			new RegExp(`N([\\d,]+)\\s*[~-]?\\s*${pattern}`, 'i'), // N130,500 ~ Expenses
			new RegExp(`N([\\d,]+)\\s*${pattern}`, 'i'), // N130,500 Expenses
		];

		for (const regex of patterns) {
			const match = line.match(regex);
			if (match) {
				return parseFloat(match[1].replace(/,/g, ''));
			}
		}
		return 0;
	};

	// Parse all lines
	try {
		// First, try to extract date, vehicle, and customer from the entire text
		parsedData.date = extractDate(text);
		parsedData.vehicleNumber = extractVehicle(text);
		parsedData.customerName = extractCustomerName(text);

		// Parse items and financial values line by line
		let hasItems = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Skip empty lines
			if (!line.trim()) continue;

			// Parse items
			const item = parseItemLine(line);
			if (item) {
				parsedData.items.push(item);
				hasItems = true;
				continue;
			}

			// Parse TOTAL
			if (line.toLowerCase().includes('total')) {
				const totalMatch = line.match(/N([\d,]+)/);
				if (totalMatch) {
					parsedData.total = parseFloat(totalMatch[1].replace(/,/g, ''));
				}
				continue;
			}

			// Parse Expenses
			if (line.toLowerCase().includes('expenses')) {
				parsedData.less.expenses = extractFinancialValue(line, 'expenses');
				continue;
			}

			// Parse Deposit
			if (line.toLowerCase().includes('deposit')) {
				parsedData.less.deposit = extractFinancialValue(line, 'deposit');
				continue;
			}

			// Parse BALANCE
			if (line.toLowerCase().includes('balance')) {
				const balanceMatch = line.match(/N([\d,]+)/);
				if (balanceMatch) {
					parsedData.balance = parseFloat(balanceMatch[1].replace(/,/g, ''));
				}
				continue;
			}

			// Look for Less: section
			if (line.toLowerCase().includes('less:')) {
				// Check next lines for expenses and deposit
				for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
					const nextLine = lines[j];
					if (nextLine.toLowerCase().includes('expenses')) {
						parsedData.less.expenses = extractFinancialValue(
							nextLine,
							'expenses',
						);
					}
					if (nextLine.toLowerCase().includes('deposit')) {
						parsedData.less.deposit = extractFinancialValue(
							nextLine,
							'deposit',
						);
					}
				}
			}
		}

		// Validation: Check for required fields
		const errors = [];

		if (!parsedData.date) {
			errors.push('Date is missing');
		}

		if (!parsedData.vehicleNumber) {
			errors.push('Vehicle number is missing');
		}

		if (!parsedData.customerName) {
			errors.push('Customer name is missing');
		}

		if (!hasItems) {
			errors.push('No items found in the invoice');
		}

		if (errors.length > 0) {
			throw new Error(`Validation failed: ${errors.join(', ')}`);
		}

		// Calculate totals if not provided
		if (parsedData.total === 0 && parsedData.items.length > 0) {
			parsedData.total = parsedData.items.reduce(
				(sum, item) => sum + item.amount,
				0,
			);
		}

		// Calculate balance if not provided
		if (parsedData.balance === 0) {
			const deductions = parsedData.less.expenses + parsedData.less.deposit;
			parsedData.balance = parsedData.total - deductions;
		}

		return parsedData;
	} catch (error) {
		throw new Error(`Failed to parse invoice text: ${error.message}`);
	}
};

// Create invoice from text with validation

// Create invoice from text
export const createInvoice = async (req, res) => {
	try {
		const { text } = req.body;

		if (!text) {
			return res.status(400).json({
				success: false,
				error: 'No text provided',
			});
		}

		const parsedData = parseInvoiceText(text);

		// Additional validation
		if (parsedData.balance < 0) {
			return res.status(400).json({
				success: false,
				error: 'Invalid invoice: Balance cannot be negative',
			});
		}

		parsedData.rawText = text;

		const invoice = new Invoice(parsedData);
		await invoice.save();

		res.status(201).json({
			success: true,
			message: 'Invoice parsed and saved successfully',
			data: invoice,
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			error: error.message,
		});
	}
};

// Get all invoices
export const getInvoices = async (req, res) => {
	try {
		const { startDate, endDate, customer, vehicle } = req.query;
		let query = {};

		// Filter by date range
		if (startDate || endDate) {
			query.date = {};
			if (startDate) query.date.$gte = new Date(startDate);
			if (endDate) query.date.$lte = new Date(endDate);
		}

		// Filter by customer name
		if (customer) {
			query.customerName = { $regex: customer, $options: 'i' };
		}

		// Filter by vehicle number
		if (vehicle) {
			query.vehicleNumber = { $regex: vehicle, $options: 'i' };
		}

		const invoices = await Invoice.find(query).sort({ date: -1 });

		res.json({
			success: true,
			count: invoices.length,
			data: invoices,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

// Generate PDF
export const generatePDF = async (req, res) => {
	try {
		const { id } = req.params;
		const invoice = await Invoice.findById(id);

		if (!invoice) {
			return res.status(404).json({ error: 'Invoice not found' });
		}

		const doc = new PDFDocument({ margin: 50 });
		const filename = `invoice_${invoice._id}.pdf`;
		const filepath = path.join(__dirname, '..', 'temp', filename);

		// Ensure temp directory exists
		if (!fs.existsSync(path.join(__dirname, '..', 'temp'))) {
			fs.mkdirSync(path.join(__dirname, '..', 'temp'));
		}

		const stream = fs.createWriteStream(filepath);
		doc.pipe(stream);

		// PDF Content
		doc.fontSize(20).text('INVOICE RECEIPT', { align: 'center' });
		doc.moveDown();

		doc.fontSize(12);
		doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('en-GB')}`);
		doc.text(`Vehicle: ${invoice.vehicleNumber}`);
		doc.text(`Customer: ${invoice.customerName}`);
		doc.moveDown();

		// Table header
		doc.text('ITEMS:', { underline: true });
		doc.moveDown(0.5);

		// Items table
		const tableTop = doc.y;
		let tableY = tableTop;

		// Headers
		doc.text('Type', 50, tableY);
		doc.text('Weight (kg)', 150, tableY);
		doc.text('Rate', 250, tableY);
		doc.text('Amount (N)', 350, tableY);

		tableY += 20;

		// Items rows
		invoice.items.forEach((item) => {
			doc.text(item.type, 50, tableY);
			doc.text(item.weight.toLocaleString(), 150, tableY);
			doc.text(item.rate.toLocaleString(), 250, tableY);
			doc.text(`N${item.amount.toLocaleString()}`, 350, tableY);
			tableY += 20;
		});

		// Draw lines
		doc
			.moveTo(50, tableTop + 15)
			.lineTo(450, tableTop + 15)
			.stroke();
		doc.moveTo(50, tableY).lineTo(450, tableY).stroke();

		doc.moveDown();
		doc.text(`TOTAL: N${invoice.total.toLocaleString()}`);
		doc.text('Less:-');
		doc.text(`  Expenses: N${invoice.less.expenses.toLocaleString()}`);
		doc.text(`  Deposit: N${invoice.less.deposit.toLocaleString()}`);
		doc.moveDown();
		doc
			.fontSize(14)
			.text(`BALANCE: N${invoice.balance.toLocaleString()}`, { bold: true });

		doc.end();

		stream.on('finish', () => {
			res.download(filepath, filename, (err) => {
				if (err) {
					console.error('Download error:', err);
				}
				// Clean up temp file
				fs.unlinkSync(filepath);
			});
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

export const getStats = async (req, res) => {
	try {
		const today = new Date();
		const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

		const totalInvoices = await Invoice.countDocuments();
		const monthlyInvoices = await Invoice.countDocuments({
			createdAt: { $gte: startOfMonth },
		});

		const totalRevenue = await Invoice.aggregate([
			{
				$group: {
					_id: null,
					total: { $sum: '$total' },
					balance: { $sum: '$balance' },
				},
			},
		]);

		const monthlyRevenue = await Invoice.aggregate([
			{
				$match: {
					createdAt: { $gte: startOfMonth },
				},
			},
			{
				$group: {
					_id: null,
					total: { $sum: '$total' },
					balance: { $sum: '$balance' },
				},
			},
		]);

		res.json({
			success: true,
			data: {
				totalInvoices,
				monthlyInvoices,
				totalRevenue: totalRevenue[0] || { total: 0, balance: 0 },
				monthlyRevenue: monthlyRevenue[0] || { total: 0, balance: 0 },
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

// Get single invoice by ID
export const getInvoiceById = async (req, res) => {
	try {
		const { id } = req.params;
		const invoice = await Invoice.findById(id);

		if (!invoice) {
			return res.status(404).json({
				success: false,
				error: 'Invoice not found',
			});
		}

		res.json({
			success: true,
			data: invoice,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

// Update invoice
export const updateInvoice = async (req, res) => {
	try {
		const { id } = req.params;
		const updateData = req.body;

		// Validate required fields
		if (
			!updateData.date ||
			!updateData.vehicleNumber ||
			!updateData.customerName ||
			!updateData.items
		) {
			return res.status(400).json({
				success: false,
				error: 'Missing required fields',
			});
		}

		// Calculate totals if not provided
		if (!updateData.total && updateData.items.length > 0) {
			updateData.total = updateData.items.reduce(
				(sum, item) => sum + (item.amount || item.weight * item.rate),
				0,
			);
		}

		if (!updateData.balance) {
			const expenses = updateData.less?.expenses || 0;
			const deposit = updateData.less?.deposit || 0;
			updateData.balance = updateData.total - expenses - deposit;
		}

		const invoice = await Invoice.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true,
		});

		if (!invoice) {
			return res.status(404).json({
				success: false,
				error: 'Invoice not found',
			});
		}

		res.json({
			success: true,
			message: 'Invoice updated successfully',
			data: invoice,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
	try {
		const { id } = req.params;
		const invoice = await Invoice.findByIdAndDelete(id);

		if (!invoice) {
			return res.status(404).json({
				success: false,
				error: 'Invoice not found',
			});
		}

		res.json({
			success: true,
			message: 'Invoice deleted successfully',
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};
