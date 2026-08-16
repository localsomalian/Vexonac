/**
 * Shared R2 delete utility for deleting objects from Cloudflare R2 storage
 */
interface R2Config {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    region: string;
}
export declare class R2DeleteService {
    private s3Client;
    private bucketName;
    constructor(config: R2Config);
    /**
     * Delete single object from R2 storage
     */
    deleteObject(fileKey: string): Promise<boolean>;
    /**
     * Delete multiple objects from R2 storage using bulk delete
     */
    deleteObjects(fileKeys: string[]): Promise<{
        successCount: number;
        failureCount: number;
        deletedKeys: string[];
        errors: string[];
    }>;
    /**
     * Delete objects by URLs (handles both single and multiple)
     */
    deleteByUrls(urls: string | string[]): Promise<{
        total: number;
        successCount: number;
        failureCount: number;
        results: Array<{
            url: string;
            success: boolean;
            fileKey?: string;
            error?: string;
        }>;
    }>;
    /**
     * Extract file key from R2 public URL
     */
    extractFileKeyFromUrl(publicUrl: string): string | null;
}
/**
 * Extract R2 URLs from a list of evidence URLs
 * @param evidenceUrls Array of evidence URLs (may include non-R2 URLs)
 * @returns Array of R2 URLs only
 */
export declare function filterR2Urls(evidenceUrls: (string | null | undefined)[]): string[];
/**
 * Create R2 delete service instance with environment variables
 * @param envVars Object containing the required environment variables
 */
export declare function createR2DeleteService(envVars: {
    CLOUDFLARE_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
}): R2DeleteService;
export {};
//# sourceMappingURL=r2-delete.d.ts.map