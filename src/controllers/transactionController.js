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

  chain.forEach((p, idx) => {
    const sportConfig = p.sportsPartnership ? p.sportsPartnership.get(sportCode) : null;
    let percentage = 0;

    if (sportConfig) {
      // The percentage retained by this level is its remaining percentage
      percentage = sportConfig.remaining;
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
    breakdown: breakdown.sort((a, b) => b.level - a.level) // Display from L5/L3 down to L1 or L1 down to L3
  };
};

// POST /api/transactions/calculate
exports.calculateTransactionPayout = async (req, res) => {
  try {
    const { partnerId, sport, amount } = req.body;

    if (!partnerId || !sport || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid partnerId, sport, or amount' });
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

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
