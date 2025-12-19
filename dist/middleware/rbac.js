"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
function requirePermission(...permissions) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const userPerms = new Set(req.user.permissions || []);
        const ok = permissions.every((p) => userPerms.has(p));
        if (!ok)
            return res.status(403).json({ message: "Forbidden" });
        next();
    };
}
