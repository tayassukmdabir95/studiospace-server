import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";

const googleClient = new OAuth2Client();

export async function googleLogin(req, res) {
  const { credential } = req.body;

  if (!credential || typeof credential !== "string") {
    return res.status(400).json({
      message: "Google credential is required",
    });
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "Authentication configuration is missing",
    });
  }

  let payload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired Google credential",
    });
  }

  if (!payload?.email || !payload.email_verified || !payload.sub) {
    return res.status(401).json({
      message: "Google account verification failed",
    });
  }

  const email = payload.email.toLowerCase();
  const name = payload.name || email.split("@")[0];
  const photoURL = payload.picture || "";

  try {
    const usersCollection = getDB().collection("users");

    let user = await usersCollection.findOne({
      googleId: payload.sub,
    });

    if (!user) {
      user = await usersCollection.findOne({ email });

      if (user) {
        if (user.googleId && user.googleId !== payload.sub) {
          return res.status(409).json({
            message: "This email is linked to another Google account",
          });
        }

        const googleControlsEmail =
          email.endsWith("@gmail.com") || Boolean(payload.hd);

        if (!googleControlsEmail) {
          return res.status(409).json({
            message:
              "Please sign in with your password before linking this Google account",
          });
        }

        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              googleId: payload.sub,
            },
          }
        );

        user.googleId = payload.sub;
      } else {
        const newUser = {
          name,
          email,
          photoURL,
          googleId: payload.sub,
          provider: "google",
          createdAt: new Date(),
        };

        const result = await usersCollection.insertOne(newUser);

        user = {
          ...newUser,
          _id: result.insertedId,
        };
      }
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Google login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL || "",
      },
    });
  } catch (error) {
    console.error("Google login failed:", error);

    return res.status(500).json({
      message: "Google login failed",
    });
  }
}