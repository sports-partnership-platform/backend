const Partner = require('../models/Partner');
const Transaction = require('../models/Transaction');
const Sport = require('../models/Sport');

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

exports.getDashboardStats = async (req, res) => {
  try {
    const partnerFilter = {};
    if (req.allowedPartnerIds) {
      partnerFilter._id = { $in: req.allowedPartnerIds };
    }

    const currentPartnerId = (req.user?.partnerRef?._id || req.user?.partnerRef || '').toString();
    const totalPartners = await Partner.countDocuments(partnerFilter);
    const activePartners = await Partner.countDocuments({ ...partnerFilter, status: 'Active' });

    // Level breakdown for accessible hierarchy
    const levelsCount = { L0: 0, L1: 0, L2: 0, L3: 0, L4: 0, L5: 0 };
    const partners = await Partner.find(partnerFilter).select('level status');
    partners.forEach(p => {
      const key = `L${p.level}`;
      if (levelsCount[key] !== undefined) {
        levelsCount[key]++;
      }
    });

    // Transaction scoping
    const txFilter = {};
    if (req.allowedPartnerIds) {
      txFilter.$or = [
        { partnerId: { $in: req.allowedPartnerIds } },
        { 'breakdown.partnerId': req.user.partnerRef._id }
      ];
    }

    const transactions = await Transaction.find(txFilter);
    let totalRevenue = 0;
    let myEarnings = 0;
    const sportsRevenue = {};

    transactions.forEach(t => {
      totalRevenue += t.amount;
      if (!sportsRevenue[t.sport]) {
        sportsRevenue[t.sport] = { sportName: t.sportName || t.sport, totalAmount: 0, count: 0 };
      }
      sportsRevenue[t.sport].totalAmount += t.amount;
      sportsRevenue[t.sport].count += 1;

      // Calculate current user's personal earnings
      if (t.breakdown && currentPartnerId) {
        t.breakdown.forEach(item => {
          if (item.partnerId && item.partnerId.toString() === currentPartnerId) {
            myEarnings += item.amount;
          }
        });
      }
    });

    const recentTransactions = await Transaction.find(txFilter)
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          totalPartners,
          activePartners,
          totalRevenue,
          totalTransactions: transactions.length,
          myEarnings: Number(myEarnings.toFixed(2)),
          userLevel: req.user?.level ?? 0,
          userRole: req.user?.roleTitle || getRoleTitle(req.user?.level ?? 0),
          userName: req.user?.partnerRef?.name || req.user?.username
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
    const partnerFilter = {};
    if (req.allowedPartnerIds) {
      partnerFilter._id = { $in: req.allowedPartnerIds };
    }

    const currentPartnerId = (req.user?.partnerRef?._id || req.user?.partnerRef || '').toString();

    // 1. Fetch all partners within user's view scope
    const partners = await Partner.find(partnerFilter).sort({ level: 1, name: 1 });
    const sports = await Sport.find({ active: true });

    // 2. Pre-populate all scoped partners into the map so 0-earning partners are never omitted
    const partnerEarningsMap = {};
    partners.forEach(p => {
      const pIdStr = p._id.toString();
      const sportsBreakdown = {};
      const sportsDirect = {};
      const sportsOverride = {};

      sports.forEach(s => {
        sportsBreakdown[s.code] = 0;
        sportsDirect[s.code] = 0;
        sportsOverride[s.code] = 0;
      });

      partnerEarningsMap[pIdStr] = {
        partnerId: pIdStr,
        partnerCode: p.partnerId,
        partnerName: p.name,
        level: p.level,
        roleTitle: p.roleTitle || getRoleTitle(p.level),
        status: p.status,
        isCurrentUser: pIdStr === currentPartnerId,
        directEarnings: 0,
        overrideEarnings: 0,
        totalEarnings: 0,
        transactionCount: 0,
        sportsBreakdown,
        sportsDirect,
        sportsOverride
      };
    });

    // 3. Transaction scoping
    const txFilter = {};
    if (req.allowedPartnerIds) {
      txFilter.$or = [
        { partnerId: { $in: req.allowedPartnerIds } },
        { 'breakdown.partnerId': req.user.partnerRef._id }
      ];
    }

    const transactions = await Transaction.find(txFilter).sort({ createdAt: -1 });

    let totalTurnoverVolume = 0;
    const sportsAggregation = {};
    sports.forEach(s => {
      sportsAggregation[s.code] = {
        code: s.code,
        name: s.name,
        totalEarnings: 0,
        totalVolume: 0,
        transactionCount: 0,
        percentageShare: 0
      };
    });

    // 4. Attribute earnings across partners and sports
    transactions.forEach(t => {
      totalTurnoverVolume += t.amount;
      if (!sportsAggregation[t.sport]) {
        sportsAggregation[t.sport] = {
          code: t.sport,
          name: t.sportName || t.sport,
          totalEarnings: 0,
          totalVolume: 0,
          transactionCount: 0,
          percentageShare: 0
        };
      }
      sportsAggregation[t.sport].totalVolume += t.amount;
      sportsAggregation[t.sport].transactionCount += 1;

      const genPartnerIdStr = t.partnerId.toString();

      t.breakdown.forEach(item => {
        const idStr = item.partnerId.toString();

        // Check if visible to current user
        if (req.allowedPartnerIds) {
          const allowedStrIds = req.allowedPartnerIds.map(id => id.toString());
          if (!allowedStrIds.includes(idStr)) return;
        }

        if (!partnerEarningsMap[idStr]) {
          const initSports = {};
          const initDirect = {};
          const initOverride = {};
          sports.forEach(s => {
            initSports[s.code] = 0;
            initDirect[s.code] = 0;
            initOverride[s.code] = 0;
          });

          partnerEarningsMap[idStr] = {
            partnerId: idStr,
            partnerCode: item.partnerCode || '',
            partnerName: item.partnerName || '',
            level: item.level,
            roleTitle: getRoleTitle(item.level),
            status: 'Active',
            isCurrentUser: idStr === currentPartnerId,
            directEarnings: 0,
            overrideEarnings: 0,
            totalEarnings: 0,
            transactionCount: 0,
            sportsBreakdown: initSports,
            sportsDirect: initDirect,
            sportsOverride: initOverride
          };
        }

        const isDirect = idStr === genPartnerIdStr;
        const amountEarned = Number(item.amount) || 0;

        partnerEarningsMap[idStr].totalEarnings = Number((partnerEarningsMap[idStr].totalEarnings + amountEarned).toFixed(2));
        partnerEarningsMap[idStr].transactionCount += 1;

        if (isDirect) {
          partnerEarningsMap[idStr].directEarnings = Number((partnerEarningsMap[idStr].directEarnings + amountEarned).toFixed(2));
          partnerEarningsMap[idStr].sportsDirect[t.sport] = Number(((partnerEarningsMap[idStr].sportsDirect[t.sport] || 0) + amountEarned).toFixed(2));
        } else {
          partnerEarningsMap[idStr].overrideEarnings = Number((partnerEarningsMap[idStr].overrideEarnings + amountEarned).toFixed(2));
          partnerEarningsMap[idStr].sportsOverride[t.sport] = Number(((partnerEarningsMap[idStr].sportsOverride[t.sport] || 0) + amountEarned).toFixed(2));
        }

        partnerEarningsMap[idStr].sportsBreakdown[t.sport] = Number(((partnerEarningsMap[idStr].sportsBreakdown[t.sport] || 0) + amountEarned).toFixed(2));
        sportsAggregation[t.sport].totalEarnings = Number((sportsAggregation[t.sport].totalEarnings + amountEarned).toFixed(2));
      });
    });

    const partnerEarningsList = Object.values(partnerEarningsMap).sort((a, b) => b.totalEarnings - a.totalEarnings || a.level - b.level);

    res.json({
      success: true,
      data: partnerEarningsList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


