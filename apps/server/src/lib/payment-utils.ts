import { DiscountType } from '@vexonac/database';
import prisma from '../../prisma'

/**
 * Plan types available for purchase
 */
export enum PlanType {
	MONTHLY = 'monthly',
	QUARTERLY = 'quarterly',
	LIFETIME = 'lifetime',
	PREMIUM = 'premium',
}

/**
 * Plan pricing configuration
 */
export const PLAN_PRICING: Record<PlanType, { price: number; priceUsd: number; name: string; polarProductId: string }> = {
	[PlanType.MONTHLY]: { price: 12, priceUsd: 12, name: 'Starter', polarProductId: '0cd7e0be-2201-4577-8711-0ea699ae1dc6' },
	[PlanType.QUARTERLY]: { price: 29, priceUsd: 29, name: 'Standard', polarProductId: '96c1c5ec-d2e0-4420-b8e8-de892ee47a1e' },
	[PlanType.LIFETIME]: { price: 89, priceUsd: 89, name: 'Lifetime', polarProductId: 'a9529bfe-800c-4d41-a71d-510024e2e71c' },
	[PlanType.PREMIUM]: { price: 89, priceUsd: 89, name: 'Lifetime', polarProductId: 'b8a36389-f28e-4005-b90d-8e3699357190' },
}

/**
 * Result of price calculation with discount applied
 */
export interface PriceCalculationResult {
	originalPrice: number
	discountAmount: number
	finalPrice: number
	currency: string
	discount?: {
		id: string
		code: string
		type: DiscountType
		description?: string | null
	}
}

/**
 * Validates if a plan type is valid
 */
export function isValidPlanType(plan: string): plan is PlanType {
	return Object.values(PlanType).includes(plan as PlanType)
}

/**
 * Retrieves the active discount by code
 * @param code - Discount code (required)
 * @returns The active discount or null
 */
export async function getActiveDiscount(code: string) {
	const now = new Date()

	// Find the discount by code
	const discount = await prisma.discount.findFirst({
		where: {
			code: code.toUpperCase().trim(),
			isActive: true,
			OR: [
				{ expiresAt: null },
				{ expiresAt: { gt: now } },
			],
		},
	})

	return discount
}

/**
 * Calculates the discount amount based on the discount type
 * @param originalPrice - The original price
 * @param discount - The discount object
 * @returns The discount amount
 */
function calculateDiscountAmount(
	originalPrice: number,
	discount: {
		discountType: DiscountType
		discountAmount: number
		discountPercentage: number
	}
): number {
	if (discount.discountType === DiscountType.PERCENTAGE) {
		// Calculate percentage discount
		const discountAmount = (originalPrice * discount.discountPercentage) / 100
		// Ensure discount doesn't exceed original price
		return Math.min(discountAmount, originalPrice)
	} else {
		// Fixed amount discount
		// Ensure discount doesn't exceed original price
		return Math.min(discount.discountAmount, originalPrice)
	}
}

/**
 * Calculates the final price with discount applied
 * @param plan - The plan type
 * @param code - Discount code (required if applying discount)
 * @returns Price calculation result
 */
export async function calculatePrice(
	plan: PlanType,
	currency: 'EUR' | 'USD',
	code?: string
): Promise<PriceCalculationResult> {
	// Validate plan type
	if (!isValidPlanType(plan)) {
		throw new Error(`Invalid plan type: ${plan}`)
	}

	const planInfo = PLAN_PRICING[plan]
	const originalPrice = currency === 'EUR' ? planInfo.price : planInfo.priceUsd

	// If no code provided, return original price
	if (!code || !code.trim()) {
		return {
			originalPrice,
			discountAmount: 0,
			finalPrice: originalPrice,
			currency: currency,
		}
	}

	// Get the active discount by code
	const discount = await getActiveDiscount(code)

	if (!discount) {
		// No discount found for this code
		return {
			originalPrice,
			discountAmount: 0,
			finalPrice: originalPrice,
			currency: currency,
		}
	}

	// Calculate discount amount
	const discountAmount = calculateDiscountAmount(originalPrice, discount)
	const finalPrice = Math.max(originalPrice - discountAmount, 0)

	return {
		originalPrice,
		discountAmount,
		finalPrice,
		currency: currency,
		discount: {
			id: discount.id,
			code: discount.code,
			type: discount.discountType,
			description: discount.description,
		},
	}
}

/**
 * Formats a price for Mollie (decimal string with 2 decimals)
 * @param price - The price in euros
 * @returns Formatted price string
 */
export function formatPriceForMollie(price: number): string {
	return price.toFixed(2)
}

/**
 * Validates discount code format
 * @param code - The discount code to validate
 * @returns True if valid, false otherwise
 */
export function isValidDiscountCode(code: string): boolean {
	// Discount codes should be uppercase alphanumeric, 3-20 characters
	const discountCodeRegex = /^[A-Z0-9]{3,20}$/
	return discountCodeRegex.test(code.toUpperCase().trim())
}


