import { z } from 'zod'
import { publicProcedure, router } from '../../lib/trpc'
import { TRPCError } from '@trpc/server'
import { randomUUID } from 'crypto'
import prisma from '../../../prisma'

// Square API configuration
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID
const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'sandbox' // 'sandbox' or 'production'

// Square API URLs
const SQUARE_BASE_URL = SQUARE_ENVIRONMENT === 'production' 
	? 'https://connect.squareup.com'
	: 'https://connect.squareupsandbox.com'

interface SquarePaymentLinkRequest {
	idempotency_key: string
	quick_pay: {
		name: string
		price_money: {
			amount: number // Amount in cents
			currency: string
		}
		location_id: string
	}
	pre_populated_data?: {
		buyer_email?: string
		buyer_phone_number?: string
		buyer_address?: any
	}
	checkout_options?: {
		allow_tipping?: boolean
		ask_for_shipping_address?: boolean
		redirect_url?: string
		merchant_support_email?: string
		accepted_payment_methods?: {
			apple_pay?: boolean
			google_pay?: boolean
			cash_app_pay?: boolean
			afterpay_clearpay?: boolean
		}
		custom_fields?: Array<{
			title: string
			uid?: string
		}>
		enable_coupon?: boolean
		enable_loyalty?: boolean
	}
}

interface SquarePaymentLinkResponse {
	payment_link: {
		id: string
		version: number
		description?: string
		order_id: string
		url: string
		created_at: string
		updated_at?: string
	}
	related_resources?: {
		orders?: Array<{
			id: string
			location_id: string
			state: string
			version: number
			total_money: {
				amount: number
				currency: string
			}
			created_at: string
			updated_at: string
		}>
	}
}

// Plan pricing configuration (amount in cents)
const planPricing: { [key: string]: { price: number; name: string } } = {
	monthly: { price: 5000, name: 'Monthly' }, // â‚¬50.00
	quarterly: { price: 10000, name: 'Quarterly' }, // â‚¬100.00
	lifetime: { price: 25000, name: 'Lifetime' }, // â‚¬250.00
	premium: { price: 6000, name: 'Premium' }, // â‚¬60.00
}

export const squareRouter = router({
	createPaymentLink: publicProcedure
		.input(
			z.object({
				planId: z.enum(['monthly', 'quarterly', 'lifetime', 'premium']),
				planName: z.string(),
				planPrice: z.string(),
				customerEmail: z.string().email(),
			})
		)
		.mutation(async ({ input }) => {
			try {
				if (!SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'Square API credentials not configured',
					})
				}

				const { planId, planName, planPrice, customerEmail } = input

				if (!planPricing[planId]) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'Invalid plan ID',
					})
				}

				const plan = planPricing[planId]
				
				// Generate idempotency key
				const idempotencyKey = randomUUID()
				
				const paymentLinkData: SquarePaymentLinkRequest = {
					idempotency_key: idempotencyKey,
					quick_pay: {
						name: `VexonAC ${plan.name} License`,
						price_money: {
							amount: plan.price,
							currency: "EUR",
						},
						location_id: SQUARE_LOCATION_ID,
					},
					pre_populated_data: {
						buyer_email: customerEmail,
					},
					checkout_options: {
						allow_tipping: true,
						ask_for_shipping_address: false,
						redirect_url: `https://vexonac.com/payment/success?email=${encodeURIComponent(customerEmail)}`,
						merchant_support_email: 'contact@vexonac.com',
						accepted_payment_methods: {
							apple_pay: true,
							google_pay: true,
							cash_app_pay: true,
							afterpay_clearpay: false,
						},
						enable_coupon: true,
						enable_loyalty: false,
					},
				}

				// Create payment link with Square API
				const response = await fetch(`${SQUARE_BASE_URL}/v2/online-checkout/payment-links`, {
					method: 'POST',
					headers: {
						'Square-Version': '2025-06-18',
						'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(paymentLinkData),
				})

				if (!response.ok) {
					const errorText = await response.text()
					console.error('âŒ Square API error:', {
						status: response.status,
						statusText: response.statusText,
						error: errorText,
					})
					
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: `Failed to create payment link: API returned ${response.status}: ${response.statusText}`,
					})
				}

				const paymentLinkResponse: SquarePaymentLinkResponse = await response.json()

				console.log('âœ… Square Payment Link created:', {
					payment_link_id: paymentLinkResponse.payment_link.id,
					order_id: paymentLinkResponse.payment_link.order_id,
					url: paymentLinkResponse.payment_link.url,
				})

				// Store payment information in database for webhook processing
				await prisma.pendingPayment.create({
					data: {
						orderId: paymentLinkResponse.payment_link.order_id,
						planId,
						customerEmail,
						amount: Math.floor(plan.price/100),
						currency: 'EUR',
					},
				})

				console.log('âœ… Payment information stored in database for order:', paymentLinkResponse.payment_link.order_id)
				
				return {
					success: true,
					payment_link: {
						id: paymentLinkResponse.payment_link.id,
						order_id: paymentLinkResponse.payment_link.order_id,
						url: paymentLinkResponse.payment_link.url,
						amount: plan.price,
						currency: "EUR",
						created_at: paymentLinkResponse.payment_link.created_at,
					},
				}

			} catch (error) {
				console.error('ðŸ’¥ Error creating Square payment link:', error)
				
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

