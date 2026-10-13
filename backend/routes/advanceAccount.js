import express from 'express';
import {
	getAdvanceAccount,
	newCredit,
	newDebit,
	editTransaction,
	deleteTransaction,
} from '../controllers/advanceAccount.js';

const router = express.Router();

router.get('/:id', getAdvanceAccount);
router.post('/:id/credit', newCredit);
router.post('/:id/debit', newDebit);
router.patch('/:id/transaction/:transactionId', editTransaction);
router.delete('/:id/transaction/:transactionId', deleteTransaction);

export default router;
