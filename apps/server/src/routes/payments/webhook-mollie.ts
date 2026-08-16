import type { Request, Response } from 'express'
import prisma from '../../../prisma'
import { sendLicenseEmail, sendPaymentFailedEmail } from '../../lib/email'
import { generateAndCreateLicense, getPlanDisplayName, getPlanPrice } from '@/lib/license-generator'
import { sendErrorLog } from '../../lib/discord'
import crypto from 'crypto'

// Mollie webhook event types
interface MollieWebhookData {
    id: string
    mode: 'live' | 'test'
    resource: string
}

interface MolliePaymentDetails {
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
    metadata: {
        planId?: string
        customerEmail?: string
        paymentReference?: string
    }
    status: string
    isCancelable: boolean
    expiresAt: string
    details: any
    profileId: string
    sequenceType: string
    redirectUrl: string
    webhookUrl: string | null
    _links: {
        self: {
            href: string
            type: string
        }
        checkout?: {
            href: string
            type: string
        }
        dashboard?: {
            href: string
            type: string
        }
    }
}

type PlanType = 'monthly' | 'quarterly' | 'lifetime' | 'premium'

const SHARED_SECRET = process.env.MOLLIE_WEBHOOK_SECRET as string;

async function fetchMolliePayment(paymentId: string): Promise<MolliePaymentDetails | null> {
    try {
        const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY
        if (!MOLLIE_API_KEY) {
            console.error('❌ Mollie API key not configured')
            return null
        }

        const response = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MOLLIE_API_KEY}`,
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            console.error('❌ Failed to fetch Mollie payment:', response.status, response.statusText)
            return null
        }

        const paymentDetails: MolliePaymentDetails = await response.json()
        return paymentDetails
    } catch (error) {
        console.error('❌ Error fetching Mollie payment:', error)
        return null
    }
}

export async function handleMollieWebhook(req: Request, res: Response) {
    try {
        const userAgent = req.headers['user-agent'] as string;

        if (!userAgent.includes('Mollie HTTP')) {
            console.error('❌ Mollie Webhook: No signature provided')
            return res.status(400).json({ error: 'No signature provided' })
        }

        if (!userAgent.includes('Mollie HTTP')) {
            console.error('❌ Mollie Webhook: Invalid User Agent')
            return res.status(403).json({ error: 'Invalid Headers 1' })
        }

        const bodyBuffer = req.body as Buffer;
        const bodyString = bodyBuffer.toString('utf8');
        const paymentId = new URLSearchParams(bodyString).get('id');
    
        if (!paymentId) {
            console.error('❌ Mollie Webhook: No payment ID provided')
            return res.status(400).json({ error: 'No payment ID provided' })
        }

        const paymentDetails = await fetchMolliePayment(paymentId)

        if (!paymentDetails) {
            console.error('❌ Failed to fetch payment details for:', paymentId)
            return res.status(400).json({ error: 'Failed to fetch payment details' })
        }

        // Handle different payment statuses
        switch (paymentDetails.status) {
            case 'paid':
                await processSuccessfulPayment(paymentDetails)
                break
            case 'failed':
                await processFailedPayment(paymentDetails)
                break
            case 'canceled':
                await processFailedPayment(paymentDetails)
                break
            case 'expired':
                await processFailedPayment(paymentDetails)
                break
            case 'refunded':
            case 'chargebackCreated':
                await processRefundedPayment(paymentDetails)
                break
            case 'open':
            case 'pending':
                console.log(`ℹ️ Mollie payment ${paymentDetails.id} is still pending`)
                break
            default:
                console.log(`ℹ️ Unhandled Mollie payment status: ${paymentDetails.status}`)
                break
        }

        // Always respond with 200 to acknowledge receipt
        return res.status(200).json({ success: true })

    } catch (error) {
        console.error('💥 Error processing Mollie webhook:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

async function processSuccessfulPayment(payment: MolliePaymentDetails) {
    try {
        console.log('✅ Processing successful Mollie payment:', payment.id)

        const { planId, customerEmail } = payment.metadata

        if (!planId || !customerEmail) {
            console.error('❌ Missing metadata in payment:', payment.id)
            return
        }

        // Validate plan ID
        const validPlanIds: PlanType[] = ['monthly', 'quarterly', 'lifetime', 'premium']
        if (!validPlanIds.includes(planId as PlanType)) {
            console.error('❌ Invalid plan ID:', planId)
            return
        }

        // Check if this payment was already processed
        const pendingPayment = await prisma.pendingPayment.findUnique({
            where: { orderId: payment.id, isCompleted: false }
        })

        if (!pendingPayment) {
            console.log('⚠️ No pending payment found for order_id:', payment.id)
            return;
        }

        if (pendingPayment.isCompleted) {
            console.log('⚠️ Payment already processed for order_id:', payment.id)
            return
        }

        const licenseResult = await generateAndCreateLicense({
            planId: pendingPayment.planId as PlanType,
            customerEmail: pendingPayment.customerEmail,
            paymentId: payment.id,
            type: 'card',
        })

        // Send license key email
        try {
            if (licenseResult.success) {
                // Mark payment as completed
                await prisma.pendingPayment.update({
                    where: {
                        orderId: payment.id,
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
        } catch (emailError) {
            console.error('❌ Failed to send license key email:', emailError)
            // Don't fail the webhook processing if email fails
        }

        console.log('✅ Mollie payment processed successfully:', payment.id)

    } catch (error) {
        console.error('💥 Error processing successful Mollie payment:', error)
    }
}

async function processRefundedPayment(payment: MolliePaymentDetails) {
    try {
        console.log('🔄 Processing Mollie refund/chargeback:', payment.id)

        const pendingPayment = await prisma.pendingPayment.findUnique({
            where: { orderId: payment.id }
        })

        if (!pendingPayment?.deliveredLicenseKey) {
            console.error(`⚠️ Mollie refund: no deliveredLicenseKey for payment ${payment.id}`)
            await sendErrorLog({
                message: `Mollie refund: no license key found — manual action needed`,
                path: '/api/payments/webhook/mollie',
                method: 'POST',
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'production',
                requestBody: {
                    payment_id: payment.id,
                    customer_email: pendingPayment?.customerEmail,
                    status: payment.status,
                    action: 'Manually ban license in admin panel',
                },
            })
            return
        }

        const { deliveredLicenseKey } = pendingPayment

        // Delete unredeemed key if it still exists
        const deleted = await prisma.redemptionKey.deleteMany({ where: { licenseKey: deliveredLicenseKey } })

        if (deleted.count > 0) {
            console.log(`✅ Deleted unredeemed key for refunded Mollie payment ${payment.id}`)
            return
        }

        // Key was redeemed — ban the active license directly
        const banned = await prisma.license.updateMany({
            where: { licenseKey: deliveredLicenseKey },
            data: { isBanned: true, banReason: 'Payment refunded' },
        })

        if (banned.count > 0) {
            console.log(`✅ Banned license for refunded Mollie payment ${payment.id}`)
        } else {
            console.error(`⚠️ Mollie refund: license not found for key ${deliveredLicenseKey} — manual action needed`)
            await sendErrorLog({
                message: `Mollie refund: license not found — manual action needed`,
                path: '/api/payments/webhook/mollie',
                method: 'POST',
                timestamp: new Date(),
                environment: process.env.NODE_ENV || 'production',
                requestBody: {
                    payment_id: payment.id,
                    license_key: deliveredLicenseKey,
                    action: 'Manually ban license in admin panel',
                },
            })
        }
    } catch (error) {
        console.error('💥 Error processing Mollie refund:', error)
    }
}

async function processFailedPayment(payment: MolliePaymentDetails) {
    try {
        console.log('❌ Processing failed Mollie payment:', payment.id)

        const pendingPayment = await prisma.pendingPayment.findUnique({
            where: {
                orderId: payment.id,
            },
        })

        if (!pendingPayment) {
            console.error('❌ No pending payment found for order_id:', payment.id)
            return
        }

        // Send failed payment email
        await sendPaymentFailedEmail(
            pendingPayment.customerEmail,
            payment.id || 'unknown'
        )

        console.log('✅ Failed payment email sent to:', pendingPayment.customerEmail)

    } catch (error) {
        console.error('💥 Error processing failed Mollie payment:', error)
    }
}
