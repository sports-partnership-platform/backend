const Partner = require('../models/Partner');
const Transaction = require('../models/Transaction');
const Sport = require('../models/Sport');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalPartners = await Partner.countDocuments();
    const activePartners = await Partner.countDocuments({ status: 'Active' });

    // Level breakdown (L0: Owner down to L5)
    const levelsCount = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 };
    const partners = await Partner.find().select('level status');
    partners.forEach(p => {
      const key = `L${p.level}`;
      if (levelsCount[key] !== undefined) {
        levelsCount[key]++;
      }
    });

    // Total transactions revenue
    const transactions = await Transaction.find();
    let totalRevenue = 0;
    const sportsRevenue = {};

    transactions.forEach(t => {
      totalRevenue += t.amount;
      if (!sportsRevenue[t.sport]) {
        sportsRevenue[t.sport] = { sportName: t.sportName, totalAmount: 0, count: 0 };
      }
      sportsRevenue[t.sport].totalAmount += t.amount;
      sportsRevenue[t.sport].count += 1;
    });

    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          totalPartners,
          activePartners,
          totalRevenue,
          totalTransactions: transactions.length
        },
        levelsCount,
        sportsRevenue: Object.values(sportsRevenue),
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEarningsReport = async (req, res) => {
  try {
    const transactions = await Transaction.find();
    const partnerEarningsMap = {};

    transactions.forEach(t => {
      t.breakdown.forEach(item => {
        const idStr = item.partnerId.toString();
        if (!partnerEarningsMap[idStr]) {
          partnerEarningsMap[idStr] = {
            partnerId: idStr,
            partnerCode: item.partnerCode,
            partnerName: item.partnerName,
            level: item.level,
            totalEarnings: 0,
            sportsBreakdown: {}
          };
        }

        partnerEarningsMap[idStr].totalEarnings += item.amount;
        if (!partnerEarningsMap[idStr].sportsBreakdown[t.sport]) {
          partnerEarningsMap[idStr].sportsBreakdown[t.sport] = 0;
        }
        partnerEarningsMap[idStr].sportsBreakdown[t.sport] += item.amount;
      });
    });

    const partnerEarnings = Object.values(partnerEarningsMap).sort((a, b) => b.totalEarnings - a.totalEarnings);

    res.json({
      success: true,
      data: partnerEarnings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
