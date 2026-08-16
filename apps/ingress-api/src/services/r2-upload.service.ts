import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

class R2UploadService {
  private s3Client: S3Client
  private bucketName: string

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || ''
    this.bucketName = process.env.R2_BUCKET_NAME || ''

    // S3_ENDPOINT overrides the Cloudflare default — use this for MinIO, Backblaze B2, etc.
    const endpoint = process.env.S3_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`

    this.s3Client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: !!process.env.S3_ENDPOINT, // required for MinIO
    })
  }

  async generateScreenshotUploadUrl(): Promise<{ uploadUrl: string; publicUrl: string }> {
    const fileKey = `screenshots/${Date.now()}-${randomUUID()}.webp`

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: 'image/webp',
    })

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 60 })
    const publicUrl = `${process.env.R2_PUBLIC_URL || 'https://r2.vexonac.com'}/${fileKey}`

    return { uploadUrl, publicUrl }
  }

  async generateRecordingUploadUrl(): Promise<{ uploadUrl: string; publicUrl: string }> {
    const fileKey = `recordings/${Date.now()}-${randomUUID()}.webm`

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: 'video/webm',
    })

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 120 })
    const publicUrl = `${process.env.R2_PUBLIC_URL || 'https://r2.vexonac.com'}/${fileKey}`

    return { uploadUrl, publicUrl }
  }
}

export const r2UploadService = new R2UploadService()
