/** Default home route after sign-in for each role (demo SPA). */
export function getRoleHomePath(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "TENANT_ADMIN":
    case "CLINIC_ADMIN":
      return "/dashboard";
    case "STAFF":
      return "/staff/schedule";
    case "CUSTOMER":
    default:
      return "/home";
  }
}

export function isCustomerRole(role: string): boolean {
  return role === "CUSTOMER";
}
