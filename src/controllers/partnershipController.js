const Partner = require('../models/Partner');
const Sport = require('../models/Sport');

// Recursive helper function to update downlines sports partnership
const cascadeDownlinePartnership = async (parentId, sportCode, newGivenPercentage) => {
  const children = await Partner.find({ parentId });

  for (const child of children) {
    let childSportConfig = child.sportsPartnership.get(sportCode) || { received: 0, given: 0, remaining: 0 };
    
    const newReceived = newGivenPercentage;
    let newGiven = childSportConfig.given;

    // Cap given percentage if it exceeds newly received percentage
    if (newGiven > newReceived) {
      newGiven = newReceived;
    }

    const newRemaining = newReceived - newGiven;

    child.sportsPartnership.set(sportCode, {
      received: newReceived,
      given: newGiven,
      remaining: newRemaining
    });

    await child.save();

    // Recursively cascade down to grandchildren
    await cascadeDownlinePartnership(child._id, sportCode, newGiven);
  }
};

// Update partnership configuration for a partner for a specific sport
exports.updatePartnership = async (req, res) => {
  try {
    const { partnerId, sportCode, given } = req.body;

    if (given < 0 || given > 100) {
      return res.status(400).json({ success: false, message: 'Given percentage must be between 0 and 100' });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    const currentSportConfig = partner.sportsPartnership.get(sportCode) || { received: partner.level === 0 ? 100 : 0, given: 0, remaining: 0 };
    const received = partner.level === 0 ? 100 : currentSportConfig.received;

    if (given > received) {
      return res.status(400).json({
        success: false,
        message: `Given percentage (${given}%) cannot exceed available received percentage (${received}%)`
      });
    }

    const remaining = received - given;

    partner.sportsPartnership.set(sportCode, {
      received,
      given,
      remaining
    });

    await partner.save();

    // Cascade to downlines
    await cascadeDownlinePartnership(partner._id, sportCode, given);

    res.json({
      success: true,
      message: 'Partnership updated and cascaded successfully across all downlines',
      data: partner
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get sports partnership matrix for all partners (Owner down to Level 5)
exports.getPartnershipMatrix = async (req, res) => {
  try {
    const partners = await Partner.find()
      .populate('parentId', 'partnerId name level roleTitle')
      .populate('uplines', 'partnerId name level roleTitle')
      .sort({ level: 1, createdAt: 1 });

    const sports = await Sport.find({ active: true });

    // Format matrix data for UI rendering
    const matrix = partners.map(partner => {
      const sportsWise = {};
      sports.forEach(sport => {
        const config = partner.sportsPartnership ? partner.sportsPartnership.get(sport.code) : null;
        sportsWise[sport.code] = config || {
          received: partner.level === 0 ? 100 : 0,
          given: 0,
          remaining: partner.level === 0 ? 100 : 0
        };
      });

      return {
        _id: partner._id,
        partnerId: partner.partnerId,
        name: partner.name,
        level: partner.level,
        roleTitle: partner.roleTitle || (partner.level === 0 ? 'Platform Owner' : `Level ${partner.level}`),
        parent: partner.parentId,
        uplines: partner.uplines,
        sportsWise
      };
    });

    res.json({
      success: true,
      data: {
        sports,
        matrix
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
