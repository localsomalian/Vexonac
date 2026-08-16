import { randomUUID } from 'crypto'
import prisma from '../../prisma'

export type PlanType = 'monthly' | 'quarterly' | 'lifetime' | 'premium'

interface LicenseGenerationData {
  planId: PlanType
  customerEmail: string
  paymentId: string
  type: 'crypto' | 'card'
}

// Helper function to calculate expiration date based on plan type
function calculateExpirationDate(planType: PlanType): Date {
  const now = new Date()

  switch (planType) {
    case 'monthly':
      // Add 30 days
      now.setDate(now.getDate() + 30)
      break
    case 'quarterly':
      // Add 3 months
      now.setMonth(now.getMonth() + 3)
      break
    case 'lifetime':
      // Set to a far future date (100 years)
      now.setFullYear(now.getFullYear() + 100)
      break
    case 'premium':
      // Premium is monthly + setup service
      now.setDate(now.getDate() + 30)
      break
    default:
      // Default to 1 month if type is unknown
      now.setDate(now.getDate() + 30)
  }

  return now
}

// Generate a unique license key
function generateLicenseKey(planType: PlanType): string {
  const licenseKey = `vexonac-${planType.toLowerCase()}-${randomUUID()}`;
  return licenseKey;
}

// Map plan types to database license types
function mapPlanToLicenseType(planType: PlanType): 'MONTHLY' | 'QUARTERLY' | 'LIFETIME' | undefined {
  switch (planType) {
    case 'monthly':
      return 'MONTHLY'
    case 'quarterly':
      return 'QUARTERLY'
    case 'lifetime':
      return 'LIFETIME'
    case 'premium':
      return undefined
    default:
      return undefined
  }
}

interface LicenseResult {
  success: boolean
  redemptionKey?: any
  licenseKey: string | null
  expiresAt: Date | null
  needsRedemption: boolean
  isService?: boolean
  isDuplicate?: boolean
}

export async function generateAndCreateLicense(data: LicenseGenerationData): Promise<LicenseResult> {
  try {
    const { planId, customerEmail, paymentId, type } = data
    
    if (planId === 'premium') {
      return {
        success: true,
        redemptionKey: null,
        licenseKey: null,
        expiresAt: null,
        needsRedemption: false,
        isService: true,
      }
    }
    
    const licenseKey = generateLicenseKey(planId)
    const expiresAt = calculateExpirationDate(planId)
    const licenseType = mapPlanToLicenseType(planId)
    
    if (!licenseType) {
      return {
        success: true,
        redemptionKey: null,
        licenseKey,
        expiresAt,
        needsRedemption: false,
      }
    }

    const generatedBy = paymentId ? `payment:${type}:${paymentId}:${customerEmail}` : `payment:${type}:${customerEmail}`
    const existingRedemptionKey = await prisma.redemptionKey.findFirst({
      where: {
        generatedBy,
      },
    })

    if (existingRedemptionKey) {
      return {
        success: true,
        redemptionKey: existingRedemptionKey,
        licenseKey: existingRedemptionKey.licenseKey,
        expiresAt,
        needsRedemption: true,
        isDuplicate: true,
      }
    }

    const redemptionKey = await prisma.redemptionKey.create({
      data: {
        licenseKey,
        type: licenseType,
        generatedBy,
      },
    })

    return {
      success: true,
      redemptionKey,
      licenseKey,
      expiresAt,
      needsRedemption: true,
    }
  } catch (error) {
    console.error('âŒ Failed to generate redemption key:', error)
    throw new Error(`Redemption key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to get plan display name
export function getPlanDisplayName(planId: PlanType): string {
  switch (planId) {
    case 'monthly':
      return 'Monthly Plan'
    case 'quarterly':
      return 'Quarterly Plan'
    case 'lifetime':
      return 'Lifetime Plan'
    case 'premium':
      return 'Premium Setup Service'
    default:
      return 'VexonAC Plan'
  }
}

// Helper function to get plan price
export function getPlanPrice(planId: PlanType): string {
  switch (planId) {
    case 'monthly':
      return 'â‚¬50'
    case 'quarterly':
      return 'â‚¬100'
    case 'lifetime':
      return 'â‚¬250'
    case 'premium':
      return 'â‚¬60'
    default:
      return 'N/A'
  }
} 
