const Sport = require('../models/Sport');
const Partner = require('../models/Partner');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const seedData = async (force = false, createFullDemo = true) => {
  try {
    const existingOwner = await Partner.findOne({ level: 0 });
    const existingOwnerUser = await User.findOne({ username: 'admin' });
    if (existingOwner && existingOwnerUser && !force) {
      console.log('Database already initialized. Skipping seed.');
      return;
    }

    // Clear existing data
    await Sport.deleteMany({});
    await Partner.deleteMany({});
    await Transaction.deleteMany({});
    await User.deleteMany({});

    console.log('Seeding initial sports and 6-tier hierarchy platform data...');

    // 1. Create Sports Catalog
    const sportsData = [
      { code: 'cricket', name: 'Cricket', icon: 'trophy', active: true },
      { code: 'tennis', name: 'Tennis', icon: 'target', active: true },
      { code: 'football', name: 'Football', icon: 'activity', active: true }
    ];
    await Sport.insertMany(sportsData);

    const defaultPassword = await User.hashPassword('password123');
    const adminPassword = await User.hashPassword('admin123');

    // 2. Level 0: Platform Root Owner
    // Cricket: Rec 100%, Given 80%, Rem 20%
    // Tennis: Rec 100%, Given 60%, Rem 40%
    // Football: Rec 100%, Given 70%, Rem 30%
    const ownerMap = new Map([
      ['cricket', { received: 100, given: 80, remaining: 20 }],
      ['tennis', { received: 100, given: 60, remaining: 40 }],
      ['football', { received: 100, given: 70, remaining: 30 }]
    ]);

    const owner = await Partner.create({
      partnerId: 'OWNER-001',
      name: 'Platform Owner (Root)',
      email: 'owner@sportsplatform.com',
      phone: '+91 9800000001',
      level: 0,
      roleTitle: 'Platform Owner',
      parentId: null,
      uplines: [],
      status: 'Active',
      sportsPartnership: ownerMap
    });

    await User.create({
      username: 'admin',
      password: adminPassword,
      partnerId: owner.partnerId,
      partnerRef: owner._id,
      level: 0,
      roleTitle: 'Platform Owner',
      status: 'Active'
    });

    if (!createFullDemo) {
      console.log('Only Platform Owner seeded.');
      return;
    }

    // 3. Level 1: Rahul Sharma (Senior Partner)
    // Cricket: Rec 80%, Given 50%, Rem 30%
    // Tennis: Rec 60%, Given 20%, Rem 40%
    // Football: Rec 70%, Given 40%, Rem 30%
    const l1Map = new Map([
      ['cricket', { received: 80, given: 50, remaining: 30 }],
      ['tennis', { received: 60, given: 20, remaining: 40 }],
      ['football', { received: 70, given: 40, remaining: 30 }]
    ]);

    const l1 = await Partner.create({
      partnerId: 'P-10001',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@sports.com',
      phone: '+91 9811111111',
      level: 1,
      roleTitle: 'Senior Partner',
      parentId: owner._id,
      uplines: [owner._id],
      status: 'Active',
      sportsPartnership: l1Map
    });

    await User.create({
      username: 'rahul_l1',
      password: defaultPassword,
      partnerId: l1.partnerId,
      partnerRef: l1._id,
      level: 1,
      roleTitle: 'Senior Partner',
      status: 'Active'
    });

    // 4. Level 2: Amit Kumar (Sub-Partner)
    // Cricket: Rec 50%, Given 20%, Rem 30%
    // Tennis: Rec 20%, Given 10%, Rem 10%
    // Football: Rec 40%, Given 20%, Rem 20%
    const l2Map = new Map([
      ['cricket', { received: 50, given: 20, remaining: 30 }],
      ['tennis', { received: 20, given: 10, remaining: 10 }],
      ['football', { received: 40, given: 20, remaining: 20 }]
    ]);

    const l2 = await Partner.create({
      partnerId: 'P-10002',
      name: 'Amit Kumar',
      email: 'amit.kumar@sports.com',
      phone: '+91 9822222222',
      level: 2,
      roleTitle: 'Sub-Partner',
      parentId: l1._id,
      uplines: [owner._id, l1._id],
      status: 'Active',
      sportsPartnership: l2Map
    });

    await User.create({
      username: 'amit_l2',
      password: defaultPassword,
      partnerId: l2.partnerId,
      partnerRef: l2._id,
      level: 2,
      roleTitle: 'Sub-Partner',
      status: 'Active'
    });

    // 5. Level 3: Raj Singh (Master Agent)
    // Cricket: Rec 20%, Given 10%, Rem 10%
    // Tennis: Rec 10%, Given 5%, Rem 5%
    // Football: Rec 20%, Given 10%, Rem 10%
    const l3Map = new Map([
      ['cricket', { received: 20, given: 10, remaining: 10 }],
      ['tennis', { received: 10, given: 5, remaining: 5 }],
      ['football', { received: 20, given: 10, remaining: 10 }]
    ]);

    const l3 = await Partner.create({
      partnerId: 'P-10078',
      name: 'Raj Singh',
      email: 'raj.singh@sports.com',
      phone: '+91 9833333333',
      level: 3,
      roleTitle: 'Master Agent',
      parentId: l2._id,
      uplines: [owner._id, l1._id, l2._id],
      status: 'Active',
      sportsPartnership: l3Map
    });

    await User.create({
      username: 'raj_l3',
      password: defaultPassword,
      partnerId: l3.partnerId,
      partnerRef: l3._id,
      level: 3,
      roleTitle: 'Master Agent',
      status: 'Active'
    });

    // 6. Level 4: Vikram Malhotra (Agent)
    // Cricket: Rec 10%, Given 5%, Rem 5%
    // Tennis: Rec 5%, Given 2%, Rem 3%
    // Football: Rec 10%, Given 5%, Rem 5%
    const l4Map = new Map([
      ['cricket', { received: 10, given: 5, remaining: 5 }],
      ['tennis', { received: 5, given: 2, remaining: 3 }],
      ['football', { received: 10, given: 5, remaining: 5 }]
    ]);

    const l4 = await Partner.create({
      partnerId: 'P-10004',
      name: 'Vikram Malhotra',
      email: 'vikram.m@sports.com',
      phone: '+91 9844444444',
      level: 4,
      roleTitle: 'Agent',
      parentId: l3._id,
      uplines: [owner._id, l1._id, l2._id, l3._id],
      status: 'Active',
      sportsPartnership: l4Map
    });

    await User.create({
      username: 'vikram_l4',
      password: defaultPassword,
      partnerId: l4.partnerId,
      partnerRef: l4._id,
      level: 4,
      roleTitle: 'Agent',
      status: 'Active'
    });

    // 7. Level 5: Karan Verma (Sub-Agent / Leaf)
    // Cricket: Rec 5%, Given 0%, Rem 5%
    // Tennis: Rec 2%, Given 0%, Rem 2%
    // Football: Rec 5%, Given 0%, Rem 5%
    const l5Map = new Map([
      ['cricket', { received: 5, given: 0, remaining: 5 }],
      ['tennis', { received: 2, given: 0, remaining: 2 }],
      ['football', { received: 5, given: 0, remaining: 5 }]
    ]);

    const l5 = await Partner.create({
      partnerId: 'P-10005',
      name: 'Karan Verma',
      email: 'karan.v@sports.com',
      phone: '+91 9855555555',
      level: 5,
      roleTitle: 'Sub-Agent',
      parentId: l4._id,
      uplines: [owner._id, l1._id, l2._id, l3._id, l4._id],
      status: 'Active',
      sportsPartnership: l5Map
    });

    await User.create({
      username: 'karan_l5',
      password: defaultPassword,
      partnerId: l5.partnerId,
      partnerRef: l5._id,
      level: 5,
      roleTitle: 'Sub-Agent',
      status: 'Active'
    });

    // 8. Create Initial Seed Transactions
    // TX 1: Raj Singh (L3) Cricket ₹10,000 (L3: 20% = ₹2,000, L2: 30% = ₹3,000, L1: 30% = ₹3,000, Owner: 20% = ₹2,000)
    await Transaction.create({
      transactionId: 'TX-10001',
      partnerId: l3._id,
      partnerName: l3.name,
      partnerLevel: l3.level,
      sport: 'cricket',
      sportName: 'Cricket',
      amount: 10000,
      note: 'IPL Match 1 Commission Settlement',
      breakdown: [
        {
          level: 3,
          partnerId: l3._id,
          partnerCode: l3.partnerId,
          partnerName: l3.name,
          percentage: 20,
          amount: 2000,
          formula: '₹10,000 × 20% = ₹2,000'
        },
        {
          level: 2,
          partnerId: l2._id,
          partnerCode: l2.partnerId,
          partnerName: l2.name,
          percentage: 30,
          amount: 3000,
          formula: '₹10,000 × 30% = ₹3,000'
        },
        {
          level: 1,
          partnerId: l1._id,
          partnerCode: l1.partnerId,
          partnerName: l1.name,
          percentage: 30,
          amount: 3000,
          formula: '₹10,000 × 30% = ₹3,000'
        },
        {
          level: 0,
          partnerId: owner._id,
          partnerCode: owner.partnerId,
          partnerName: owner.name,
          percentage: 20,
          amount: 2000,
          formula: '₹10,000 × 20% = ₹2,000'
        }
      ]
    });

    // TX 2: Karan Verma (L5) Cricket ₹50,000
    // Karan (L5): 5% = ₹2,500
    // Vikram (L4): 5% = ₹2,500
    // Raj (L3): 10% = ₹5,000
    // Amit (L2): 30% = ₹15,000
    // Rahul (L1): 30% = ₹15,000
    // Owner (L0): 20% = ₹10,000
    await Transaction.create({
      transactionId: 'TX-10002',
      partnerId: l5._id,
      partnerName: l5.name,
      partnerLevel: l5.level,
      sport: 'cricket',
      sportName: 'Cricket',
      amount: 50000,
      note: 'T20 Championship Commission',
      breakdown: [
        {
          level: 5,
          partnerId: l5._id,
          partnerCode: l5.partnerId,
          partnerName: l5.name,
          percentage: 5,
          amount: 2500,
          formula: '₹50,000 × 5% = ₹2,500'
        },
        {
          level: 4,
          partnerId: l4._id,
          partnerCode: l4.partnerId,
          partnerName: l4.name,
          percentage: 5,
          amount: 2500,
          formula: '₹50,000 × 5% = ₹2,500'
        },
        {
          level: 3,
          partnerId: l3._id,
          partnerCode: l3.partnerId,
          partnerName: l3.name,
          percentage: 10,
          amount: 5000,
          formula: '₹50,000 × 10% = ₹5,000'
        },
        {
          level: 2,
          partnerId: l2._id,
          partnerCode: l2.partnerId,
          partnerName: l2.name,
          percentage: 30,
          amount: 15000,
          formula: '₹50,000 × 30% = ₹15,000'
        },
        {
          level: 1,
          partnerId: l1._id,
          partnerCode: l1.partnerId,
          partnerName: l1.name,
          percentage: 30,
          amount: 15000,
          formula: '₹50,000 × 30% = ₹15,000'
        },
        {
          level: 0,
          partnerId: owner._id,
          partnerCode: owner.partnerId,
          partnerName: owner.name,
          percentage: 20,
          amount: 10000,
          formula: '₹50,000 × 20% = ₹10,000'
        }
      ]
    });

    // TX 3: Amit Kumar (L2) Tennis ₹25,000
    // Amit (L2): 20% = ₹5,000
    // Rahul (L1): 40% = ₹10,000
    // Owner (L0): 40% = ₹10,000
    await Transaction.create({
      transactionId: 'TX-10003',
      partnerId: l2._id,
      partnerName: l2.name,
      partnerLevel: l2.level,
      sport: 'tennis',
      sportName: 'Tennis',
      amount: 25000,
      note: 'Wimbledon Finals Trade Turnover',
      breakdown: [
        {
          level: 2,
          partnerId: l2._id,
          partnerCode: l2.partnerId,
          partnerName: l2.name,
          percentage: 20,
          amount: 5000,
          formula: '₹25,000 × 20% = ₹5,000'
        },
        {
          level: 1,
          partnerId: l1._id,
          partnerCode: l1.partnerId,
          partnerName: l1.name,
          percentage: 40,
          amount: 10000,
          formula: '₹25,000 × 40% = ₹10,000'
        },
        {
          level: 0,
          partnerId: owner._id,
          partnerCode: owner.partnerId,
          partnerName: owner.name,
          percentage: 40,
          amount: 10000,
          formula: '₹25,000 × 40% = ₹10,000'
        }
      ]
    });

    console.log('Seeded complete 6-tier hierarchy (Owner to L5) and sample transactions successfully!');
  } catch (error) {
    console.error('Error seeding platform data:', error);
  }
};

module.exports = seedData;
