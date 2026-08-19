const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth } = require('../middleware/auth');
const { hierarchyScope } = require('../middleware/hierarchyScope');

router.get('/dashboard', auth, hierarchyScope, reportController.getDashboardStats);
router.get('/earnings', auth, hierarchyScope, reportController.getEarningsReport);

module.exports = router;
