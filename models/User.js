const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    fullName: {
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
    enum: ["admin", "landlord", "tenant"],
    default: "tenant"
  },

  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },

  dob: {
    type: Date,
    required: true
  },

  address:{
    type: String,
    required: false
  }
},
{
  timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);