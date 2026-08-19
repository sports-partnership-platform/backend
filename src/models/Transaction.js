const mongoose = require('mongoose');

const breakdownItemSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  partnerCode: { type: String },
  partnerName: { type: String, required: true },
  percentage: { type: Number, required: true },
  amount: { type: Number, required: true },
  formula: { type: String }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  partnerName: { type: String, required: true },
  partnerLevel: { type: Number, required: true },
  sport: { type: String, required: true },
  sportName: { type: String, required: true },
  amount: { type: Number, required: true },
  note: { type: String },
  breakdown: [breakdownItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
