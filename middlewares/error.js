import ErrorHandler from "../utils/error-handler.js";

export default (err, req, res, next) => {
  let error = err;

  // Log the error details for debugging (optional)
  console.error(err);

  // If err is a string, convert it to an Error object
  if (typeof err === "string") {
    error = new Error(err);
  }

  error.statusCode = error.statusCode || 500;
  error.message = error.message || "Internal Server Error";

  // Wrong JWT error
  if (error.name === "JsonWebTokenError") {
    const message = `Json Web Token is invalid. Try again`;
    error = new ErrorHandler(message, 400);
  }

  // JWT expired error
  if (error.name === "TokenExpiredError") {
    const message = `Json Web Token is Expired. Try again`;
    error = new ErrorHandler(message, 400);
  }

  // File not found error
  if (error.code === "ENOENT") {
    const message = `File Not Found`;
    error = new ErrorHandler(message, 404);
  }

  // Handle other errors
  if (!error.statusCode || !error.message) {
    error.message = `Unexpected Error: ${error.message}`;
    error.statusCode = 500;
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
  });
};
