import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// Middleware to verify JWT from cookies
export function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: "Not logged in" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Auth routes
export const authRouter = (app) => {
  // Login route already defined in server.js, but this is a placeholder
  // The actual auth endpoints are in server.js
};

export default { authenticateToken, authRouter };
