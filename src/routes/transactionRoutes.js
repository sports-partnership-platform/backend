const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.get('/', transactionController.getAllTransactions);
router.get('/:id', transactionController.getTransactionById);
router.post('/calculate', transactionController.calculateTransactionPayout);
router.post('/', transactionController.createTransaction);

module.exports = router;
