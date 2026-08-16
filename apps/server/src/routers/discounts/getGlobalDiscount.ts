import { publicProcedure } from '../../lib/trpc'
import { TRPCError } from '@trpc/server'
import prisma from '../../../prisma'
import { DiscountType } from '@vexonac/database'

/**
 * Get active auto-apply discount that is automatically applied
 */
export const getGlobalDiscount = publicProcedure.query(async () => {
	try {
		const now = new Date()

		// Find the most recent active auto-apply discount
		const autoApplyDiscount = await prisma.discount.findFirst({
			where: {
				autoApply: true,
				isActive: true,
				OR: [
					{ expiresAt: null },
					{ expiresAt: { gt: now } },
				],
			},
			orderBy: {
				createdAt: 'desc',
			},
		})

		if (!autoApplyDiscount) {
			return null
		}

		return {
			id: autoApplyDiscount.id,
			code: autoApplyDiscount.code,
			description: autoApplyDiscount.description,
			discountType: autoApplyDiscount.discountType,
			discountAmount: autoApplyDiscount.discountAmount,
			discountPercentage: autoApplyDiscount.discountPercentage,
			expiresAt: autoApplyDiscount.expiresAt,
		}
	} catch (error) {
		console.error('Error fetching auto-apply discount:', error)
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: 'Failed to fetch auto-apply discount',
		})
	}
})


