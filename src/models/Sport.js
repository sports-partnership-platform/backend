const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  icon: { type: String, default: 'trophy' }, // icon name
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Sport', sportSchema);
