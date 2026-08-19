const express = require('express');
const router = express.Router();
const partnershipController = require('../controllers/partnershipController');

router.get('/matrix', partnershipController.getPartnershipMatrix);
router.post('/update', partnershipController.updatePartnership);

module.exports = router;
