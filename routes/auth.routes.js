import {
  registerUserByPhone,
  verifyOtp,
  addUserDetails,
} from "../controllers/auth.controller.js";
import { Router } from "express";
const router = Router();

router.post("/register", registerUserByPhone);
router.post("/verify-otp", verifyOtp);
router.post("/add-details", addUserDetails);

export default router;
