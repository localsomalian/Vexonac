import { z } from 'zod'
import { publicProcedure, router } from '../../lib/trpc'
import { TRPCError } from '@trpc/server'
import {
	PlanType,
	PLAN_PRICING,
	calculatePrice,
	isValidDiscountCode,
} from '../../lib/payment-utils'

// NOWPayments API configuration
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1/invoice'

interface NOWPaymentsInvoiceRequest {
	price_amount: number
	price_currency: string
	order_id: string
	order_description: string
	ipn_callback_url: string
	success_url?: string
	cancel_url?: string
	is_fixed_rate?: boolean
	is_fee_paid_by_user?: boolean
}

interface NOWPaymentsInvoiceResponse {
	id: string
	token_id: string
	order_id: string
	order_description: string
	price_amount: string
	price_currency: string
	pay_currency: string | null
	ipn_callback_url: string
	invoice_url: string
	success_url: string
	cancel_url: string
	partially_paid_url?: string
	payout_currency?: string
	created_at: string
	updated_at: string
	is_fixed_rate: boolean
	is_fee_paid_by_user: boolean
}


export const cryptoRouter = router({
	createInvoice: publicProcedure
		.input(
			z.object({
				planId: z.enum(Object.values(PlanType) as [string, ...string[]]),
				customerEmail: z.string().email(),
				discountCode: z.string().optional(),
			})
		)
		.mutation(async ({ input }) => {
			try {
				if (!NOWPAYMENTS_API_KEY) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'NOWPayments API key not configured',
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
				const orderId = `WS-${planId.toUpperCase()}-${Date.now()}-${Buffer.from(customerEmail).toString('base64').replace(/[=+/]/g, '')}`
				
				// Keep order description simple since we're encoding email in order ID
				const orderDescription = `VexonAC ${plan.name} License Key`
				
				const invoiceData: NOWPaymentsInvoiceRequest = {
					price_amount: priceCalculation.finalPrice,
					price_currency: 'eur',
					order_id: orderId,
					order_description: orderDescription,
					ipn_callback_url: `https://api.vexonac.com/api/payments/webhook/nowpayments`,
					success_url: `https://vexonac.com/payment/success?email=${encodeURIComponent(customerEmail)}`,
					cancel_url: `https://vexonac.com/pricing`,
					is_fixed_rate: true,
					is_fee_paid_by_user: true,
				}

				// Create invoice with NOWPayments API
				const response = await fetch(NOWPAYMENTS_API_URL, {
					method: 'POST',
					headers: {
						'x-api-key': NOWPAYMENTS_API_KEY,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(invoiceData),
				})

				if (!response.ok) {
					const errorText = await response.text()
					console.error('âŒ NOWPayments API error:', {
						status: response.status,
						statusText: response.statusText,
						error: errorText,
					})
					
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: `Failed to create payment invoice: API returned ${response.status}: ${response.statusText}`,
					})
				}

				const invoiceResponse: NOWPaymentsInvoiceResponse = await response.json()

				// Fix mixed content issue by ensuring HTTPS
				let invoiceUrl = invoiceResponse.invoice_url
				console.log('ðŸ” Original NOWPayments invoice URL:', invoiceUrl)
				
				// Always force HTTPS for NOWPayments URLs to prevent mixed content issues
				if (invoiceUrl.includes('nowpayments.io') && !invoiceUrl.startsWith('https://')) {
					invoiceUrl = invoiceUrl.replace(/^https?:\/\//, 'https://')
					console.log('âœ… Forced HTTPS for NOWPayments URL:', invoiceUrl)
				} else if (invoiceUrl.startsWith('http://')) {
					invoiceUrl = invoiceUrl.replace('http://', 'https://')
					console.log('âœ… Fixed HTTP to HTTPS:', invoiceUrl)
				} else {
					console.log('âœ… URL already uses HTTPS')
				}

				// Return the invoice data
				return {
					success: true,
					invoice: {
						id: invoiceResponse.id,
						order_id: invoiceResponse.order_id,
						invoice_url: invoiceUrl,
						price_amount: invoiceResponse.price_amount,
						price_currency: invoiceResponse.price_currency,
						created_at: invoiceResponse.created_at,
					},
					priceDetails: {
						originalPrice: priceCalculation.originalPrice,
						discountAmount: priceCalculation.discountAmount,
						finalPrice: priceCalculation.finalPrice,
						discount: priceCalculation.discount,
					},
				}

			} catch (error) {
				console.error('ðŸ’¥ Error creating NOWPayments invoice:', error)
				
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
