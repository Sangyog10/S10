import jwt from "jsonwebtoken";

const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.jwtSecret, { expiresIn: "1d" });
  return token;
};

const isTokenValid = ({ token }) => jwt.verify(token, process.env.jwtSecret);

const attachCookiesToResponse = ({ res, user }) => {
  const token = createJWT({ payload: user });
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 900000),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });
};

const createTokenUser = (phone) => {
  return { phone };
};

export { isTokenValid, attachCookiesToResponse, createTokenUser };
