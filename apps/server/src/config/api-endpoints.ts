import { APITier } from "@vexonac/database/prisma/generated/client/client";

export interface EndpointConfig {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    minTier?: APITier;
    cost: number;
}

export const API_ENDPOINTS_CONFIG: EndpointConfig[] = [
    // Stats Routes
    {
        path: "/v1/stats",
        method: "GET",
        minTier: APITier.FREE, 
        cost: 5
    },
    // Bans Routes
    {
        path: "/v1/bans/recent",
        method: "GET",
        minTier: APITier.FREE,
        cost: 2
    },
    {
        path: "/v1/bans/search",
        method: "GET",
        minTier: APITier.BASIC,
        cost: 5
    },
    {
        path: "/v1/bans/stats",
        method: "GET",
        minTier: APITier.BASIC,
        cost: 5
    },
    {
        path: "/v1/bans/trends",
        method: "GET",
        minTier: APITier.BASIC,
        cost: 10
    },
    // Server Routes
    {
        path: "/v1/server",
        method: "GET",
        minTier: APITier.FREE,
        cost: 2
    },
    {
        path: "/v1/server/stats",
        method: "GET",
        minTier: APITier.BASIC,
        cost: 5
    },
    {
        path: "/v1/server/bans",
        method: "GET",
        minTier: APITier.BASIC,
        cost: 5
    },
    {
        path: "/v1/server/bans-history",
        method: "GET",
        minTier: APITier.BASIC,
        cost: 5
    },
    {
        path: "/v1/server/config",
        method: "GET",
        minTier: APITier.BASIC,
        cost: 2
    },
    {
        path: "/v1/server/players",
        method: "GET",
        minTier: APITier.BASIC,
        cost: 2
    },
    {
        path: "/v1/server/admins",
        method: "GET",
        minTier: APITier.BASIC,
        cost: 2
    },
    {
        path: "/v1/server/logs",
        method: "GET",
        minTier: APITier.BASIC,
        cost: 10
    },
    {
        path: "/v1/server/lookup",
        method: "POST", 
        minTier: APITier.PRO,
        cost: 15
    },
    // Server Control Routes
    {
        path: "/v1/server/screenshot",
        method: "POST",
        minTier: APITier.PRO,
        cost: 10
    },
    {
        path: "/v1/server/kick",
        method: "POST",
        minTier: APITier.PRO,
        cost: 5
    },
    {
        path: "/v1/server/ban",
        method: "POST",
        minTier: APITier.PRO,
        cost: 5
    },
    {
        path: "/v1/server/unban",
        method: "POST",
        minTier: APITier.PRO,
        cost: 5
    },
    {
        path: "/v1/server/unban/all",
        method: "POST",
        minTier: APITier.PRO,
        cost: 50
    },
    {
        path: "/v1/server/unban/last",
        method: "POST",
        minTier: APITier.PRO,
        cost: 10
    },
    {
        path: "/v1/server/ban/offline",
        method: "POST",
        minTier: APITier.PRO,
        cost: 10
    },
    {
        path: "/v1/server/exec",
        method: "POST",
        minTier: APITier.PRO,
        cost: 5
    },
    {
        path: "/v1/server/admin/add",
        method: "POST",
        minTier: APITier.PRO,
        cost: 5
    },
    {
        path: "/v1/server/admin/remove",
        method: "POST",
        minTier: APITier.PRO,
        cost: 5
    },
    // Player Lookup Routes
    {
        path: "/v1/player/search",
        method: "GET",
        minTier: APITier.BASIC,
        cost: 5
    },
    // Dynamic paths must be handled carefully in getEndpointConfig logic or specific entries
    // However, getEndpointConfig currently does exact match. 
    // We need to update getEndpointConfig to support path parameters or register all variants.
    // For now, we will rely on exact path match for static routes, and special handling for dynamic routes.
    // Or better, we can update getEndpointConfig to support regex or simple prefix matching.
];

export const getEndpointConfig = (path: string, method: string): EndpointConfig | undefined => {
    const cleanPath = path.split('?')[0].replace(/\/$/, ""); 
    const methodUpper = method.toUpperCase();

    // Exact match first
    const exactMatch = API_ENDPOINTS_CONFIG.find(config => 
        config.path === cleanPath && 
        config.method === methodUpper
    );
    if (exactMatch) return exactMatch;

    // Dynamic routes matching
    if (cleanPath.startsWith("/v1/player/")) {
        // Extract parts
        // /v1/player/{identifier} -> parts[3] is identifier
        // /v1/player/{identifier}/servers
        const parts = cleanPath.split('/');
        
        // /v1/player/{identifier}
        if (parts.length === 4) {
            return {
                path: "/v1/player/:identifier",
                method: "GET",
                minTier: APITier.BASIC,
                cost: 5
            };
        }
        
        // /v1/player/{identifier}/{subroute}
        if (parts.length === 5) {
            const subroute = parts[4];
            switch(subroute) {
                case "servers":
                    return { path: "/v1/player/:identifier/servers", method: "GET", minTier: APITier.BUSINESS, cost: 5 };
                case "bans":
                    return { path: "/v1/player/:identifier/bans", method: "GET", minTier: APITier.PRO, cost: 5 };
                case "bans-history":
                    return { path: "/v1/player/:identifier/bans-history", method: "GET", minTier: APITier.BUSINESS, cost: 10 };
                case "threat-score":
                    return { path: "/v1/player/:identifier/threat-score", method: "GET", minTier: APITier.BUSINESS, cost: 5 };
                case "analysis":
                    return { path: "/v1/player/:identifier/analysis", method: "GET", minTier: APITier.BUSINESS, cost: 15 };
            }
        }
    }

    return undefined;
};


