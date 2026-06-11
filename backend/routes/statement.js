import express from 'express';
import {
	getStatements,
	getStatementByYear,
	createStatement,
	updateStatement,
	deleteStatement,
	duplicateStatement,
} from '../controllers/statement.js';

const router = express.Router();

router.route('/').get(getStatements).post(createStatement);
router
	.route('/:year')
	.get(getStatementByYear)
	.put(updateStatement)
	.delete(deleteStatement);
router.post('/:year/duplicate', duplicateStatement);

export default router;
