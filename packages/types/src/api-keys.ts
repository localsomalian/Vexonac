export enum APIPlan {
    FREE = 'FREE',
    BASIC = 'BASIC',
    PRO = 'PRO',
    BUSINESS = 'BUSINESS',
    ENTERPRISE = 'ENTERPRISE',
}

export interface APIPlanConfig {
    name: string;
    price: number;
    monthlyRequestLimit: number; // Now represents Credits
    rateLimitPerMinute: number;
    maxWebhooks: number;
    canSeeIdentifiersServer: boolean;
    canSeeIdentifiers: boolean; // false = masked, true = visible
}

// 
// * API Plans
// * Free: 0$ - Verify API Works, View Bans Feed
// * Basic: 29.99$ - Access Global Bans API, Server Info API
// * Pro: 49.99$ - Access Server Control & Lookup API, View Identifiers for your server
// * Business: 149.99$ - Identifiers & Intelligence API (any identifier, global lookup), Webhooks API
// * Enterprise: 499.99$ - Everything
// */

export const APIPlans: Record<APIPlan, APIPlanConfig> = {
    [APIPlan.FREE]: {
        name: 'Free',
        price: 0,
        monthlyRequestLimit: 1000,
        rateLimitPerMinute: 60,
        maxWebhooks: 0,
        canSeeIdentifiersServer: false,
        canSeeIdentifiers: false,
    },
    [APIPlan.BASIC]: {
        name: 'Basic',
        price: 29.99,
        monthlyRequestLimit: 50000,
        rateLimitPerMinute: 120,
        maxWebhooks: 0,
        canSeeIdentifiersServer: false,
        canSeeIdentifiers: false,
    },
    [APIPlan.PRO]: {
        name: 'Pro',
        price: 49.99,
        monthlyRequestLimit: 250000,
        rateLimitPerMinute: 600,
        maxWebhooks: 0,
        canSeeIdentifiersServer: true,
        canSeeIdentifiers: false,
    },
    [APIPlan.BUSINESS]: {
        name: 'Business',
        price: 149.99,
        monthlyRequestLimit: 1000000,
        rateLimitPerMinute: 1000,
        maxWebhooks: 3,
        canSeeIdentifiersServer: true,
        canSeeIdentifiers: true,
    },
    [APIPlan.ENTERPRISE]: {
        name: 'Enterprise',
        price: 499.99,
        monthlyRequestLimit: 5000000,
        rateLimitPerMinute: 1000,
        maxWebhooks: 10,
        canSeeIdentifiersServer: true,
        canSeeIdentifiers: true,
    },
}

export const APIPlansLevels = {
    [APIPlan.FREE]: 0,
    [APIPlan.BASIC]: 1,
    [APIPlan.PRO]: 2,
    [APIPlan.BUSINESS]: 3,
    [APIPlan.ENTERPRISE]: 4,
}

export enum APIKeyPermission {
    SERVER_CONTROL = 'SERVER_CONTROL',
    SERVER_INFO = 'SERVER_INFO',
    PLAYER_LOOKUP = 'PLAYER_LOOKUP',
    STATS = 'STATS',
    WEBHOOKS = 'WEBHOOKS',
}

export const APIKeyPermissions = {
    [APIKeyPermission.SERVER_CONTROL]: {
        name: 'Server Control',
    },
    [APIKeyPermission.SERVER_INFO]: {
        name: 'Server Info',
    },
    [APIKeyPermission.PLAYER_LOOKUP]: {
        name: 'Player Lookup',
    },
    [APIKeyPermission.STATS]: {
        name: 'Stats',
    },
    [APIKeyPermission.WEBHOOKS]: {
        name: 'Webhooks',
    },
}
