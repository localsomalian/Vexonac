import { z } from 'zod'
import { publicProcedure } from '../../lib/trpc'
import { TRPCError } from '@trpc/server'
import { PlanType, calculatePrice } from '../../lib/payment-utils'

/**
 * Validate a discount code and return pricing details for a specific plan
 */
export const validateDiscount = publicProcedure
	.input(
		z.object({
			code: z.string().min(3).max(20),
			planId: z.enum(Object.values(PlanType) as [string, ...string[]]),
		})
	)
	.query(async ({ input }) => {
		try {
			const { code, planId } = input

			// Calculate price with discount
			const priceCalculation = await calculatePrice(
				planId as PlanType,
				'EUR',
				code.toUpperCase().trim()
			)

			// If no discount was found, return error
			if (!priceCalculation.discount) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Invalid or expired discount code',
				})
			}

			return {
				valid: true,
				originalPrice: priceCalculation.originalPrice,
				discountAmount: priceCalculation.discountAmount,
				finalPrice: priceCalculation.finalPrice,
				discount: {
					code: priceCalculation.discount.code,
					type: priceCalculation.discount.type,
					description: priceCalculation.discount.description,
				},
			}
		} catch (error) {
			if (error instanceof TRPCError) {
				throw error
			}

			console.error('Error validating discount:', error)
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to validate discount code',
			})
		}
	})

