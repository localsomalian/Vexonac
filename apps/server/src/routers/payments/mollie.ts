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

const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY
const MOLLIE_BASE_URL = 'https://api.mollie.com/v2'

interface MolliePaymentRequest {
	amount: {
		currency: string
		value: string // Amount in decimal format (e.g., "10.00")
	}
	description: string
	redirectUrl: string
	webhookUrl?: string
	cancelUrl: string
	billingAddress: {
		email: string
	},
	shippingAddress: {
		email: string
	},
	metadata?: Record<string, any>
	locale: string | 'en_US'
}

interface MolliePaymentResponse {
	resource: string
	id: string
	mode: 'live' | 'test'
	createdAt: string
	amount: {
		value: string
		currency: string
	}
	description: string
	method: string | null
	metadata: Record<string, any>
	status: string
	isCancelable: boolean
	expiresAt: string
	details: any
	profileId: string
	sequenceType: string
	redirectUrl: string
	cancelUrl: string
	webhookUrl: string | null
	billingAddress: {
		email: string
	},
	shippingAddress: {
		email: string
	},
	_links: {
		self: {
			href: string
			type: string
		}
		checkout: {
			href: string
			type: string
		}
		dashboard?: {
			href: string
			type: string
		}
	}
}


export const mollieRouter = router({
	createPayment: publicProcedure
		.input(
			z.object({
				planId: z.enum(Object.values(PlanType) as [string, ...string[]]),
				customerEmail: z.string().email(),
				discountCode: z.string().optional(),
			})
		)
		.mutation(async ({ input }) => {
			try {
				if (!MOLLIE_API_KEY) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'Mollie API key not configured',
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
					'EUR',
					discountCode
				)

				const plan = PLAN_PRICING[planId as PlanType]
				
				// Generate unique payment ID for metadata
				const paymentReference = randomUUID()
				
				// Format the final price for Mollie
				const formattedPrice = formatPriceForMollie(priceCalculation.finalPrice)
				
				const paymentData: MolliePaymentRequest = {
					amount: {
						currency: 'EUR',
						value: formattedPrice,
					},
					description: `VexonAC ${plan.name} License`,
					redirectUrl: `https://vexonac.com/payment/success?email=${encodeURIComponent(customerEmail)}`,
					//webhookUrl: `https://b9592b8cbf89.ngrok-free.app/api/payments/webhook/mollie`,
					webhookUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/payments/webhook/mollie`,
					cancelUrl: `https://vexonac.com`,
					billingAddress: {
						email: customerEmail,
					},
					shippingAddress: {
						email: customerEmail,
					},
					metadata: {
						planId,
						customerEmail,
						paymentReference,
						discountCode: priceCalculation.discount?.code,
						discountId: priceCalculation.discount?.id,
						originalPrice: priceCalculation.originalPrice,
						discountAmount: priceCalculation.discountAmount,
						finalPrice: priceCalculation.finalPrice,
					},
					locale: 'en_US',
				}

				// Create payment with Mollie API
				const response = await fetch(`${MOLLIE_BASE_URL}/payments`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${MOLLIE_API_KEY}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(paymentData),
				})

				if (!response.ok) {
					const errorText = await response.text()
					console.error('âŒ Mollie API error:', {
						status: response.status,
						statusText: response.statusText,
						error: errorText,
					})
					
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: `Failed to create payment: API returned ${response.status}: ${response.statusText}`,
					})
				}

				const paymentResponse: MolliePaymentResponse = await response.json()

				console.log('âœ… Mollie Payment created:', {
					payment_id: paymentResponse.id,
					checkout_url: paymentResponse._links.checkout.href,
					status: paymentResponse.status,
				})

				// Store payment information in database for webhook processing
				await prisma.pendingPayment.create({
					data: {
						orderId: paymentResponse.id,
						planId,
						customerEmail,
						amount: priceCalculation.finalPrice,
						currency: 'EUR',
					},
				})

				console.log('âœ… Payment information stored in database for payment:', paymentResponse.id)
				
				return {
					success: true,
					payment: {
						id: paymentResponse.id,
						checkout_url: paymentResponse._links.checkout.href,
						amount: formattedPrice,
						currency: 'EUR',
						status: paymentResponse.status,
						created_at: paymentResponse.createdAt,
					},
					priceDetails: {
						originalPrice: priceCalculation.originalPrice,
						discountAmount: priceCalculation.discountAmount,
						finalPrice: priceCalculation.finalPrice,
						discount: priceCalculation.discount,
					},
				}

			} catch (error) {
				console.error('ðŸ’¥ Error creating Mollie payment:', error)
				
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
