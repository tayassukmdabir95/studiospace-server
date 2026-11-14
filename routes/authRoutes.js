
import express from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/authController.js";

import { googleLogin } from "../controllers/googleAuthController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { authLimiter } from "../middleware/authLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, registerUser);

router.post("/login", authLimiter, loginUser);

router.post("/google", authLimiter, googleLogin);

router.post("/logout", logoutUser);

router.get("/me", verifyToken, getCurrentUser);

export default router;
