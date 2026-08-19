const Sport = require('../models/Sport');

exports.getAllSports = async (req, res) => {
  try {
    const sports = await Sport.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, data: sports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSport = async (req, res) => {
  try {
    const { name, code, icon } = req.body;
    const existing = await Sport.findOne({ code: code.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Sport code already exists' });
    }

    const sport = new Sport({
      name,
      code: code.toLowerCase(),
      icon: icon || 'trophy'
    });

    await sport.save();
    res.status(201).json({ success: true, data: sport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
