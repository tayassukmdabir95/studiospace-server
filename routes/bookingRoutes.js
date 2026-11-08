
import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";

import {
  createBooking,
  getMyBookings,
  cancelBooking
} from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", verifyToken, createBooking);
router.get("/", verifyToken, getMyBookings);
router.patch("/:id/cancel", verifyToken, cancelBooking);

export default router;
