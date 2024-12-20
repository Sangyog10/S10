import crypto from "crypto";

// Generate a 4 digit OTP
export const generateOTP = () => {
  const otp = (crypto.randomInt(0, 1000000) + 1000000).toString().substring(1);

  if (otp.length === 4) {
    return otp;
  }
  if (otp.length < 4) {
    return (
      Array(4 - otp.length)
        .fill(0)
        .join("") + otp
    );
  }
  return otp.substring(0, 4);
};
