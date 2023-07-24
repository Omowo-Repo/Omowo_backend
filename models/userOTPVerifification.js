const mongoose = require("mongoose");

const UserOTPVerification = mongoose.model(
  "userOTPVerification",
  new mongoose.Schema({
    email: String,
    otp: String,
    createdAt: Date,
    expireAt: Date,
  })
);

exports.UserOTPVerification = UserOTPVerification;
