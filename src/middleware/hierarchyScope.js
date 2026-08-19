const Partner = require('../models/Partner');

// Helper to retrieve an array of all Partner ObjectIds in the user's downline sub-tree + self
const getSubtreePartnerIds = async (user) => {
  if (user.level === 0) {
    return null; // Null indicates unrestricted access
  }

  const selfPartnerId = user.partnerRef?._id || user.partnerRef;
  if (!selfPartnerId) {
    return [];
  }

  const downlines = await Partner.find({
    uplines: selfPartnerId
  }).select('_id partnerId');

  const downlineIds = downlines.map(d => d._id);
  return [selfPartnerId, ...downlineIds];
};

// Middleware that attaches allowed subtree IDs to req.allowedPartnerIds
const hierarchyScope = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    req.allowedPartnerIds = await getSubtreePartnerIds(req.user);
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { hierarchyScope, getSubtreePartnerIds };
