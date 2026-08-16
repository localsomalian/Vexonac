import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'

interface R2Config {
	accountId: string
	accessKeyId: string
	secretAccessKey: string
	bucketName: string
	region: string
}

export class R2UploadService {
	private s3Client: S3Client
	private bucketName: string

	constructor() {
		const config: R2Config = {
			accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
			accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
			secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
			bucketName: process.env.R2_BUCKET_NAME || '',
			region: 'auto'
		}

		this.bucketName = config.bucketName

		this.s3Client = new S3Client({
			region: config.region,
			endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey
			}
		})
	}

	/**
	 * Generate a pre-signed URL for uploading files to R2
	 */
	async generateUploadUrl(
		fileType: 'screenshot' | 'video',
		contentType: string
	): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
		try {
			if (!this.isAllowedContentType(fileType, contentType)) {
				throw new Error(`Content type ${contentType} not allowed for ${fileType}`)
			}

			const fileExtension = this.getFileExtension(contentType)
			const timestamp = Date.now()
			const uuid = uuidv4()
			
			const fileKey = `${fileType}s/${timestamp}-${uuid}.${fileExtension}`

			const command = new PutObjectCommand({
				Bucket: this.bucketName,
				Key: fileKey,
				ContentType: contentType,
				Metadata: {
					uploadedAt: timestamp.toString(),
					fileType
				}
			})

			const uploadUrl = await getSignedUrl(this.s3Client, command, {
				expiresIn: 30
			})

			// Public URL for accessing the file
			const publicUrl = `https://r2.vexonac.com/${fileKey}`

			return {
				uploadUrl,
				fileKey,
				publicUrl
			}
		} catch (error) {
			console.error('Failed to generate R2 upload URL:', error)
			throw new Error('Failed to generate upload URL')
		}
	}

	/**
	 * Validate if content type is allowed for the given file type
	 */
	private isAllowedContentType(fileType: 'screenshot' | 'video', contentType: string): boolean {
		const allowedTypes = {
			screenshot: ['image/webp'],
			video: ['video/x-matroska']
		}

		return (fileType && allowedTypes[fileType] && allowedTypes[fileType].includes(contentType)) || false
	}

	/**
	 * Get file extension based on content type
	 */
	private getFileExtension(contentType: string): string {
		const typeMap: Record<string, string> = {
			'image/webp': 'webp',
			'video/x-matroska': 'webm'
		}

		return typeMap[contentType] || 'bin'
	}
}

export const r2UploadService = new R2UploadService() 
