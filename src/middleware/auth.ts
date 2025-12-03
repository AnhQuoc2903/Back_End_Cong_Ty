import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized" });

  const token = header.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    // decoded should contain { id, email, roles, permissions }
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
