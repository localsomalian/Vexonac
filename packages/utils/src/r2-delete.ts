/**
 * Shared R2 delete utility for deleting objects from Cloudflare R2 storage
 */

import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'

interface R2Config {
	accountId: string
	accessKeyId: string
	secretAccessKey: string
	bucketName: string
	region: string
}

export class R2DeleteService {
	private s3Client: S3Client
	private bucketName: string

	constructor(config: R2Config) {
		if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
			throw new Error('R2DeleteService requires all config fields: accountId, accessKeyId, secretAccessKey, bucketName')
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
	 * Delete single object from R2 storage
	 */
	async deleteObject(fileKey: string): Promise<boolean> {
		try {
			const command = new DeleteObjectCommand({
				Bucket: this.bucketName,
				Key: fileKey
			})

			await this.s3Client.send(command)
			console.log(`Successfully deleted object: ${fileKey}`)
			return true
		} catch (error) {
			console.error('Failed to delete R2 object:', error)
			return false
		}
	}

	/**
	 * Delete multiple objects from R2 storage using bulk delete
	 */
	async deleteObjects(fileKeys: string[]): Promise<{
		successCount: number
		failureCount: number
		deletedKeys: string[]
		errors: string[]
	}> {
		if (fileKeys.length === 0) {
			return { successCount: 0, failureCount: 0, deletedKeys: [], errors: [] }
		}

		// AWS S3 bulk delete supports up to 1000 objects per request
		const batchSize = 1000
		let successCount = 0
		let failureCount = 0
		const deletedKeys: string[] = []
		const errors: string[] = []

		for (let i = 0; i < fileKeys.length; i += batchSize) {
			const batch = fileKeys.slice(i, i + batchSize)
			
			try {
				const command = new DeleteObjectsCommand({
					Bucket: this.bucketName,
					Delete: {
						Objects: batch.map(key => ({ Key: key }))
					}
				})

				const result = await this.s3Client.send(command)
				
				if (result.Deleted) {
					const batchDeleted = result.Deleted.map(obj => obj.Key).filter(Boolean) as string[]
					deletedKeys.push(...batchDeleted)
					successCount += batchDeleted.length
				}

				if (result.Errors) {
					const batchErrors = result.Errors.map(err => `${err.Key}: ${err.Message}`).filter(Boolean) as string[]
					errors.push(...batchErrors)
					failureCount += result.Errors.length
				}

				console.log(`Bulk deleted ${result.Deleted?.length || 0} objects in batch`)
			} catch (error) {
				console.error('Failed to bulk delete R2 objects:', error)
				errors.push(`Batch error: ${error instanceof Error ? error.message : 'Unknown error'}`)
				failureCount += batch.length
			}
		}

		return { successCount, failureCount, deletedKeys, errors }
	}

	/**
	 * Delete objects by URLs (handles both single and multiple)
	 */
	async deleteByUrls(urls: string | string[]): Promise<{
		total: number
		successCount: number
		failureCount: number
		results: Array<{
			url: string
			success: boolean
			fileKey?: string
			error?: string
		}>
	}> {
		const urlArray = Array.isArray(urls) ? urls : [urls]
		const validUrls: Array<{ url: string; fileKey: string }> = []
		const results: Array<{
			url: string
			success: boolean
			fileKey?: string
			error?: string
		}> = []

		// Extract file keys and validate URLs
		for (const url of urlArray) {
			if (!url || !url.includes('r2.vexonac.com')) {
				results.push({
					url,
					success: false,
					error: 'Invalid URL - not from R2 storage'
				})
				continue
			}

			const fileKey = this.extractFileKeyFromUrl(url)
			if (!fileKey) {
				results.push({
					url,
					success: false,
					error: 'Could not extract file key from URL'
				})
				continue
			}

			validUrls.push({ url, fileKey })
		}

		if (validUrls.length === 0) {
			return {
				total: urlArray.length,
				successCount: 0,
				failureCount: urlArray.length,
				results
			}
		}

		// Use bulk delete for efficiency
		const fileKeys = validUrls.map(item => item.fileKey)
		const deleteResult = await this.deleteObjects(fileKeys)

		// Map results back to URLs
		for (const { url, fileKey } of validUrls) {
			const wasDeleted = deleteResult.deletedKeys.includes(fileKey)
			const error = deleteResult.errors.find(err => err.includes(fileKey))

			const result: {
				url: string
				success: boolean
				fileKey?: string
				error?: string
			} = {
				url,
				success: wasDeleted,
				fileKey
			}

			if (error) {
				result.error = error
			} else if (!wasDeleted) {
				result.error = 'Failed to delete'
			}

			results.push(result)
		}

		return {
			total: urlArray.length,
			successCount: deleteResult.successCount,
			failureCount: results.filter(r => !r.success).length,
			results
		}
	}

	/**
	 * Extract file key from R2 public URL
	 */
	extractFileKeyFromUrl(publicUrl: string): string | null {
		try {
			// Expected format: https://r2.vexonac.com/screenshots/timestamp-uuid.ext
			const url = new URL(publicUrl)
			
			// Remove leading slash and return the path
			return url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname
		} catch (error) {
			console.error('Failed to extract file key from URL:', error)
			return null
		}
	}
}

/**
 * Extract R2 URLs from a list of evidence URLs
 * @param evidenceUrls Array of evidence URLs (may include non-R2 URLs)
 * @returns Array of R2 URLs only
 */
export function filterR2Urls(evidenceUrls: (string | null | undefined)[]): string[] {
	return evidenceUrls
		.filter((url): url is string => Boolean(url && url.includes('r2.vexonac.com')))
}

/**
 * Create R2 delete service instance with environment variables
 * @param envVars Object containing the required environment variables
 */
export function createR2DeleteService(envVars: {
	CLOUDFLARE_ACCOUNT_ID: string
	R2_ACCESS_KEY_ID: string
	R2_SECRET_ACCESS_KEY: string
	R2_BUCKET_NAME: string
}): R2DeleteService {
	return new R2DeleteService({
		accountId: envVars.CLOUDFLARE_ACCOUNT_ID,
		accessKeyId: envVars.R2_ACCESS_KEY_ID,
		secretAccessKey: envVars.R2_SECRET_ACCESS_KEY,
		bucketName: envVars.R2_BUCKET_NAME,
		region: 'auto'
	})
} 
