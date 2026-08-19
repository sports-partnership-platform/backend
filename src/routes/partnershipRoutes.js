const express = require('express');
const router = express.Router();
const partnershipController = require('../controllers/partnershipController');
const { auth } = require('../middleware/auth');
const { hierarchyScope } = require('../middleware/hierarchyScope');

router.get('/matrix', auth, hierarchyScope, partnershipController.getPartnershipMatrix);
router.post('/update', auth, hierarchyScope, partnershipController.updatePartnership);

module.exports = router;
