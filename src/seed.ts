import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db";
import { Permission } from "./models/permission.model";
import { Role } from "./models/role.model";
import { User } from "./models/user.model";
import { hashPassword } from "./utils/password";
import { ArtifactCategory } from "./models/artifactCategory.model";
import { Department } from "./models/department.model";

async function seed() {
  await connectDB();

  // 1) Danh sách permission
  const permDefs = [
    // ===== ARTIFACT =====
    {
      name: "VIEW_ARTIFACT",
      description: "Xem hiện vật",
      group: "Hiện vật",
    },
    {
      name: "CREATE_ARTIFACT",
      description: "Tạo hiện vật",
      group: "Hiện vật",
    },
    {
      name: "EDIT_ARTIFACT",
      description: "Chỉnh sửa hiện vật",
      group: "Hiện vật",
    },
    {
      name: "DELETE_ARTIFACT",
      description: "Xóa hiện vật",
      group: "Hiện vật",
    },
    {
      name: "IMPORT_ARTIFACT",
      description: "Nhập hiện vật",
      group: "Hiện vật",
    },
    {
      name: "EXPORT_ARTIFACT",
      description: "Xuất hiện vật",
      group: "Hiện vật",
    },
    {
      name: "ADJUST_ARTIFACT",
      description: "Điều chỉnh hiện vật",
      group: "Hiện vật",
    },
    {
      name: "VIEW_ARTIFACT_TRANSACTIONS",
      description: "Xem lịch sử hiện vật",
      group: "Hiện vật",
    },

    {
      name: "EXPORT_ARTIFACT_TRANSACTIONS",
      description: "Xuất file excel lịch sử giao dịch",
      group: "Hiện vật",
    },
    {
      name: "EXPORT_LIST_OF__ARTIFACT",
      description: "Xuất file excel danh sách hiện vật",
      group: "Hiện vật",
    },

    // ===== CATEGORY =====
    {
      name: "VIEW_CATEGORY",
      description: "Xem danh mục",
      group: "Danh mục",
    },
    {
      name: "CREATE_CATEGORY",
      description: "Tạo danh mục",
      group: "Danh mục",
    },
    {
      name: "EDIT_CATEGORY",
      description: "Chỉnh sửa danh mục",
      group: "Danh mục",
    },
    {
      name: "DELETE_CATEGORY",
      description: "Xóa danh mục",
      group: "Danh mục",
    },

    // ===== ADMIN =====
    {
      name: "ADMIN_PANEL",
      description: "Truy cập trang quản trị",
      group: "Hệ thống",
    },
  ];

  await Permission.deleteOne({ name: "VIEW_ARTIFACT_CATEGORY" });

  const permissions = [];

  for (const def of permDefs) {
    let p = await Permission.findOne({ name: def.name });

    if (!p) {
      p = await Permission.create(def);
      console.log(`Created permission: ${def.name}`);
    } else {
      // cập nhật nếu thiếu description / group
      let changed = false;

      if (p.description !== def.description) {
        p.description = def.description;
        changed = true;
      }
      if (p.group !== def.group) {
        p.group = def.group;
        changed = true;
      }

      if (changed) {
        await p.save();
        console.log(`Updated permission: ${def.name}`);
      }
    }

    permissions.push(p);
  }

  const itDept = await Department.findOne({ name: "IT" });

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
      department: itDept?._id,
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

  const departmentDefs = [
    { name: "IT" },
    { name: "Kế toán" },
    { name: "Nhân sự" },
    { name: "Kho" },
  ];

  for (const d of departmentDefs) {
    const existed = await Department.findOne({ name: d.name });
    if (!existed) {
      await Department.create(d);
      console.log(`Created department: ${d.name}`);
    }
  }

  console.log("\n✅ Seed hoàn tất.");
  console.log("   - Admin: admin@example.com / 123456");
  console.log("   - Roles: Admin, Staff");
  console.log("Permissions:", permDefs.map((p) => p.name).join(", "));

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
