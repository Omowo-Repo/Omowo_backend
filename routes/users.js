const config = require("config");
const { User, validateUser } = require("../models/users");
const { UserOTPVerification } = require("../models/userOTPVerififications");

const nodemailer = require("nodemailer");

var _ = require("lodash");
let bcrypt = require("bcrypt");

let express = require("express");
let router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "godstimeinstein@gmail.com",
    pass: "elvxbkvrdpdzdtcn",
  },
});

router.post("/signUp", async (req, res) => {
  const { error } = validateUser(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { firstName, LastName, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({ error: "Username or email already exists" });
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    const newUser = new User({
      firstName,
      LastName,
      email,
      password: hashedPassword,
      verified: false,
    });

    const { email } = await newUser.save();

    sendOTPVerificationEmail({email}, res);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to create user", message: error.message });
  }
});

router.post("/verifyOTP", async (req, res) => {

  try {
    let { email, otp } = req.body;
    if (!email || !otp) {
      throw Error("Empty OTP details are not allowed!");
    } else {
      const UserOTPVerificationRecords = await UserOTPVerification.find({
        email,
      });
      if (UserOTPVerificationRecords.length <= 0) {
        throw new Error(
          "Account record doesn't exist. Please sign up or login"
        );
      } else {
        const { expiresAt } = UserOTPVerificationRecords[0];
       

        if (expiresAt < Date.now()) {
          await UserOTPVerification.delete({ email });
          throw new Error("Code has expired. Please request again.");
        } else {
          const hashedOTP = UserOTPVerificationRecords[0].otp;
          const OTPValidity = await bcrypt.compare(otp, hashedOTP);

          if (!validOTP) {
            throw new Error("Invalid OTP. Check your mail Inbox.");
          } else {
            await User.updateOne({ email }, { verified: true });
            await UserOTPVerification.delete({ email });

            res.json({
              status: "VERIFIED",
              message: "User email verified successfully",
            });
          }
        }
      }
    }
  } catch (error) {
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
});

router.post("/resendOTP", async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      throw Error("Empty user detail not allowed");
    } else {
      await UserOTPVerification.delete({ email });
      sendOTPVerificationEmail({ email }, res);
    }
  } catch (error) {
    res.json({
      status: "FAILED",
      message: error.message,
    });
  }
});

async function sendOTPVerificationEmail({ email }, res) {
  try {
    const otp = `${Math.floor(1000 + (1000 + Math.random() * 9000))}`;
    const mailOptions = {
      from: "godstimeinstein@gmail.com",
      to: email,
      subject: "Verify Your Email",
      html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete the sign up process</p>`,
    };

    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(otp, saltRounds);

    console.log("Hello");

    const newUserOTPVerification = new UserOTPVerification({
      email,
      otp: hashedPassword,
      createdAt: Date.now(),
      expiredAt: Date.now() + 3600000,
    });
    console.log("Hello!!!!!!!");
    await newUserOTPVerification.save();

    transporter.sendMail(mailOptions);

    return res
      .status(201)
      .json({ status: "PENDING", message: "Verification otp email" });
  } catch (error) {
    return res.json({ status: "FAILED", message: error.message });
  }
}

module.exports = router;
