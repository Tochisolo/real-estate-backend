const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    firstName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  lastName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    minlength: 6
  },

  role: {
    type: String,
    enum: ["admin", "landlord", "agent", "tenant"],
    default: "tenant"
  },

  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },

  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpires: Date,
},
{
  timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);