const Sport = require('../models/Sport');
const Partner = require('../models/Partner');
const Transaction = require('../models/Transaction');

const seedData = async (force = false) => {
  try {
    const existingOwner = await Partner.findOne({ level: 0 });
    if (existingOwner && !force) {
      console.log('Database already contains Platform Owner. Skipping seed.');
      return;
    }

    // Clear existing data to reseed clean state with only Platform Owner
    await Sport.deleteMany({});
    await Partner.deleteMany({});
    await Transaction.deleteMany({});

    console.log('Seeding initial platform state (Platform Owner only)...');

    // 1. Create Sports Catalog
    const sportsData = [
      { code: 'cricket', name: 'Cricket', icon: 'trophy', active: true },
      { code: 'tennis', name: 'Tennis', icon: 'target', active: true },
      { code: 'football', name: 'Football', icon: 'activity', active: true }
    ];
    const createdSports = await Sport.insertMany(sportsData);
    console.log('Sports catalog seeded:', createdSports.length);

    // 2. Create ROOT PLATFORM OWNER (Level 0) only
    // Platform Owner starts with 100% Received and 100% Retained (Given: 0) for all sports
    const ownerMap = new Map([
      ['cricket', { received: 100, given: 0, remaining: 100 }],
      ['tennis', { received: 100, given: 0, remaining: 100 }],
      ['football', { received: 100, given: 0, remaining: 100 }]
    ]);

    const owner = await Partner.create({
      partnerId: 'OWNER-001',
      name: 'Platform Owner',
      email: 'owner@sportsplatform.com',
      phone: '+91 9800000001',
      level: 0,
      roleTitle: 'Platform Owner',
      parentId: null,
      uplines: [],
      status: 'Active',
      sportsPartnership: ownerMap
    });

    console.log('Platform Owner seeded successfully (Root Level 0):', owner.partnerId);
  } catch (error) {
    console.error('Error seeding platform owner:', error);
  }
};

module.exports = seedData;
