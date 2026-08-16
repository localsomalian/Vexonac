import type { Permission } from "@vexonac/database";

export const hasPermission = (
  permissions: Permission[],
  permission: Permission | "ANY"
) => {
  return (
    (permission === "ANY"
      ? permissions.length > 0
      : permissions.includes(permission)) || permissions.includes("ALL")
  );
};

