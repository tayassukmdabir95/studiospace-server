
export function getAllowedOrigins() {
  const configuredOrigins = (
    process.env.CLIENT_URL || "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins.map((origin) =>
    origin.replace(/\/+$/, "")
  );
}

export function requireAllowedOrigin(req, res, next) {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.get("Origin");

  if (!origin || !getAllowedOrigins().includes(origin)) {
    return res.status(403).json({
      message: "Request origin is not allowed"
    });
  }

  next();
}
