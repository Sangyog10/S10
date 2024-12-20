import {
  registerUserByPhone,
  verifyOtp,
  addUserDetails,
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../middlewares/authentication.js";
import { Router } from "express";

const router = Router();

router.post("/register", registerUserByPhone);
router.post("/verify-otp", verifyOtp);
router.post("/add-details", authenticateUser, addUserDetails);

export default router;
