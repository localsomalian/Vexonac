import type { PrismaClient } from "@vexonac/database";
interface PlayerData {
    id: string;
    playerName: string;
    playerLicense: string;
    identifiers: any;
    oldIdentifiers: any;
    firstJoin: Date;
    lastJoin: Date;
    playTime: number;
    licenseId: string;
}
export interface TrustScoreResult {
    score: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    warnings: string[];
}
/**
 * Filter identifiers to remove sensitive or unreliable ones (IP, FID, SID)
 */
export declare function filterIdentifiers(identifiers: string[] | any, oldIdentifiers: string[] | any, includeSensitive?: boolean): {
    all: string[];
    filtered: string[];
};
/**
 * Find alt accounts sharing identifiers with the player
 */
export declare function findAltAccounts(db: PrismaClient, playerId: string, filteredIdentifiers: string[], limit?: number): Promise<any[]>;
/**
 * Find direct bans for a player
 */
export declare function findPlayerBans(db: PrismaClient, playerId: string): Promise<({
    license: {
        id: string;
        serverName: string;
    };
    identifiers: {
        type: import("@vexonac/database/prisma/generated/client").$Enums.IdentifierType;
        value: string;
    }[];
} & {
    id: string;
    playerId: string;
    licenseId: string;
    banId: string;
    reason: string | null;
    details: import("@vexonac/database/prisma/generated/client/runtime/library").JsonValue;
    evidenceUrl: string | null;
    bannedAt: Date;
    expiresAt: Date | null;
    bannedBy: string | null;
})[]>;
/**
 * Find bans on alt accounts on the same server
 */
export declare function findSameServerAltBans(db: PrismaClient, allIdentifiers: string[], serverId: string, playerId: string): Promise<any[]>;
/**
 * Find bans history for a player
 */
export declare function findBansHistory(db: PrismaClient, playerIds: string[]): Promise<({
    license: {
        serverName: string;
    };
} & {
    id: string;
    playerId: string;
    licenseId: string;
    reason: string;
    details: import("@vexonac/database/prisma/generated/client/runtime/library").JsonValue;
    evidenceUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
})[]>;
/**
 * Find cross-server bans matching the identifiers
 */
export declare function findCrossServerBans(db: PrismaClient, filteredIdentifiers: string[], serverId: string): Promise<any[]>;
/**
 * Calculate trust score for a player based on multiple factors
 * Starts at 50 (neutral) and adds/subtracts points based on risk factors
 * Final score: 0 = perfect trust, 100 = maximum risk
 */
export declare function calculateTrustScore(db: PrismaClient, player: PlayerData, serverId: string): Promise<TrustScoreResult>;
/**
 * Perform a full analysis of a player, including alts, bans, and trust score
 */
export declare function performPlayerAnalysis(db: PrismaClient, player: PlayerData, contextServerId: string | undefined, options: {
    showIpIdentifiers?: boolean;
    showIdentifiers?: boolean;
}): Promise<{
    crossServerBans: {
        id: any;
        banId: any;
        reason: any;
        details: any;
        evidenceUrl: any;
        bannedAt: any;
        expiresAt: any;
        bannedBy: any;
        server: {
            id: any;
            name: any;
            isCurrentServer: boolean;
        };
        matchingIdentifiers: any;
        matchingIdentifiersCount: any;
        player: any;
    }[];
    bansHistory: {
        server: string;
        reason: string;
        details: import("@vexonac/database/prisma/generated/client/runtime/library").JsonValue;
        evidenceUrl: string | null;
        bannedAt: Date;
    }[];
    threatScore: TrustScoreResult;
    sameServerAltBans?: {
        id: any;
        banId: any;
        reason: any;
        details: any;
        evidenceUrl: any;
        bannedAt: any;
        expiresAt: any;
        bannedBy: any;
        server: {
            id: any;
            name: any;
            isCurrentServer: boolean;
        };
        matchingIdentifiers: any;
        matchingIdentifiersCount: any;
        player: any;
        isDirectBan: boolean;
        isAltAccountBan: boolean;
    }[] | undefined;
    playerBans?: {
        id: string;
        banId: string;
        reason: string | null;
        details: import("@vexonac/database/prisma/generated/client/runtime/library").JsonValue;
        evidenceUrl: string | null;
        bannedAt: Date;
        expiresAt: Date | null;
        bannedBy: string | null;
        server: {
            id: string;
            name: string;
            isCurrentServer: boolean;
        };
        identifiers: {
            type: import("@vexonac/database/prisma/generated/client").$Enums.IdentifierType;
            value: string;
        }[];
        isDirectBan: boolean;
    }[] | undefined;
    player: {
        playerName: string;
        playerLicense: string;
        identifiers: string[];
        oldIdentifiers: string[];
        firstJoin: Date;
        lastJoin: Date;
        playTime: number;
    };
    altAccounts: {
        playerName: any;
        playerLicense: any;
        firstJoin: any;
        lastJoin: any;
        playTime: any;
        server: {
            name: any;
            isCurrentServer: boolean;
        };
        matchingIdentifiers: string[];
        identifiersCount: number;
    }[];
}>;
export {};
//# sourceMappingURL=trust-score.d.ts.map