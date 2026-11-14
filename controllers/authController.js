
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";
import { getCookieOptions } from "../config/cookieOptions.js";

const COOKIE_NAME = "token";
const TOKEN_EXPIRY = "7d";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(email) {
  return typeof email === "string"
    ? email.trim().toLowerCase()
    : "";
}

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: TOKEN_EXPIRY,
      algorithm: "HS256",
    }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    ...getCookieOptions(),
    maxAge: COOKIE_MAX_AGE,
  });
}

function formatUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    photoURL: user.photoURL || "",
  };
}

export async function registerUser(req, res) {
  try {
    const { name, email, password, photoURL } = req.body;

    const normalizedEmail = normalizeEmail(email);
    const normalizedName =
      typeof name === "string" ? name.trim() : "";

    if (
      !normalizedName ||
      !normalizedEmail ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    const validPassword =
      password.length >= 6 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password);

    if (!validPassword) {
      return res.status(400).json({
        message:
          "Password must contain at least 6 characters, one uppercase letter and one lowercase letter",
      });
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
      name: normalizedName,
      email: normalizedEmail,
      photoURL:
        typeof photoURL === "string" ? photoURL.trim() : "",
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    return res.status(201).json({
      message: "Registration successful. Please log in.",
      userId: String(result.insertedId),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    const normalizedEmail = normalizeEmail(email);

    if (
      !normalizedEmail ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (!user || typeof user.password !== "string") {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = createToken(user);

    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Login successful",
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
}

export async function logoutUser(req, res) {
  try {
    res.clearCookie(COOKIE_NAME, getCookieOptions());

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Logout failed. Please try again.",
    });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const email = normalizeEmail(req.user?.email);

    if (!email) {
      return res.status(401).json({
        message: "Unauthorized access",
      });
    }

    const db = getDB();

    const user = await db.collection("users").findOne({
      email,
    });

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    return res.status(200).json({
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Current user error:", error);

    return res.status(500).json({
      message: "Failed to retrieve user information",
    });
  }
}
