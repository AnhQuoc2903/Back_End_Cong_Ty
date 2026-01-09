const FIELD_LABEL: Record<string, string> = {
  fullName: "tên",
  phone: "số điện thoại",
  avatar: "ảnh đại diện",
  roles: "vai trò",
  department: "phòng ban",
  isActive: "trạng thái",
};

export function buildUpdateUserDetail(changedFields: string[], email: string) {
  if (changedFields.length === 0) return undefined;

  const text = changedFields.map((f) => FIELD_LABEL[f] || f).join(", ");

  return `Cập nhật ${text} của người dùng ${email}`;
}
