
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { connectDB } from "./config/db.js";

import studioRoutes from "./routes/studioRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

import {
  getAllowedOrigins,
  requireAllowedOrigin,
} from "./middleware/requireAllowedOrigin.js";

const app = express();

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "100kb" }));

app.use(cookieParser());

app.use("/api", requireAllowedOrigin);

app.use("/api/auth", authRoutes);

app.use("/api/studios", studioRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
  res.status(200).send("StudioSpace Server is Running!");
});

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    message: "Internal server error",
  });
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`StudioSpace server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
