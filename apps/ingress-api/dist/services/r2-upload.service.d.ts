declare class R2UploadService {
    private s3Client;
    private bucketName;
    constructor();
    generateScreenshotUploadUrl(): Promise<{
        uploadUrl: string;
        publicUrl: string;
    }>;
    generateRecordingUploadUrl(): Promise<{
        uploadUrl: string;
        publicUrl: string;
    }>;
}
export declare const r2UploadService: R2UploadService;
export {};
//# sourceMappingURL=r2-upload.service.d.ts.map