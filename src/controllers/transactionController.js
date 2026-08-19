const Transaction = require('../models/Transaction');
const Partner = require('../models/Partner');
const Sport = require('../models/Sport');

// Calculate payout breakdown without saving
const computePayoutBreakdown = async (partnerId, sportCode, amount) => {
  const partner = await Partner.findById(partnerId).populate({
    path: 'uplines',
    select: 'partnerId name level sportsPartnership'
  });

  if (!partner) {
    throw new Error('Generating partner not found');
  }

  const sportDoc = await Sport.findOne({ code: sportCode });
  const sportName = sportDoc ? sportDoc.name : sportCode;

  // Chain includes generating partner + all uplines
  const chain = [partner, ...partner.uplines].sort((a, b) => b.level - a.level); // sort highest level to L1

  const breakdown = [];
  let totalPercentageCalculated = 0;

  chain.forEach((p) => {
    const sportConfig = p.sportsPartnership ? p.sportsPartnership.get(sportCode) : null;
    let percentage = 0;

    if (sportConfig) {
      const isGeneratingPartner = p._id.toString() === partner._id.toString();
      // Generating partner retains their full received % for their direct turnover
      // All uplines in the cascade retain their negotiated remaining %
      percentage = isGeneratingPartner ? (sportConfig.received ?? (p.level === 0 ? 100 : 0)) : (sportConfig.remaining ?? 0);
    } else if (p.level === 0) {
      percentage = (p._id.toString() === partner._id.toString()) ? 100 : 100;
    }

    const payout = (amount * percentage) / 100;
    totalPercentageCalculated += percentage;

    breakdown.push({
      level: p.level,
      partnerId: p._id,
      partnerCode: p.partnerId,
      partnerName: p.name,
      percentage: Number(percentage.toFixed(2)),
      amount: Number(payout.toFixed(2)),
      formula: `₹${amount.toLocaleString('en-IN')} × ${percentage}% = ₹${payout.toLocaleString('en-IN')}`
    });
  });

  return {
    partner,
    sportName,
    amount,
    totalPercentageCalculated,
    breakdown: breakdown.sort((a, b) => b.level - a.level)
  };
};

// POST /api/transactions/calculate
exports.calculateTransactionPayout = async (req, res) => {
  try {
    const { partnerId, sport, amount } = req.body;

    if (!partnerId || !sport || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid partnerId, sport, or amount' });
    }

    // Permission check: Non-owner can only calculate for permitted subtree partners
    if (req.allowedPartnerIds) {
      const allowedStrIds = req.allowedPartnerIds.map(id => id.toString());
      if (!allowedStrIds.includes(partnerId.toString())) {
        return res.status(403).json({ success: false, message: 'Permission denied: Cannot simulate outside your network' });
      }
    }

    const result = await computePayoutBreakdown(partnerId, sport, amount);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/transactions
exports.createTransaction = async (req, res) => {
  try {
    const { partnerId, sport, amount, note } = req.body;

    if (!partnerId || !sport || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid transaction input' });
    }

    // Permission check
    if (req.allowedPartnerIds) {
      const allowedStrIds = req.allowedPartnerIds.map(id => id.toString());
      if (!allowedStrIds.includes(partnerId.toString())) {
        return res.status(403).json({ success: false, message: 'Permission denied: Cannot create transaction for this partner' });
      }
    }

    const payoutData = await computePayoutBreakdown(partnerId, sport, amount);

    const count = await Transaction.countDocuments();
    const transactionId = `TX-${10000 + count + 1}`;

    const newTransaction = new Transaction({
      transactionId,
      partnerId: payoutData.partner._id,
      partnerName: payoutData.partner.name,
      partnerLevel: payoutData.partner.level,
      sport,
      sportName: payoutData.sportName,
      amount,
      note: note || '',
      breakdown: payoutData.breakdown
    });

    await newTransaction.save();

    res.status(201).json({ success: true, data: newTransaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { partnerId, sport, level } = req.query;

    const query = {};
    if (partnerId) query.partnerId = partnerId;
    if (sport) query.sport = sport;
    if (level) query.partnerLevel = Number(level);

    if (req.allowedPartnerIds) {
      // Non-owner sees transactions where they generated it, or where it occurred in their downline, or where they receive a split
      query.$or = [
        { partnerId: { $in: req.allowedPartnerIds } },
        { 'breakdown.partnerId': req.user.partnerRef._id }
      ];
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/transactions/:id
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (req.allowedPartnerIds) {
      const allowedStrIds = req.allowedPartnerIds.map(id => id.toString());
      const isInDownline = allowedStrIds.includes(transaction.partnerId.toString());
      const isInBreakdown = transaction.breakdown.some(b => b.partnerId.toString() === req.user.partnerRef._id.toString());
      if (!isInDownline && !isInBreakdown) {
        return res.status(403).json({ success: false, message: 'Access denied to this transaction receipt' });
      }
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
