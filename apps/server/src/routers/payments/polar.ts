import { z } from 'zod'
import { publicProcedure, router } from '../../lib/trpc'
import { TRPCError } from '@trpc/server'
import { randomUUID } from 'crypto'
import prisma from '../../../prisma'
import {
	PlanType,
	PLAN_PRICING,
	calculatePrice,
	formatPriceForMollie,
	isValidDiscountCode,
} from '../../lib/payment-utils'
import { Polar } from "@polar-sh/sdk";

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN ?? ""

export const polarRouter = router({
	createPayment: publicProcedure
		.input(
			z.object({
				planId: z.enum(Object.values(PlanType) as [string, ...string[]]),
				customerEmail: z.string().email(),
				discountCode: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				if (!POLAR_ACCESS_TOKEN) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'Polar access token not configured',
					})
				}

				const { planId, customerEmail, discountCode } = input

				// Validate discount code format if provided
				if (discountCode && !isValidDiscountCode(discountCode)) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Invalid discount code format',
					})
				}

				// Calculate price with discount
				const priceCalculation = await calculatePrice(
					planId as PlanType,
					'USD',
					discountCode
				)

				const plan = PLAN_PRICING[planId as PlanType]

				// Generate unique payment ID for metadata
				const paymentReference = randomUUID()

				const polar = new Polar({
					accessToken: POLAR_ACCESS_TOKEN,
				});

				// Build metadata object, excluding empty string values
				const metadata: Record<string, string | number | boolean> = {
					customerEmail,
					planId,
					paymentReference,
					originalPrice: priceCalculation.originalPrice,
					discountAmount: priceCalculation.discountAmount,
					finalPrice: priceCalculation.finalPrice,
				}

				// Only add optional fields if they have values
				if (ctx.session?.user?.discordId) {
					metadata.discordId = ctx.session.user.discordId
				}
				if (priceCalculation.discount?.code) {
					metadata.discountCode = priceCalculation.discount.code
				}
				if (priceCalculation.discount?.id) {
					metadata.discountId = priceCalculation.discount.id
				}

				const checkout = await polar.checkouts.create({
					products: [plan.polarProductId],
					prices: {
						[plan.polarProductId]: [
							{
								amountType: 'fixed',
								priceAmount: Math.round(priceCalculation.finalPrice * 100),
								priceCurrency: 'usd',
							},
						]
					},
					requireBillingAddress: false,
					externalCustomerId: ctx.session?.user?.discordId ?? undefined,
					customerEmail: customerEmail,
					embedOrigin: "https://vexonac.com",
					successUrl: `https://vexonac.com/payment/success?email=${encodeURIComponent(customerEmail)}`,
					metadata,
				});

				if (!checkout || checkout.status !== "open") {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'Failed to create payment',
					})
				}

				console.log('âœ… Polar Checkout created:', {
					checkout_id: checkout.id,
					checkout_url: checkout.url,
					status: checkout.status,
				})

				// Store payment information in database for webhook processing
				await prisma.pendingPayment.create({
					data: {
						orderId: checkout.id,
						planId,
						customerEmail,
						amount: priceCalculation.finalPrice,
						currency: priceCalculation.currency,
					},
				})

				console.log('âœ… Payment information stored in database for payment:', checkout.id)

				return {
					success: true,
					payment: {
						id: checkout.id,
						checkout_url: checkout.url,
						amount: priceCalculation.finalPrice,
						currency: priceCalculation.currency,
						status: checkout.status,
						created_at: checkout.createdAt,
					},
					priceDetails: {
						originalPrice: priceCalculation.originalPrice,
						discountAmount: priceCalculation.discountAmount,
						finalPrice: priceCalculation.finalPrice,
						discount: priceCalculation.discount,
					},
				}

			} catch (error) {
				console.error('ðŸ’¥ Error creating Polar checkout:', error)

				if (error instanceof TRPCError) {
					throw error
				}

				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: error instanceof Error ? error.message : 'Unknown error',
				})
			}
		}),
}) 
