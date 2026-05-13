import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  try {
    // Try to get token from Authorization header first (Bearer token)
    let token = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookies
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);
    // distinguish expired tokens so client can react
    const msg = error.name === "TokenExpiredError"
      ? "Token expired"
      : "Invalid or expired token";
    return res.status(401).json({ message: msg });
  }
}
