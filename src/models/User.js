const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    partnerId: {
      type: String,
      required: true,
      unique: true
    },
    partnerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true
    },
    level: {
      type: Number,
      required: true,
      min: 0,
      max: 5
    },
    roleTitle: {
      type: String,
      default: 'Partner'
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

module.exports = mongoose.model('User', userSchema);
