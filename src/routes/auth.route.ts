import express from "express";
import {
  register,
  login,
//   logout,
//   refreshToken,
//   sendOtp,
//   verifyOtp,
//   forgotPassword,
//   resetPassword,
//   getMe,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
// import { idempotencyMiddleware } from "../middlewares/idempotency.middleware";

const router = express.Router();

// router.use(idempotencyMiddleware);
router.post("/register", register);
router.post("/login", login);
// router.post("/refresh-token", refreshToken);
// router.post("/forgot-password", forgotPassword);
// router.patch("/reset-password", resetPassword);
// router.post("/send-otp", sendOtp);
// router.post("/verify-otp", verifyOtp);

// router.use(protect);
// router.post("/logout", logout);
// router.get("/me", protect, getMe);

export default router;
