const Partner = require('../models/Partner');
const Sport = require('../models/Sport');

// Get all partners
exports.getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find()
      .populate('parentId', 'partnerId name level')
      .populate('uplines', 'partnerId name level')
      .sort({ level: 1, createdAt: -1 });

    res.json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get partner by ID with populated uplines and downlines
exports.getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id)
      .populate('parentId', 'partnerId name level status')
      .populate('uplines', 'partnerId name level status sportsPartnership');

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    const downlines = await Partner.find({ parentId: partner._id })
      .select('partnerId name level status sportsPartnership');

    res.json({
      success: true,
      data: {
        partner,
        downlines
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get partner hierarchy tree structure
exports.getPartnerTree = async (req, res) => {
  try {
    const allPartners = await Partner.find().lean();

    // Map by _id for fast lookup
    const partnerMap = {};
    allPartners.forEach(p => {
      partnerMap[p._id.toString()] = { ...p, children: [] };
    });

    const rootNodes = [];
    allPartners.forEach(p => {
      if (p.parentId && partnerMap[p.parentId.toString()]) {
        partnerMap[p.parentId.toString()].children.push(partnerMap[p._id.toString()]);
      } else {
        rootNodes.push(partnerMap[p._id.toString()]);
      }
    });

    res.json({ success: true, data: rootNodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new partner
exports.createPartner = async (req, res) => {
  try {
    const { name, email, phone, parentId, status } = req.body;

    let level = 1;
    let uplines = [];
    let sportsPartnershipMap = new Map();

    const sports = await Sport.find({ active: true });

    if (parentId) {
      const parent = await Partner.findById(parentId);
      if (!parent) {
        return res.status(400).json({ success: false, message: 'Parent partner not found' });
      }

      if (parent.level >= 5) {
        return res.status(400).json({ success: false, message: 'Cannot create partner below Level 5' });
      }

      level = parent.level + 1;
      uplines = [...(parent.uplines || []), parent._id];

      // Inherit sports received percentage from parent's given percentage
      sports.forEach(sport => {
        const parentSportConfig = parent.sportsPartnership ? parent.sportsPartnership.get(sport.code) : null;
        const received = parentSportConfig ? parentSportConfig.given : 0;
        sportsPartnershipMap.set(sport.code, {
          received: received,
          given: 0,
          remaining: received
        });
      });
    } else {
      // Level 1 partner starts with 100% for all active sports
      sports.forEach(sport => {
        sportsPartnershipMap.set(sport.code, {
          received: 100,
          given: 0,
          remaining: 100
        });
      });
    }

    // Auto-generate Partner ID e.g., P-10001
    const count = await Partner.countDocuments();
    const partnerId = `P-${10000 + count + 1}`;

    const newPartner = new Partner({
      partnerId,
      name,
      email,
      phone,
      level,
      parentId: parentId || null,
      uplines,
      status: status || 'Active',
      sportsPartnership: sportsPartnershipMap
    });

    await newPartner.save();

    res.status(201).json({ success: true, data: newPartner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update partner status or details
exports.updatePartner = async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    if (name) partner.name = name;
    if (email) partner.email = email;
    if (phone) partner.phone = phone;
    if (status) partner.status = status;

    await partner.save();

    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete partner (only if no downlines)
exports.deletePartner = async (req, res) => {
  try {
    const childCount = await Partner.countDocuments({ parentId: req.params.id });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete partner who has existing downline partners'
      });
    }

    await Partner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Partner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
