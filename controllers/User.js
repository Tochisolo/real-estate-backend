const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const otpGenerator = require('otp-generator');
const { sendOtpEmail } = require("../utils/mailSender");


exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, phoneNumber, role } = req.body;

    // Validate fields
    if (!firstName || !lastName || !username || !email || !password || !phoneNumber || !role) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      $or: [
        { email },
        { username },
        { phoneNumber }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email, username or phone number already exists"
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      role
    });

    // Generate OTP and save on user (expires in 10 minutes)
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false, digits: true });
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.isVerified = false;
    await user.save();

    // Send OTP via email (best-effort)
    try {
      await sendOtpEmail(user.email, otp, { expiresIn: '10 minutes' });
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr);
    }

    // Remove password before sending response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp; // don't expose OTP
    delete userResponse.otpExpires;

    res.status(201).json({
      success: true,
      message: "User registered successfully. An OTP has been sent to your email to verify the account.",
      data: userResponse
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};


// login 
exports.loginUser = async (req, res) => {
  try {

    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES || "7d"
      }
    );

    // Remove password
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userData
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};

// GET ALL USERS WITH OPTIONAL ROLE FILTER
exports.getUsers = async (req, res) => {
  try {

    const filter = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter).select("-password");

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};


// GET SINGLE USER
exports.getUser = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};


// UPDATE USER
exports.updateUser = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const updateData = { ...req.body };

    // If password is being updated, hash it
    if (updateData.password) {

      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);

    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};


// DELETE USER
exports.deleteUser = async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};


// VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isVerified) {
      return res.status(200).json({ success: true, message: 'User already verified' });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({ success: false, message: 'No OTP found for this user' });
    }

    if (Date.now() > user.otpExpires.getTime()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// RESEND OTP
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isVerified) return res.status(400).json({ success: false, message: 'User already verified' });

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false, digits: true });
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    try {
      await sendOtpEmail(user.email, otp, { expiresIn: '10 minutes' });
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr);
    }

    res.status(200).json({ success: true, message: 'OTP resent to email' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
