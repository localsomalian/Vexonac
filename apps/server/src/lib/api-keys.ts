import type { APIKey, APITier } from "@vexonac/database/prisma/generated/client/client";
import { APIPlansLevels } from "@vexonac/types";

export function IsAPIKeyMinimumTier(apiKey: APIKey, tier?: APITier) {
    const apiKeyLevel = APIPlansLevels[apiKey.tier] || 0;
    const tierLevel = tier ? (APIPlansLevels[tier] || 0) : 0;
    return apiKeyLevel >= tierLevel;
}
