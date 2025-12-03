import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db";
import { Permission } from "./models/permission.model";
import { Role } from "./models/role.model";
import { User } from "./models/user.model";
import { hashPassword } from "./utils/password";
import { ArtifactCategory } from "./models/artifactCategory.model";

async function seed() {
  await connectDB();

  // 1) Danh sách permission
  const permNames = [
    // Artifacts
    "VIEW_ARTIFACT",
    "CREATE_ARTIFACT",
    "EDIT_ARTIFACT",
    "DELETE_ARTIFACT",
    "IMPORT_ARTIFACT",
    "EXPORT_ARTIFACT",
    "ADJUST_ARTIFACT",
    "VIEW_ARTIFACT_TRANSACTIONS",

    // Categories
    "VIEW_CATEGORY",
    "CREATE_CATEGORY",
    "EDIT_CATEGORY",
    "DELETE_CATEGORY",

    // Admin
    "ADMIN_PANEL",
  ];

  const permissions = [];
  for (const name of permNames) {
    let p = await Permission.findOne({ name });
    if (!p) {
      p = await Permission.create({ name, description: name });
      console.log(`Created permission: ${name}`);
    }
    permissions.push(p);
  }

  // 2) Role Admin: có tất cả quyền
  let adminRole = await Role.findOne({ name: "Admin" });

  const allPermIds = permissions.map((p) => p._id.toString());

  if (!adminRole) {
    adminRole = await Role.create({
      name: "Admin",
      description: "Administrator",
      permissions: permissions.map((p) => p._id) as any,
    });
    console.log("Created role: Admin");
  } else {
    const currentIds = (adminRole.permissions || []).map((id: any) =>
      id.toString()
    );
    const merged = Array.from(new Set([...currentIds, ...allPermIds]));
    // ⚠️ cast as any để khỏi bị lỗi DocumentArray
    adminRole.permissions = merged as any;
    await adminRole.save();
    console.log("Updated role: Admin (merged permissions)");
  }

  // 3) Role Staff: quyền hạn giới hạn
  let staffRole = await Role.findOne({ name: "Staff" });
  const staffAllowed = ["VIEW_ARTIFACT", "IMPORT_ARTIFACT", "EXPORT_ARTIFACT"];
  const staffPermIds = permissions
    .filter((p) => staffAllowed.includes(p.name))
    .map((p) => p._id.toString());

  if (!staffRole) {
    staffRole = await Role.create({
      name: "Staff",
      description: "Staff role",
      permissions: staffPermIds as any,
    });
    console.log("Created role: Staff");
  } else {
    const currentIds = (staffRole.permissions || []).map((id: any) =>
      id.toString()
    );
    const merged = Array.from(new Set([...currentIds, ...staffPermIds]));
    staffRole.permissions = merged as any;
    await staffRole.save();
    console.log("Updated role: Staff (merged permissions)");
  }

  // 4) Admin user
  let adminUser = await User.findOne({ email: "admin@example.com" });
  if (!adminUser) {
    const passwordHash = await hashPassword("123456");
    adminUser = await User.create({
      email: "admin@example.com",
      fullName: "Super Admin",
      passwordHash,
      roles: [adminRole._id],
      isActive: true,
    });
    console.log("Created admin user: admin@example.com / 123456");
  } else {
    const roleIds = (adminUser.roles || []).map((r: any) => r.toString());
    if (!roleIds.includes(adminRole._id.toString())) {
      const mergedRoles = Array.from(
        new Set([...roleIds, adminRole._id.toString()])
      );
      adminUser.roles = mergedRoles as any;
      await adminUser.save();
      console.log("Updated admin user roles to include Admin");
    } else {
      console.log("Admin user exists and already has Admin role");
    }
  }

  // 5) Seed categories
  const sampleCategories = [
    { name: "Gốm sứ", description: "Đồ gốm, sứ, men" },
    { name: "Đồ đồng", description: "Tượng, bình, vũ khí bằng đồng" },
    { name: "Tiền cổ", description: "Tiền xu, tiền giấy cổ" },
    { name: "Tranh ảnh", description: "Tranh vẽ, ảnh, thư pháp" },
  ];

  for (const c of sampleCategories) {
    const existed = await ArtifactCategory.findOne({ name: c.name });
    if (!existed) {
      await ArtifactCategory.create(c);
      console.log(`Created category: ${c.name}`);
    }
  }

  console.log("\n✅ Seed hoàn tất.");
  console.log("   - Admin: admin@example.com / 123456");
  console.log("   - Roles: Admin, Staff");
  console.log("   - Permissions:", permNames.join(", "));

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
