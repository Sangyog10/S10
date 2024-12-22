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

  await prismaClient.oTP.create({
    data: {
      phoneNumber,
      otp: generatedOtp,
      createdAt: new Date(),
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

  const storedOtp = await prismaClient.oTP.findFirst({
    where: { phoneNumber, otp },
  });

  if (!storedOtp) {
    return next(new ErrorHandler("Invalid OTP", 400));
  }

  const isExpired =
    new Date() - new Date(storedOtp.createdAt) > OTP_VALIDITY_PERIOD;
  if (isExpired) {
    await prismaClient.oTP.delete({ where: { id: storedOtp.id } }); //delete otp after it expires
    return next(new ErrorHandler("OTP has expired", 400));
  }

  //deleting the otp after success
  await prismaClient.oTP.delete({ where: { id: storedOtp.id } });

  let user = await prismaClient.user.findUnique({ where: { phoneNumber } });

  if (!user) {
    user = await prismaClient.user.create({
      data: {
        phoneNumber,
        name: null,
        email: null,
      },
    });
  }

  const tokenUser = { phone: user.phoneNumber };
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

  await prismaClient.user.update({
    where: { id: existingUser.id },
    data: {
      name,
      email,
      updatedAt: new Date(),
    },
  });

  res.status(200).json({
    success: true,
    message: "User details added successfully.",
  });
});

export { registerUserByPhone, verifyOtp, addUserDetails };
