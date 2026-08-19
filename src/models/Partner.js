const mongoose = require('mongoose');

const sportsWiseSchema = new mongoose.Schema({
  received: { type: Number, required: true, default: 100 },
  given: { type: Number, required: true, default: 0 },
  remaining: { type: Number, required: true, default: 100 }
}, { _id: false });

const partnerSchema = new mongoose.Schema({
  partnerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  level: { type: Number, required: true, min: 0, max: 5 }, // 0: Owner, 1: Level 1, 2: Level 2...
  roleTitle: { type: String, default: 'Partner' }, // 'Owner', 'Senior Partner', 'Sub-Partner', 'Master Agent', 'Agent', 'Sub-Agent'
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', default: null },
  uplines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Partner' }],
  status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
  // Map of sport code -> { received, given, remaining }
  sportsPartnership: {
    type: Map,
    of: sportsWiseSchema,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Partner', partnerSchema);
