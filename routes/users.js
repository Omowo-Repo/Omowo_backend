const { User, validateUser } = require("../models/users");
const UserOTPVerification = require("../models/userOTPVerifification");

const nodemailer = require("nodemailer");

var _ = require("lodash");
let bcrypt = require("bcrypt");

let express = require("express");
let router = express.Router();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: true,
  auth: {
    user: "godstimeinstein@gmail.com",
    password: "okomayin1998",
  },
});

router.post("/signUp", async (req, res) => {
  const { error } = validateUser(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { username, email, password } = req.body;

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    return res.status(409).json({ error: "Username or email already exists" });
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      verified: false,
    });

    await newUser.save();

    sendOTPVerificationEmail();

    return res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create user" });
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
          "Account record doesn't exist or has been verified already. Please sign up or login"
        );
      } else {
        const { expiresAt } = UserOTPVerificationRecords[0];
        const hashedOTP = UserOTPVerificationRecords[0].otp;

        if (expiresAt < Date.now()) {
          await UserOTPVerification.delete({ email });
          throw new Error("Code has expired. Please request again.");
        } else {
          const OTPValidity = await bcrypt.compare(otp, hashedOTP);

          if (!validOTP) {
            throw new Error("Invalid code passed. Check your Inbox.");
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
      html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete</p>`,
    };

    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(otp, saltRounds);

    const newUserOTPVerification = new UserOTPVerification({
      email,
      otp: hashedPassword,
      createdAt: Date.now(),
      expiredAt: Date.now() + 3600000,
    });

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
