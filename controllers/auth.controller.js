import { prismaClient } from "../db/index.js";
import catchAsyncError from "../middlewares/catch-async-errors.js";
import { attachCookiesToResponse } from "../utils/jwt.js";
import ErrorHandler from "../utils/error-handler.js";
import { generateOTP } from "../utils/generate-otp.js";

const OTP_VALIDITY_PERIOD = 1 * 60 * 1000; // 1 minutes

const registerUserByPhone = catchAsyncError(async (req, res, next) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return next(new ErrorHandler("Please enter your phone number", 400));
  }
  const generatedOtp = generateOTP();
  const expiryTime = new Date(Date.now() + OTP_VALIDITY_PERIOD);

  const newOtp = await prismaClient.otp.create({
    data: {
      communicated_to: phoneNumber,
      otp: generatedOtp,
      status: "SENT",
      expiry_time: expiryTime,
      created_by: phoneNumber, //not necessary
      modified_by: phoneNumber, //not necessary
    },
  });

  console.log(`OTP for ${phoneNumber}: ${generatedOtp}`);

  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
  });
});

const verifyOtp = catchAsyncError(async (req, res, next) => {
  const { phoneNumber, otp } = req.body;

  if (!otp || !phoneNumber) {
    return next(
      new ErrorHandler("Please enter your OTP and phone number", 400)
    );
  }

  const storedOtp = await prismaClient.otp.findFirst({
    where: { communicated_to: phoneNumber, otp: otp, status: "SENT" },
  });

  if (!storedOtp) {
    return next(new ErrorHandler("Invalid OTP", 400));
  }

  const isExpired = new Date() > new Date(storedOtp.expiry_time);
  if (isExpired) {
    await prismaClient.otp.update({
      where: { id: storedOtp.id },
      data: { status: "EXPIRED" },
    });
    return next(new ErrorHandler("OTP has expired", 400));
  }

  await prismaClient.otp.update({
    where: { id: storedOtp.id },
    data: { status: "VERIFIED" },
  });

  let user = await prismaClient.user.findUnique({
    where: { primary_phone_no: phoneNumber },
  });

  if (!user) {
    user = await prismaClient.user.create({
      data: {
        primary_phone_no: phoneNumber,
        created_at: new Date(),
        created_by: phoneNumber, //not necessary
      },
    });
  }

  const tokenUser = { phone: user.primary_phone_no };
  attachCookiesToResponse({ res, user: tokenUser });

  const isNewUser = !user.name && !user.email;

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    isNewUser,
  });
});

const addUserDetails = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;
  const phoneNumber = req.user.phone;

  if (!phoneNumber || !name || !email) {
    return next(
      new ErrorHandler("Phone number, name, and email are required.", 400)
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorHandler("Invalid email format.", 400));
  }

  const existingUser = await prismaClient.user.findUnique({
    where: { primary_phone_no: phoneNumber },
  });

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: "User not found. Please verify OTP first.",
    });
  }

  if (existingUser.name && existingUser.email) {
    return res.status(400).json({
      success: false,
      message: "User is already registered.",
    });
  }

  await prismaClient.user.update({
    where: { id: existingUser.id },
    data: {
      name: existingUser.name || name,
      email: existingUser.email || email,
      primary_phone_no: phoneNumber,
      modified_at: new Date(),
      modified_by: phoneNumber, //not necessary
    },
  });

  res
    .status(201)
    .json({ success: true, message: "User registered successfully." });
});

export { registerUserByPhone, verifyOtp, addUserDetails };
