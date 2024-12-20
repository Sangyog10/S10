import { isTokenValid } from "../utils/jwt.js";

const authenticateUser = async (req, res, next) => {
  const token = req.signedCookies.token;
  if (!token) {
    return next(
      new ErrorHandler("You cannot access it, Authentication invalid", 401)
    );
  }
  try {
    const payload = isTokenValid({ token });
    const { phone } = payload;
    req.user = { phone };

    next();
  } catch (error) {
    new ErrorHandler("You cannot access it, Authentication invalid", 401);
  }
};

export { authenticateUser };
