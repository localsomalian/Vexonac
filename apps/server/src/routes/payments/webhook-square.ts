import type { Request, Response } from 'express'
import crypto from 'crypto'
import { generateAndCreateLicense, getPlanDisplayName, getPlanPrice, type PlanType } from '../../lib/license-generator'
import { sendLicenseEmail, sendPaymentFailedEmail } from '../../lib/email'
import { sendErrorLog } from '../../lib/discord'
import prisma from '../../../prisma'

// Square Webhook Signature Key - should be stored in environment variables
const SQUARE_WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY as string
const SQUARE_WEBHOOK_URL = process.env.SQUARE_WEBHOOK_URL as string

interface SquareWebhookEvent {
	merchant_id: string
	type: string
	event_id: string
	created_at: string
	data: {
		type: string
		id: string
		object?: {
			payment?: {
				id: string
				created_at: string
				updated_at: string
				amount_money: {
					amount: number
					currency: string
				}
				status: string
				order_id?: string
				buyer_email_address?: string
				receipt_number: string
				receipt_url: string
			}
			refund?: {
				id: string
				status: string
				payment_id: string
				order_id?: string
				amount_money: {
					amount: number
					currency: string
				}
			}
		}
	}
}

function getSubtleCrypto(): SubtleCrypto | undefined {
  if (typeof window !== 'undefined' && window?.crypto?.subtle) {
      return window.crypto.subtle;
  }
  return undefined;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof btoa === 'function') {
      // Browser environment
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
  } else {
      // Node environment
      return Buffer.from(buffer).toString('base64');
  }
}

async function createHmacOverride(payload: string, key: string): Promise<string> {
  try {
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', key);
      hmac.update(payload, 'utf8');
      return hmac.digest('base64');
  }
  catch (err) {
      // Not in Node environmnet; use subtle crypto.
  }
  const subtleCrypto = getSubtleCrypto();
  if (!subtleCrypto) {
      throw new Error('No crypto implementation available');
  }
  const encoder = new TextEncoder();
  const cryptoKey = await subtleCrypto.importKey(
      'raw',
      encoder.encode(key),
      {
          name: 'HMAC',
          hash: { name: 'SHA-256' }
      },
      false,
      ['sign']
  );
  const signatureBuffer = await subtleCrypto.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(payload)
  );
  return arrayBufferToBase64(signatureBuffer);
}

async function isFromSquare(signature: string, body: string) {
  return await verifySquareSignature(
    body,
    signature,
    SQUARE_WEBHOOK_SIGNATURE_KEY,
    SQUARE_WEBHOOK_URL
  );
}

// Function to fetch complete order details from Square API


// Function to verify Square webhook signature
async function verifySquareSignature(requestBody: string, signatureHeader: string, signatureKey: string, notificationUrl: string): Promise<boolean> {
	if (requestBody == null) {
    return false;
  }
  if (signatureKey == null || signatureKey.length == 0) {
      throw new Error('signatureKey is null or empty');
  }
  if (notificationUrl == null || notificationUrl.length == 0) {
      throw new Error('notificationUrl is null or empty');
  }
  try {
      const payload = notificationUrl + requestBody;
      const hashBase64 = await createHmacOverride(payload, signatureKey);
      return hashBase64 === signatureHeader;
  } catch (error) {
      throw new Error(`Failed to validate webhook signature: ${error instanceof Error ? error.message : String(error)}`);
  }
}



export async function handleSquareWebhook(req: Request, res: Response) {
	try {
		const signature = req.headers['x-square-hmacsha256-signature'] as string
		const rawBody = JSON.stringify(req.body)
		const isValidSignature = await isFromSquare(signature, rawBody)
		
		if (!isValidSignature) {
			return res.status(401).json({ error: 'Invalid signature' })
		}

		// Parse the webhook event
		const webhookEvent: SquareWebhookEvent = req.body

		// Handle different event types
		switch (webhookEvent.type) {
			case 'payment.updated':
				await handlePaymentUpdated(webhookEvent)
				break
			case 'refund.created':
			case 'refund.updated':
				await handleRefundEvent(webhookEvent)
				break
			default:
				console.log(`ℹ️ Unhandled Square webhook event type: ${webhookEvent.type}`)
				break
		}

		// Always respond with 200 to acknowledge receipt
		return res.status(200).json({ success: true })

	} catch (error) {
		console.error('💥 Error processing Square webhook:', error)
		return res.status(500).json({ error: 'Internal server error' })
	}
}

async function handlePaymentUpdated(event: SquareWebhookEvent) {
	try {
		const payment = event.data.object?.payment
		
		if (!payment) {
			console.error('❌ No payment object in payment.updated event')
			return
		}

		// Handle successful payments
		if (payment.status === 'COMPLETED') {
			await processSuccessfulPayment(payment)
		} else if (payment.status === 'FAILED' || payment.status === 'CANCELED') {
			await processFailedPayment(payment)
		}

	} catch (error) {
		console.error('💥 Error handling payment updated:', error)
	}
}

async function processSuccessfulPayment(payment: any) {
	try {
		console.log('🎉 Processing successful Square payment')

		if (!payment.order_id) {
			console.error('❌ No order_id in payment object')
			return
		}

		// Fetch payment data from database using order_id
		const pendingPayment = await prisma.pendingPayment.findUnique({
			where: {
				orderId: payment.order_id,
			},
		})

		if (!pendingPayment) {
			console.error('❌ No pending payment found for order_id:', payment.order_id)
			return
		}

		if (pendingPayment.isCompleted) {
			console.log('ℹ️ Payment already processed for order_id:', payment.order_id)
			return
		}

		console.log('✅ Found pending payment:', {
			orderId: pendingPayment.orderId,
			planId: pendingPayment.planId,
			customerEmail: pendingPayment.customerEmail,
			amount: pendingPayment.amount,
		})
		
		const licenseResult = await generateAndCreateLicense({
			planId: pendingPayment.planId as PlanType,
			customerEmail: pendingPayment.customerEmail,
			paymentId: payment.id,
			type: 'card',
		})
		
		if (licenseResult.success) {
			// Mark payment as completed
			await prisma.pendingPayment.update({
				where: {
					orderId: payment.order_id,
				},
				data: {
					isCompleted: true,
          deliveredLicenseKey: licenseResult.licenseKey,
				},
			})

			if (licenseResult.isService) {
				// Premium service
				const emailResult = await sendLicenseEmail({
					email: pendingPayment.customerEmail,
					licenseKey: null,
					planName: getPlanDisplayName(pendingPayment.planId as PlanType),
					planPrice: getPlanPrice(pendingPayment.planId as PlanType),
					expiresAt: null,
					isService: true,
				})
				
				if (!emailResult.success) {
					console.error('❌ Failed to send premium service confirmation email:', emailResult.error)
				} else {
					console.log('✅ Premium service confirmation email sent successfully')
				}
			} else if (licenseResult.needsRedemption && licenseResult.licenseKey) {
				// Regular license that needs redemption
				const emailResult = await sendLicenseEmail({
					email: pendingPayment.customerEmail,
					licenseKey: licenseResult.licenseKey,
					planName: getPlanDisplayName(pendingPayment.planId as PlanType),
					planPrice: getPlanPrice(pendingPayment.planId as PlanType),
					expiresAt: licenseResult.expiresAt,
					isService: false,
				})
				
				if (!emailResult.success) {
					console.error('❌ Failed to send license key email:', emailResult.error)
				} else {
					console.log('✅ License key email sent successfully')
				}
			} else {
				console.error('❌ Unexpected license result type:', licenseResult)
			}
		} else {
			console.error('❌ Failed to generate license or service confirmation')
		}

	} catch (error) {
		console.error('💥 Error processing successful Square payment:', error)
	}
}

async function handleRefundEvent(event: SquareWebhookEvent) {
	try {
		const refund = event.data.object?.refund
		if (!refund) {
			console.error('❌ No refund object in Square refund event')
			return
		}

		// Only act on completed refunds
		if (refund.status !== 'COMPLETED') return

		const orderId = refund.order_id
		if (!orderId) {
			console.error('❌ No order_id in Square refund event')
			return
		}

		const pendingPayment = await prisma.pendingPayment.findUnique({ where: { orderId } })

		if (!pendingPayment?.deliveredLicenseKey) {
			console.error(`⚠️ Square refund: no deliveredLicenseKey for order ${orderId}`)
			await sendErrorLog({
				message: `Square refund: no license key found — manual action needed`,
				path: '/api/payments/webhook/square',
				method: 'POST',
				timestamp: new Date(),
				environment: process.env.NODE_ENV || 'production',
				requestBody: {
					refund_id: refund.id,
					order_id: orderId,
					customer_email: pendingPayment?.customerEmail,
					action: 'Manually ban license in admin panel',
				},
			})
			return
		}

		const { deliveredLicenseKey } = pendingPayment

		// Delete unredeemed key if it still exists
		const deleted = await prisma.redemptionKey.deleteMany({ where: { licenseKey: deliveredLicenseKey } })

		if (deleted.count > 0) {
			console.log(`✅ Deleted unredeemed key for refunded Square order ${orderId}`)
			return
		}

		// Key was redeemed — ban the active license directly
		const banned = await prisma.license.updateMany({
			where: { licenseKey: deliveredLicenseKey },
			data: { isBanned: true, banReason: 'Payment refunded' },
		})

		if (banned.count > 0) {
			console.log(`✅ Banned license for refunded Square order ${orderId}`)
		} else {
			console.error(`⚠️ Square refund: license not found for key ${deliveredLicenseKey}`)
			await sendErrorLog({
				message: `Square refund: license not found — manual action needed`,
				path: '/api/payments/webhook/square',
				method: 'POST',
				timestamp: new Date(),
				environment: process.env.NODE_ENV || 'production',
				requestBody: {
					order_id: orderId,
					license_key: deliveredLicenseKey,
					action: 'Manually ban license in admin panel',
				},
			})
		}
	} catch (error) {
		console.error('💥 Error handling Square refund:', error)
	}
}

async function processFailedPayment(payment: any) {
	try {
		console.log('❌ Processing failed Square payment')

		if (!payment.order_id) {
			console.error('❌ No order_id in payment object')
			return
		}

		// Fetch payment data from database using order_id
		const pendingPayment = await prisma.pendingPayment.findUnique({
			where: {
				orderId: payment.order_id,
			},
		})

		if (!pendingPayment) {
			console.error('❌ No pending payment found for order_id:', payment.order_id)
			return
		}

		// Send failed payment email
		await sendPaymentFailedEmail(
			pendingPayment.customerEmail,
			payment.id || 'unknown'
		)

		console.log('✅ Failed payment email sent to:', pendingPayment.customerEmail)

	} catch (error) {
		console.error('💥 Error processing failed Square payment:', error)
	}
} 