import type { ProfileData } from "../api/client";

/** True if profile has the permission (or platform.admin / SUPER_ADMIN). */
export function hasPermission(profile: ProfileData | null | undefined, code: string): boolean {
  if (!profile) return false;
  if (profile.user.role === "SUPER_ADMIN") return true;
  const perms = profile.permissions ?? [];
  if (perms.includes("platform.admin")) return true;
  return perms.includes(code);
}

/** True if the clinic sector has the feature module enabled. */
export function hasModule(profile: ProfileData | null | undefined, moduleCode: string): boolean {
  if (!profile) return false;
  if (profile.user.role === "SUPER_ADMIN") return true;
  const modules = profile.modules ?? [];
  if (modules.length === 0) {
    // Before catalog hydrates, allow core nav so owners are not locked out
    return ["booking", "staff", "payments", "crm", "analytics", "trending", "settings"].includes(moduleCode);
  }
  return modules.some((m) => m.code === moduleCode);
}

export function hasAnyModule(
  profile: ProfileData | null | undefined,
  moduleCodes: string[],
): boolean {
  return moduleCodes.some((c) => hasModule(profile, c));
}
