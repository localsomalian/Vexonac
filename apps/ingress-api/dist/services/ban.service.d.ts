export interface CreateBanInput {
    licenseId: string;
    playerLicense: string;
    reason: string;
    details?: Record<string, any>;
    evidenceUrl?: string | null;
    bannedBy?: string;
    duration?: number;
    playerName?: string;
    identifiers?: string[];
}
export interface CreateBanResult {
    banId: string;
    banDbId: string;
    playerName: string;
    playerLicense: string;
    reason: string;
    evidenceUrl: string | null;
    expiresAt: Date | null;
    isPermanent: boolean;
    identifiersBanned: number;
    kickMessage: string;
}
export declare function createBan(input: CreateBanInput): Promise<CreateBanResult>;
//# sourceMappingURL=ban.service.d.ts.map