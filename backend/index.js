import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
// import connectDB from './utils/connectDB.js';
import morgan from 'morgan';
// import { fileURLToPath } from 'url';
// routes
// import adminRoutes from './routes/admin/index.js';
import generalRoutes from './routes/general.js';
import userRoutes from './routes/user.js';
import healthcheckRoutes from './routes/healthcheck.js';
import supplyRoutes from './routes/supply.js';
import paymentRoutes from './routes/payment.js';
import transactionRoutes from './routes/transaction.js';
import customerRoutes from './routes/customer.js';
import debtorRoutes from './routes/debtor.js';
import creditorRoutes from './routes/creditors.js';
import accountRoutes from './routes/account.js';
import priceRoutes from './routes/price.js';
import receiptRoutes from './routes/receipt.js';
import invoiceRoutes from './routes/invoice.js';
import waybillRoutes from './routes/waybill.js';
// import errorHandler from './middleware/errorHandler.js';

/* CONFIGURATION */
dotenv.config();
const app = express();

const PORT = process.env.PORT || 9000;
// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	validate: { xForwardedForHeader: false },
	handler: (_, __, ___, options) => {
		throw new Error(
			options.statusCode || 500,
			`There are too many requests. You are only allowed ${
				options.max
			} requests per ${options.windowMs / 60000} minutes`
		);
	},
});

// Apply the rate limiting middleware to all requests
app.use(limiter);
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(express.static('public')); // configure static file to save images locally
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors('*'));
app.use(
	cors({
		origin: [
			'http://localhost:3000',
			'http://localhost:5173',
			'https://salisukano.com',
		],
		credentials: true,
	})
);
// connectDB();

/* ROUTES */
app.use('/', healthcheckRoutes);
app.use('/users', userRoutes);
app.use('/accounts', accountRoutes);
app.use('/transactions', transactionRoutes);
app.use('/general', generalRoutes);
app.use('/supplies', supplyRoutes);
app.use('/payments', paymentRoutes);
app.use('/prices', priceRoutes);
app.use('/customers', customerRoutes);
app.use('/debtors', debtorRoutes);
app.use('/creditors', creditorRoutes);
app.use('/receipt', receiptRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/waybills', waybillRoutes);
// app.use(errorHandler);

/* MONGOOSE SETUP */
mongoose
	.connect(process.env.MONGO_URL)
	.then(() => {
		app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
	})
	.catch((error) => console.log(`${error} did not connect`));
