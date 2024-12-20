import { prismaClient } from "../db/index.js";
import catchAsyncError from "../middlewares/catch-async-errors.js";
import { attachCookiesToResponse } from "../utils/jwt.js";
import ErrorHandler from "../utils/error-handler.js";
import { generateOTP } from "../utils/generate-otp.js";

const registerUserByPhone = catchAsyncError(async (req, res, next) => {
  const { phoneNumber } = await req.body;
  if (!phoneNumber) {
    return next(new ErrorHandler("Please enter your phone number", 400));
  }

  const generatedOtp = generateOTP();

  await prismaClient.oTP.create({
    data: {
      phoneNumber,
      otp: generatedOtp,
    },
  });

  console.log(`OTP for ${phoneNumber}: ${generatedOtp}`);

  await prismaClient.user.upsert({
    where: {
      phoneNumber,
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      phoneNumber,
      name: null,
      email: null,
    },
  });

  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
  });
});

//otp Verification
const verifyOtp = catchAsyncError(async (req, res, next) => {
  const { phoneNumber, otp } = await req.body;
  if (!otp || !phoneNumber) {
    return next(
      new ErrorHandler("Please enter your otp and  phone number", 400)
    );
  }

  const storedOtp = await prismaClient.oTP.findFirst({
    where: {
      phoneNumber,
      otp,
    },
  });

  if (!storedOtp) {
    return next(new ErrorHandler("Invalid or expired OTP", 400));
  }
  await prismaClient.oTP.delete({ where: { id: storedOtp.id } });

  //attach jwt
  const user = await prismaClient.user.findUnique({
    where: {
      phoneNumber,
    },
  });
  const tokenUser = { phone: user.phoneNumber };
  attachCookiesToResponse({ res, user: tokenUser });

  if (user.name === null && user.email === null) {
    res.status(200).json({
      success: true,
      message: "OTP verified successfully, Add additional details",
      isNewUser: true,
    });
  }

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    isNewUser: false,
  });
});

const addUserDetails = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;
  const phoneNumber = req.user.phone;

  if (!phoneNumber || !name || !email) {
    return res.status(400).json({
      success: false,
      message: "Phone number, name, and email are required.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format.",
    });
  }

  const existingUser = await prismaClient.user.findUnique({
    where: { phoneNumber },
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
      updatedAt: new Date(),
    },
  });

  res
    .status(201)
    .json({ success: true, message: "User registered successfully." });
});

export { registerUserByPhone, verifyOtp, addUserDetails };
