import { ADMIN_ROLES } from "@/lib/roles";
import { requireRole } from "@/middleware/requireRole";

// Backwards-compatible wrapper for existing admin/manager routes.
// Owners are included as the highest-privilege role.
export const requireAdmin = requireRole(...ADMIN_ROLES);
