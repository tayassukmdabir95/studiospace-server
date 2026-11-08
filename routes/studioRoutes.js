
import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";

import {
  getAllStudios,
  getSingleStudio,
  addStudio,
  updateStudio,
  deleteStudio
} from "../controllers/studioController.js";

const router = express.Router();

router.get("/", getAllStudios);
router.get("/:id", getSingleStudio);
router.post("/", verifyToken, addStudio);
router.put("/:id", verifyToken, updateStudio);
router.delete("/:id", verifyToken, deleteStudio);

export default router;
