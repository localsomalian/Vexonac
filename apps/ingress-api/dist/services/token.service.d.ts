declare class TokenService {
    private getUtcTimestamp;
    /**
     * Generate an authentication token for a license and version
     */
    generateToken(licenseKey: string, version: string, latestVersion: string): string;
    /**
     * Hash a string for token generation
     */
    private hashString;
}
declare const _default: TokenService;
export default _default;
//# sourceMappingURL=token.service.d.ts.map