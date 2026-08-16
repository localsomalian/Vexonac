declare class LicenseService {
    validateServer(licenseKey: string, clientIp: string): Promise<any>;
    validateServerQuery(licenseKey: string | undefined, clientIp: string | undefined): Promise<{
        valid: boolean;
        license?: {
            id: string;
        } | null;
    }>;
}
declare const _default: LicenseService;
export default _default;
//# sourceMappingURL=license.service.d.ts.map