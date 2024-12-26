import { isTokenValid } from "../utils/jwt.js";

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new ErrorHandler("You cannot access it, Authentication invalid", 401)
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = isTokenValid({ token });
    const { phone } = payload;
    req.user = { phone };
    next();
  } catch (error) {
    return next(
      new ErrorHandler("You cannot access it, Authentication invalid", 401)
    );
  }
};

export { authenticateUser };
