const Partner = require('../models/Partner');
const Sport = require('../models/Sport');
const User = require('../models/User');

// Role titles helper
const getRoleTitle = (level) => {
  switch (level) {
    case 0: return 'Platform Owner';
    case 1: return 'Senior Partner';
    case 2: return 'Sub-Partner';
    case 3: return 'Master Agent';
    case 4: return 'Agent';
    case 5: return 'Sub-Agent';
    default: return 'Partner';
  }
};

// Get all partners (scoped to user's permitted subtree or all for Owner)
exports.getAllPartners = async (req, res) => {
  try {
    const filter = {};
    if (req.allowedPartnerIds) {
      filter._id = { $in: req.allowedPartnerIds };
    }

    const partners = await Partner.find(filter)
      .populate('parentId', 'partnerId name level roleTitle')
      .populate('uplines', 'partnerId name level roleTitle')
      .sort({ level: 1, createdAt: 1 });

    res.json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get partner by ID with populated uplines and downlines
exports.getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id)
      .populate('parentId', 'partnerId name level roleTitle status')
      .populate('uplines', 'partnerId name level roleTitle status sportsPartnership');

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    // Check permission: Non-owner can only inspect self, downlines, or ancestors
    if (req.allowedPartnerIds) {
      const allowedStrIds = req.allowedPartnerIds.map(id => id.toString());
      const uplineStrIds = (req.user.partnerRef?.uplines || []).map(id => id.toString());
      const isAllowed = allowedStrIds.includes(partner._id.toString()) || uplineStrIds.includes(partner._id.toString());
      if (!isAllowed) {
        return res.status(403).json({ success: false, message: 'Access denied to this partner profile' });
      }
    }

    const downlines = await Partner.find({ parentId: partner._id })
      .select('partnerId name level roleTitle status sportsPartnership');

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

// Get partner hierarchy tree structure (scoped to user's root / subtree)
exports.getPartnerTree = async (req, res) => {
  try {
    const filter = {};
    if (req.allowedPartnerIds) {
      filter._id = { $in: req.allowedPartnerIds };
    }

    const allPartners = await Partner.find(filter)
      .populate('parentId', 'partnerId name level roleTitle')
      .populate('uplines', 'partnerId name level roleTitle')
      .lean();

    // Map by _id for fast lookup
    const partnerMap = {};
    allPartners.forEach(p => {
      partnerMap[p._id.toString()] = { ...p, children: [] };
    });

    const rootNodes = [];
    allPartners.forEach(p => {
      if (p.parentId && p.parentId._id && partnerMap[p.parentId._id.toString()]) {
        partnerMap[p.parentId._id.toString()].children.push(partnerMap[p._id.toString()]);
      } else if (p.parentId && typeof p.parentId === 'string' && partnerMap[p.parentId]) {
        partnerMap[p.parentId].children.push(partnerMap[p._id.toString()]);
      } else {
        // If it has no parent in the scoped set, it is a root of this tree
        rootNodes.push(partnerMap[p._id.toString()]);
      }
    });

    res.json({ success: true, data: rootNodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new partner and provision their User login credentials
exports.createPartner = async (req, res) => {
  try {
    const { name, email, phone, parentId, username, password, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Partner name is required' });
    }

    const creator = req.user;
    if (!creator) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (creator.level >= 5) {
      return res.status(403).json({
        success: false,
        message: 'Level 5 Sub-Agents cannot create downline partners (Maximum hierarchy depth reached)'
      });
    }

    let level = 1;
    let uplines = [];
    let effectiveParent = null;
    let sportsPartnershipMap = new Map();

    const sports = await Sport.find({ active: true });
    const owner = await Partner.findOne({ level: 0 });

    if (creator.level === 0) {
      // Platform Owner can choose parent (Level 0 to 4)
      if (parentId && parentId.toString() !== owner._id.toString()) {
        effectiveParent = await Partner.findById(parentId);
        if (!effectiveParent) {
          return res.status(400).json({ success: false, message: 'Selected parent partner not found' });
        }
        if (effectiveParent.level >= 5) {
          return res.status(400).json({ success: false, message: 'Maximum hierarchy depth reached (Level 5)' });
        }
        level = effectiveParent.level + 1;
        uplines = [...(effectiveParent.uplines || []), effectiveParent._id];
      } else {
        // Created directly under Owner -> Level 1
        effectiveParent = owner;
        level = 1;
        uplines = [owner._id];
      }
    } else {
      // Non-owner creator (Level 1 to 4): strictly parented under the creator
      effectiveParent = await Partner.findById(creator.partnerRef._id || creator.partnerRef);
      if (!effectiveParent) {
        return res.status(400).json({ success: false, message: 'Creator partner record not found' });
      }
      level = creator.level + 1;
      uplines = [...(effectiveParent.uplines || []), effectiveParent._id];
    }

    // Inherit sports received percentage from parent's given percentage
    sports.forEach(sport => {
      const parentSportConfig = effectiveParent.sportsPartnership ? effectiveParent.sportsPartnership.get(sport.code) : null;
      const received = parentSportConfig ? parentSportConfig.given : 0;
      sportsPartnershipMap.set(sport.code, {
        received: received,
        given: 0,
        remaining: received
      });
    });

    // Auto-generate Partner ID
    const count = await Partner.countDocuments();
    const partnerId = `P-${10000 + count + 1}`;

    const newPartner = new Partner({
      partnerId,
      name: name.trim(),
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
      level,
      roleTitle: getRoleTitle(level),
      parentId: effectiveParent._id,
      uplines,
      status: status || 'Active',
      sportsPartnership: sportsPartnershipMap
    });

    await newPartner.save();

    // Provision User credentials for the new partner
    let cleanUsername = username ? username.trim().toLowerCase() : partnerId.toLowerCase();
    let plainPassword = password && password.trim() ? password.trim() : 'password123';

    // Check if username is taken
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      cleanUsername = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const hashedPassword = await User.hashPassword(plainPassword);

    const newUser = new User({
      username: cleanUsername,
      password: hashedPassword,
      partnerId: newPartner.partnerId,
      partnerRef: newPartner._id,
      level: newPartner.level,
      roleTitle: newPartner.roleTitle,
      status: newPartner.status
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: `Partner created successfully as ${getRoleTitle(level)}`,
      data: newPartner,
      credentials: {
        username: cleanUsername,
        temporaryPassword: plainPassword
      }
    });
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

    if (req.allowedPartnerIds) {
      const allowedStrIds = req.allowedPartnerIds.map(id => id.toString());
      if (!allowedStrIds.includes(partner._id.toString())) {
        return res.status(403).json({ success: false, message: 'Permission denied: Cannot edit partner outside your network' });
      }
    }

    if (name) partner.name = name;
    if (email) partner.email = email;
    if (phone) partner.phone = phone;
    if (status) partner.status = status;

    await partner.save();

    // Also update associated User status if changed
    if (status) {
      await User.updateOne({ partnerRef: partner._id }, { status });
    }

    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete partner (only if no downlines)
exports.deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }

    if (partner.level === 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete the Platform Root Owner' });
    }

    if (req.allowedPartnerIds) {
      const allowedStrIds = req.allowedPartnerIds.map(id => id.toString());
      const selfId = (req.user.partnerRef?._id || req.user.partnerRef).toString();
      if (partner._id.toString() === selfId || !allowedStrIds.includes(partner._id.toString())) {
        return res.status(403).json({ success: false, message: 'Permission denied: You can only delete accounts in your downline' });
      }
    }

    const childCount = await Partner.countDocuments({ parentId: req.params.id });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete partner who has existing downline partners'
      });
    }

    await Partner.findByIdAndDelete(req.params.id);
    await User.deleteMany({ partnerRef: req.params.id });

    res.json({ success: true, message: 'Partner and login credentials deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset partner password / credentials
exports.resetPartnerPassword = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found.' });
    }

    if (req.allowedPartnerIds) {
      const allowedStrIds = req.allowedPartnerIds.map(id => id.toString());
      const selfId = (req.user.partnerRef?._id || req.user.partnerRef).toString();
      if (partner._id.toString() === selfId || !allowedStrIds.includes(partner._id.toString())) {
        return res.status(403).json({ success: false, message: 'Permission denied: You can only reset passwords for downline accounts' });
      }
    }

    // Find user record associated with this partner
    let user = await User.findOne({ partnerRef: partner._id }) || await User.findOne({ partnerId: partner.partnerId });

    // Generate new random password or use provided
    let newPlainPassword = req.body.newPassword && req.body.newPassword.trim();
    if (!newPlainPassword) {
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
      let rnd = '';
      for (let i = 0; i < 8; i++) {
        rnd += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      newPlainPassword = `pass@${rnd}`;
    }

    const hashedPassword = await User.hashPassword(newPlainPassword);

    if (!user) {
      // If no User record existed yet, create one for this partner
      let cleanUsername = partner.name ? partner.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : partner.partnerId.toLowerCase();
      const existingUser = await User.findOne({ username: cleanUsername });
      if (existingUser) {
        cleanUsername = `${cleanUsername}_${Math.floor(100 + Math.random() * 900)}`;
      }

      user = new User({
        username: cleanUsername,
        password: hashedPassword,
        partnerId: partner.partnerId,
        partnerRef: partner._id,
        level: partner.level,
        roleTitle: partner.roleTitle || 'Partner',
        status: partner.status || 'Active'
      });
      await user.save();
    } else {
      user.password = hashedPassword;
      await user.save();
    }

    res.json({
      success: true,
      message: `Password reset successfully for ${partner.name}`,
      credentials: {
        partnerName: partner.name,
        partnerId: partner.partnerId,
        level: partner.level,
        roleTitle: partner.roleTitle || 'Partner',
        username: user.username,
        temporaryPassword: newPlainPassword
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reset password' });
  }
};
