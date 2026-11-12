
import { getDB } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function createToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function sendToken(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export async function registerUser(req, res) {
  try {
    const db = getDB();
    const { name, email, photoURL, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send({
        message: "Please provide all required fields"
      });
    }

    if (
      password.length < 6 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password)
    ) {
      return res.status(400).send({
        message: "Password must contain uppercase, lowercase, and at least 6 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await db.collection("users").findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).send({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email: normalizedEmail,
      photoURL: photoURL || "",
      password: hashedPassword,
      createdAt: new Date()
    };

    const result = await db.collection("users").insertOne(newUser);

    res.status(201).send({
      message: "Registration successful",
      userId: result.insertedId
    });
  } catch (error) {
    res.status(500).send({
      message: "Registration failed"
    });
  }
}

export async function loginUser(req, res) {
  try {
    const db = getDB();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.collection("users").findOne({
      email: normalizedEmail
    });

    if (!user || !user.password) {
      return res.status(401).send({
        message: "Invalid email or password"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).send({
        message: "Invalid email or password"
      });
    }

    const token = createToken(user);

    sendToken(res, token);

    res.send({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    res.status(500).send({
      message: "Login failed"
    });
  }
}

export async function logoutUser(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  });

  res.send({
    message: "Logout successful"
  });
}

export async function getCurrentUser(req, res) {
  try {
    const db = getDB();

    const user = await db.collection("users").findOne(
      { email: req.user.email },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).send({
        message: "User not found"
      });
    }

    res.send(user);
  } catch (error) {
    res.status(500).send({
      message: "Failed to fetch user"
    });
  }
}
