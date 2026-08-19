const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { auth } = require('../middleware/auth');
const { hierarchyScope } = require('../middleware/hierarchyScope');

router.get('/', auth, hierarchyScope, transactionController.getAllTransactions);
router.get('/:id', auth, hierarchyScope, transactionController.getTransactionById);
router.post('/calculate', auth, hierarchyScope, transactionController.calculateTransactionPayout);
router.post('/', auth, hierarchyScope, transactionController.createTransaction);

module.exports = router;
