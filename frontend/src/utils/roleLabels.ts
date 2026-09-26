/** Product-facing role names (JWT still uses TENANT_ADMIN / STAFF / …). */
export function roleDisplayName(role: string | null | undefined): string {
  switch ((role || "").toUpperCase()) {
    case "SUPER_ADMIN":
      return "Platform Admin";
    case "TENANT_ADMIN":
    case "CLINIC_ADMIN":
      return "Business Admin";
    case "STAFF":
      return "Employee";
    case "CUSTOMER":
      return "Customer";
    default:
      return role || "User";
  }
}
