const express = require('express');
const router = express.Router();
const sportController = require('../controllers/sportController');

router.get('/', sportController.getAllSports);
router.post('/', sportController.createSport);

module.exports = router;
