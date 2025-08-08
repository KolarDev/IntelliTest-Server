import express from "express";
import {
  registerOrg,
  login,
  createStaff,
  createStudent,
//   logout,
//   refreshToken,
//   sendOtp,
//   verifyOtp,
//   forgotPassword,
//   resetPassword,
//   getMe,
} from "../controllers/auth.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { UserRole } from "@prisma/client";
// import { idempotencyMiddleware } from "../middlewares/idempotency.middleware";

const router = express.Router();

// router.use(idempotencyMiddleware);
router.post("/register", registerOrg);
router.post("/login", login);

// router.post("/refresh-token", refreshToken);
// router.post("/forgot-password", forgotPassword);
// router.patch("/reset-password", resetPassword);
// router.post("/send-otp", sendOtp);
// router.post("/verify-otp", verifyOtp);

// router.use(protect);
// router.post("/logout", logout);
// router.get("/me", protect, getMe);

// Protected routes
router.use(authenticate);
router.post('/staff', authorize(UserRole.ORG_ADMIN), createStaff);
router.post('/student', authorize(UserRole.ORG_ADMIN, UserRole.STAFF), createStudent);

export default router;

