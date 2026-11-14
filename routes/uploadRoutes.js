
import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/verifyToken.js";
import { uploadStudioImage } from "../controllers/uploadController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 1
  },
  fileFilter(req, file, callback) {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG and WebP images are allowed")
      );
    }

    callback(null, true);
  }
});

router.post("/", verifyToken, (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "Image must be smaller than 5 MB"
        });
      }

      return res.status(400).json({
        message: error.message || "Invalid image upload"
      });
    }

    next();
  });
}, uploadStudioImage);

export default router;
