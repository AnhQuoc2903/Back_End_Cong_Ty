import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export function requirePermission(...permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const userPerms = new Set(req.user.permissions || []);
    const ok = permissions.every((p) => userPerms.has(p));

    if (!ok) return res.status(403).json({ message: "Forbidden" });

    next();
  };
}
