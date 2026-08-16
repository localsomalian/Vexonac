import type { Permission } from "@vexonac/database";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const hasPermission = (
  permissions: Permission[] | undefined,
  permission: Permission | "ANY"
) => {
  if (!permissions) return false;
  return (
    (permission === "ANY"
      ? permissions.length > 0
      : permissions.includes(permission)) || permissions.includes("ALL")
  );
};

export function getThreatScoreColor(
  score: number,
  bg: boolean = false
): string {
  if (score <= 20) return bg ? "bg-green-600" : "text-green-600"; // Low risk = green
  if (score <= 40) return bg ? "bg-yellow-600" : "text-yellow-600"; // Medium risk = yellow
  if (score <= 70) return bg ? "bg-orange-600" : "text-orange-600"; // High risk = orange
  return bg ? "bg-red-600" : "text-red-600"; // Critical risk = red
}

export function getThreatScoreBadgeVariant(
  riskLevel: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (riskLevel) {
    case "LOW":
      return "default";
    case "MEDIUM":
      return "secondary";
    case "HIGH":
      return "outline";
    case "CRITICAL":
      return "destructive";
    default:
      return "outline";
  }
}

export function getThreatRiskLevelText(riskLevel: string, t: any): string {
  switch (riskLevel) {
    case "LOW":
      return t("risk_low");
    case "MEDIUM":
      return t("risk_medium");
    case "HIGH":
      return t("risk_high");
    case "CRITICAL":
      return t("risk_critical");
    default:
      return riskLevel;
  }
}

