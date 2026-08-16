export declare enum APIPlan {
    FREE = "FREE",
    BASIC = "BASIC",
    PRO = "PRO",
    BUSINESS = "BUSINESS",
    ENTERPRISE = "ENTERPRISE"
}
export interface APIPlanConfig {
    name: string;
    price: number;
    monthlyRequestLimit: number;
    rateLimitPerMinute: number;
    maxWebhooks: number;
    canSeeIdentifiersServer: boolean;
    canSeeIdentifiers: boolean;
}
export declare const APIPlans: Record<APIPlan, APIPlanConfig>;
export declare const APIPlansLevels: {
    FREE: number;
    BASIC: number;
    PRO: number;
    BUSINESS: number;
    ENTERPRISE: number;
};
export declare enum APIKeyPermission {
    SERVER_CONTROL = "SERVER_CONTROL",
    SERVER_INFO = "SERVER_INFO",
    PLAYER_LOOKUP = "PLAYER_LOOKUP",
    STATS = "STATS",
    WEBHOOKS = "WEBHOOKS"
}
export declare const APIKeyPermissions: {
    SERVER_CONTROL: {
        name: string;
    };
    SERVER_INFO: {
        name: string;
    };
    PLAYER_LOOKUP: {
        name: string;
    };
    STATS: {
        name: string;
    };
    WEBHOOKS: {
        name: string;
    };
};
//# sourceMappingURL=api-keys.d.ts.map