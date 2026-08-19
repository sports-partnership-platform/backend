const Sport = require('../models/Sport');
const Partner = require('../models/Partner');
const Transaction = require('../models/Transaction');

const seedData = async () => {
  try {
    const existingSports = await Sport.countDocuments();
    if (existingSports > 0) {
      console.log('Database already seeded or contains data. Skipping initial seed.');
      return;
    }

    console.log('Seeding initial Sports Partnership data...');

    // 1. Create Sports
    const sportsData = [
      { code: 'cricket', name: 'Cricket', icon: 'trophy' },
      { code: 'tennis', name: 'Tennis', icon: 'target' },
      { code: 'football', name: 'Football', icon: 'activity' }
    ];
    const createdSports = await Sport.insertMany(sportsData);
    console.log('Sports seeded:', createdSports.length);

    // 2. Create Level 1 Partner: Rahul Sharma
    const rahulMap = new Map([
      ['cricket', { received: 100, given: 80, remaining: 20 }],
      ['tennis', { received: 100, given: 60, remaining: 40 }],
      ['football', { received: 100, given: 70, remaining: 30 }]
    ]);

    const rahul = await Partner.create({
      partnerId: 'P-10021',
      name: 'Rahul Sharma',
      email: 'rahul@sportsplatform.com',
      phone: '+91 9876543210',
      level: 1,
      parentId: null,
      uplines: [],
      status: 'Active',
      sportsPartnership: rahulMap
    });

    // 3. Create Level 2 Partners under Rahul: Amit Kumar & Rohit Das
    const amitMap = new Map([
      ['cricket', { received: 80, given: 50, remaining: 30 }],
      ['tennis', { received: 60, given: 55, remaining: 5 }],
      ['football', { received: 70, given: 60, remaining: 10 }]
    ]);

    const amit = await Partner.create({
      partnerId: 'P-10045',
      name: 'Amit Kumar',
      email: 'amit@sportsplatform.com',
      phone: '+91 9876543211',
      level: 2,
      parentId: rahul._id,
      uplines: [rahul._id],
      status: 'Active',
      sportsPartnership: amitMap
    });

    const rohitMap = new Map([
      ['cricket', { received: 80, given: 40, remaining: 40 }],
      ['tennis', { received: 60, given: 30, remaining: 30 }],
      ['football', { received: 70, given: 50, remaining: 20 }]
    ]);

    const rohit = await Partner.create({
      partnerId: 'P-10050',
      name: 'Rohit Das',
      email: 'rohit@sportsplatform.com',
      phone: '+91 9876543212',
      level: 2,
      parentId: rahul._id,
      uplines: [rahul._id],
      status: 'Active',
      sportsPartnership: rohitMap
    });

    // 4. Create Level 3 Partners under Amit: Raj Singh & Neha Singh
    const rajMap = new Map([
      ['cricket', { received: 50, given: 0, remaining: 50 }],
      ['tennis', { received: 55, given: 0, remaining: 55 }],
      ['football', { received: 60, given: 0, remaining: 60 }]
    ]);

    const raj = await Partner.create({
      partnerId: 'P-10078',
      name: 'Raj Singh',
      email: 'raj@sportsplatform.com',
      phone: '+91 9876543213',
      level: 3,
      parentId: amit._id,
      uplines: [rahul._id, amit._id],
      status: 'Active',
      sportsPartnership: rajMap
    });

    const nehaMap = new Map([
      ['cricket', { received: 50, given: 0, remaining: 50 }],
      ['tennis', { received: 55, given: 0, remaining: 55 }],
      ['football', { received: 60, given: 0, remaining: 60 }]
    ]);

    const neha = await Partner.create({
      partnerId: 'P-10123',
      name: 'Neha Singh',
      email: 'neha@sportsplatform.com',
      phone: '+91 9876543214',
      level: 3,
      parentId: amit._id,
      uplines: [rahul._id, amit._id],
      status: 'Active',
      sportsPartnership: nehaMap
    });

    // 5. Create Level 4 Partner under Raj: Ankit Singh
    const ankitMap = new Map([
      ['cricket', { received: 0, given: 0, remaining: 0 }],
      ['tennis', { received: 0, given: 0, remaining: 0 }],
      ['football', { received: 0, given: 0, remaining: 0 }]
    ]);

    const ankit = await Partner.create({
      partnerId: 'P-10150',
      name: 'Ankit Singh',
      email: 'ankit@sportsplatform.com',
      phone: '+91 9876543215',
      level: 4,
      parentId: raj._id,
      uplines: [rahul._id, amit._id, raj._id],
      status: 'Active',
      sportsPartnership: ankitMap
    });

    // 6. Create Level 5 Partner under Ankit: Vishal Verma
    const vishalMap = new Map([
      ['cricket', { received: 0, given: 0, remaining: 0 }],
      ['tennis', { received: 0, given: 0, remaining: 0 }],
      ['football', { received: 0, given: 0, remaining: 0 }]
    ]);

    await Partner.create({
      partnerId: 'P-10190',
      name: 'Vishal Verma',
      email: 'vishal@sportsplatform.com',
      phone: '+91 9876543216',
      level: 5,
      parentId: ankit._id,
      uplines: [rahul._id, amit._id, raj._id, ankit._id],
      status: 'Active',
      sportsPartnership: vishalMap
    });

    console.log('Partners hierarchy seeded successfully (L1 -> L5)');

    // 7. Seed Sample Transactions matching prompt
    const transactions = [
      {
        transactionId: 'TX-10091',
        partnerId: raj._id,
        partnerName: 'Raj Singh',
        partnerLevel: 3,
        sport: 'cricket',
        sportName: 'Cricket',
        amount: 10000,
        note: 'IPL Match Revenue Share',
        breakdown: [
          { level: 3, partnerId: raj._id, partnerCode: 'P-10078', partnerName: 'Raj Singh', percentage: 50, amount: 5000, formula: '₹10,000 × 50% = ₹5,000' },
          { level: 2, partnerId: amit._id, partnerCode: 'P-10045', partnerName: 'Amit Kumar', percentage: 30, amount: 3000, formula: '₹10,000 × 30% = ₹3,000' },
          { level: 1, partnerId: rahul._id, partnerCode: 'P-10021', partnerName: 'Rahul Sharma', percentage: 20, amount: 2000, formula: '₹10,000 × 20% = ₹2,000' }
        ]
      },
      {
        transactionId: 'TX-10092',
        partnerId: raj._id,
        partnerName: 'Raj Singh',
        partnerLevel: 3,
        sport: 'tennis',
        sportName: 'Tennis',
        amount: 10000,
        note: 'Wimbledon Final Booking',
        breakdown: [
          { level: 3, partnerId: raj._id, partnerCode: 'P-10078', partnerName: 'Raj Singh', percentage: 55, amount: 5500, formula: '₹10,000 × 55% = ₹5,500' },
          { level: 2, partnerId: amit._id, partnerCode: 'P-10045', partnerName: 'Amit Kumar', percentage: 5, amount: 500, formula: '₹10,000 × 5% = ₹500' },
          { level: 1, partnerId: rahul._id, partnerCode: 'P-10021', partnerName: 'Rahul Sharma', percentage: 40, amount: 4000, formula: '₹10,000 × 40% = ₹4,000' }
        ]
      },
      {
        transactionId: 'TX-10093',
        partnerId: raj._id,
        partnerName: 'Raj Singh',
        partnerLevel: 3,
        sport: 'football',
        sportName: 'Football',
        amount: 20000,
        note: 'Champions League Partnership',
        breakdown: [
          { level: 3, partnerId: raj._id, partnerCode: 'P-10078', partnerName: 'Raj Singh', percentage: 60, amount: 12000, formula: '₹20,000 × 60% = ₹12,000' },
          { level: 2, partnerId: amit._id, partnerCode: 'P-10045', partnerName: 'Amit Kumar', percentage: 10, amount: 2000, formula: '₹20,000 × 10% = ₹2,000' },
          { level: 1, partnerId: rahul._id, partnerCode: 'P-10021', partnerName: 'Rahul Sharma', percentage: 30, amount: 6000, formula: '₹20,000 × 30% = ₹6,000' }
        ]
      },
      {
        transactionId: 'TX-10094',
        partnerId: neha._id,
        partnerName: 'Neha Singh',
        partnerLevel: 3,
        sport: 'cricket',
        sportName: 'Cricket',
        amount: 15000,
        note: 'T20 World Cup Special',
        breakdown: [
          { level: 3, partnerId: neha._id, partnerCode: 'P-10123', partnerName: 'Neha Singh', percentage: 50, amount: 7500, formula: '₹15,000 × 50% = ₹7,500' },
          { level: 2, partnerId: amit._id, partnerCode: 'P-10045', partnerName: 'Amit Kumar', percentage: 30, amount: 4500, formula: '₹15,000 × 30% = ₹4,500' },
          { level: 1, partnerId: rahul._id, partnerCode: 'P-10021', partnerName: 'Rahul Sharma', percentage: 20, amount: 3000, formula: '₹15,000 × 20% = ₹3,000' }
        ]
      }
    ];

    await Transaction.insertMany(transactions);
    console.log('Sample transactions seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedData;
