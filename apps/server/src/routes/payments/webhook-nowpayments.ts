import type { Request, Response } from 'express'
import crypto from 'crypto'
import { generateAndCreateLicense, getPlanDisplayName, getPlanPrice, type PlanType } from '../../lib/license-generator'
import { sendLicenseEmail, sendPaymentFailedEmail } from '../../lib/email'
import { sendErrorLog } from '../../lib/discord'
import prisma from '../../../prisma'

// NOWPayments IPN Secret Key - should be stored in environment variables
const IPN_SECRET_KEY = process.env.NOWPAYMENTS_IPN_SECRET_KEY

interface NOWPaymentsWebhookData {
	payment_id: number
	parent_payment_id?: number
	invoice_id?: string | null
	payment_status: string
	pay_address: string
	payin_extra_id?: string | null
	price_amount: number
	price_currency: string
	pay_amount: number
	actually_paid: number
	actually_paid_at_fiat: number
	pay_currency: string
	order_id?: string | null
	order_description?: string | null
	purchase_id: string
	outcome_amount: number
	outcome_currency: string
	payment_extra_ids?: string | null
	fee?: {
		currency: string
		depositFee: number
		withdrawalFee: number
		serviceFee: number
	}
}

// Function to sort object keys recursively (as per NOWPayments documentation)
function sortObject(obj: any): any {
	return Object.keys(obj).sort().reduce(
		(result: any, key: string) => {
			result[key] = (obj[key] && typeof obj[key] === 'object') ? sortObject(obj[key]) : obj[key]
			return result
		},
		{}
	)
}

// Function to verify HMAC signature
function verifySignature(data: any, signature: string, secret: string): boolean {
	try {
		const sortedData = sortObject(data)
		const sortedJson = JSON.stringify(sortedData)
		
		const hmac = crypto.createHmac('sha512', secret)
		hmac.update(sortedJson)
		const calculatedSignature = hmac.digest('hex')
		
		return calculatedSignature === signature
	} catch (error) {
		console.error('Error verifying signature:', error)
		return false
	}
}

// Function to extract plan info from order ID
function extractOrderInfo(orderId: string | null): { planId: PlanType; customerEmail?: string } | null {
	if (!orderId) return null
	
	// Order format: WS-PLANTYPE-timestamp-base64email
	const parts = orderId.split('-')
	
	if (parts.length < 3 || parts[0] !== 'WS') {
		console.log('❌ Invalid order ID format:', { parts, length: parts.length, firstPart: parts[0] })
		return null
	}
	
	const planId = parts[1].toLowerCase() as PlanType
	
	// Extract email if present (4th part)
	let customerEmail: string | undefined
	if (parts.length >= 4 && parts[3] !== 'noemail') {
		try {
			// Decode base64 email
			customerEmail = Buffer.from(parts[3], 'base64').toString('utf-8')
		} catch (error) {
			console.log('❌ Failed to decode email from order ID:', { encodedEmail: parts[3], error })
		}
	}
	
	return {
		planId,
		customerEmail,
	}
}

export async function handleNOWPaymentsWebhook(req: Request, res: Response) {
	try {
		// Get the signature from headers
		const signature = req.headers['x-nowpayments-sig'] as string
		
		if (!signature) {
			console.error('❌ NOWPayments Webhook: No HMAC signature provided')
			return res.status(400).json({ error: 'No HMAC signature provided' })
		}

		if (!IPN_SECRET_KEY) {
			console.error('❌ NOWPayments Webhook: IPN secret key not configured')
			return res.status(500).json({ error: 'Server configuration error' })
		}

		// Parse the request body
		const webhookData: NOWPaymentsWebhookData = req.body

		// Verify the signature
		const isValidSignature = verifySignature(webhookData, signature, IPN_SECRET_KEY)
		
		if (!isValidSignature) {
			console.error('❌ NOWPayments Webhook: Invalid HMAC signature')
			console.log('🔍 Signature verification failed:')
			console.log('   - Received signature:', signature)
			console.log('   - Webhook data for verification:', JSON.stringify(sortObject(webhookData)))
			
			return res.status(401).json({ error: 'Invalid signature' })
		}

		// Extract order information
		const orderInfo = extractOrderInfo(webhookData.order_id ?? null)
		const customerEmail = orderInfo?.customerEmail
		
		// Handle different payment statuses
		switch (webhookData.payment_status) {
			case 'finished':				
				if (orderInfo && customerEmail) {
					try {
						// Use customer email from order ID
						const finalCustomerEmail = customerEmail
						
						// Generate redemption key (not direct license)
						const orderId: string = webhookData.order_id || `unknown-${webhookData.payment_id}`
						const licenseResult = await generateAndCreateLicense({
							planId: orderInfo.planId,
							customerEmail: finalCustomerEmail,
							paymentId: webhookData.payment_id.toString(),
							type: 'crypto',
						})
						
						if (licenseResult.success) {
							if (licenseResult.isService) {
								const isDuplicate = licenseResult.isDuplicate
								
								if (!isDuplicate) {
									const emailResult = await sendLicenseEmail({
										email: finalCustomerEmail,
										licenseKey: null,
										planName: getPlanDisplayName(orderInfo.planId),
										planPrice: getPlanPrice(orderInfo.planId),
										expiresAt: null,
										isService: true,
									})
									
									if (!emailResult.success) {
										console.error('❌ Failed to send premium service confirmation email:', emailResult.error)
									}
								}
							} else if (licenseResult.needsRedemption && licenseResult.licenseKey) {
								const isDuplicate = licenseResult.isDuplicate
								
								if (!isDuplicate) {
									const emailResult = await sendLicenseEmail({
										email: finalCustomerEmail,
										licenseKey: licenseResult.licenseKey,
										planName: getPlanDisplayName(orderInfo.planId),
										planPrice: getPlanPrice(orderInfo.planId),
										expiresAt: licenseResult.expiresAt,
										isService: false,
									})
									
									if (!emailResult.success) {
										console.error('❌ Failed to send redemption key email:', emailResult.error)
									}
								}
							} else {
								console.error('❌ Unexpected license result type:', licenseResult)
							}
						} else {
							console.error('❌ Failed to generate license or service confirmation')
						}
					} catch (error) {
						console.error('💥 Error processing successful payment:', error)
					}
				} else {
					console.error('❌ Missing required information for license generation:')
					console.error('   - Order Info:', orderInfo ? 'Found' : 'Missing')
					console.error('   - Customer Email:', customerEmail ? 'Found' : 'Missing')
					console.error('   - Order ID:', webhookData.order_id)
					console.error('   - Order Description:', webhookData.order_description)
				}
				break

			case 'partially_paid':
				console.log('⚠️ Payment partially paid')
				// For now, we don't generate licenses for partial payments
				// You might want to implement a partial payment handling system
				break
				
			case 'failed':
				console.log('❌ Payment failed')
				
				if (orderInfo && customerEmail) {
					try {
						const orderId = webhookData.order_id || 'unknown'
						
						await sendPaymentFailedEmail(
							customerEmail,
							orderId
						)
						console.log('📧 Payment failed email sent to:', customerEmail)
					} catch (error) {
						console.error('❌ Failed to send payment failed email:', error)
					}
				}
				break
				
			case 'refunded':
				console.log('🔄 Payment refunded:', webhookData.payment_id)

				if (orderInfo && customerEmail) {
					const generatedBy = `payment:crypto:${webhookData.payment_id}:${customerEmail}`
					try {
						const deleted = await prisma.redemptionKey.deleteMany({ where: { generatedBy } })

						if (deleted.count > 0) {
							console.log(`✅ Revoked ${deleted.count} unredeemed key(s) for payment ${webhookData.payment_id}`)
						} else {
							// Key already redeemed — license is live, needs manual admin ban
							console.error(`⚠️ Payment ${webhookData.payment_id} refunded but key already redeemed — manual action needed for ${customerEmail}`)
							await sendErrorLog({
								message: `NOWPayments refund: license already redeemed — manual ban required`,
								path: '/api/payments/webhook/nowpayments',
								method: 'POST',
								timestamp: new Date(),
								environment: process.env.NODE_ENV || 'production',
								requestBody: {
									payment_id: webhookData.payment_id,
									order_id: webhookData.order_id,
									customer_email: customerEmail,
									plan: orderInfo.planId,
									action: 'Go to admin panel → find license by email → ban it',
								},
							})
						}
					} catch (error) {
						console.error('❌ Failed to process refund revocation:', error)
					}
				}
				break
				
			case 'expired':
				console.log('⏰ Payment expired')
				// Payment window expired, no action needed
				break
				
			default:
				console.log(`ℹ️ Payment status: ${webhookData.payment_status}`)
				break
		}

		// Return success response
		return res.json({ 
			status: 'success',
			message: 'Webhook processed successfully',
			payment_id: webhookData.payment_id,
			payment_status: webhookData.payment_status
		})

	} catch (error) {
		console.error('💥 NOWPayments Webhook Error:', error)
		
		return res.status(500).json({
			error: 'Internal server error',
			message: error instanceof Error ? error.message : 'Unknown error'
		})
	}
} 