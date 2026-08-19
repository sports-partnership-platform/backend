const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { auth } = require('../middleware/auth');
const { hierarchyScope } = require('../middleware/hierarchyScope');

router.get('/', auth, hierarchyScope, partnerController.getAllPartners);
router.get('/tree', auth, hierarchyScope, partnerController.getPartnerTree);
router.get('/:id', auth, hierarchyScope, partnerController.getPartnerById);
router.post('/', auth, hierarchyScope, partnerController.createPartner);
router.post('/:id/reset-password', auth, hierarchyScope, partnerController.resetPartnerPassword);
router.put('/:id', auth, hierarchyScope, partnerController.updatePartner);
router.delete('/:id', auth, hierarchyScope, partnerController.deletePartner);

module.exports = router;
