import type { Request, Response } from 'express'
import prisma from '../../../prisma'
import { sendLicenseEmail, sendPaymentFailedEmail } from '../../lib/email'
import { generateAndCreateLicense, getPlanDisplayName, getPlanPrice } from '@/lib/license-generator'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'

type PlanType = 'monthly' | 'quarterly' | 'lifetime' | 'premium'

const SHARED_SECRET = process.env.POLAR_WEBHOOK_SECRET as string;

export async function handlePolarWebhook(req: Request, res: Response) {
    try {
        const event = validateEvent(
            req.body,
            req.headers as Record<string, string>,
            SHARED_SECRET,
        )

        if (!event || !event.type) {
            return res.status(400).json({ error: 'Invalid event' })
        }

        switch (event.type) {
            case 'checkout.created':
                const checkout = event.data
                console.log('🔍 Polar Checkout created:', {
                    checkout_id: checkout.id,
                    checkout_url: checkout.url,
                    status: checkout.status,
                    customer_email: checkout.metadata?.customerEmail || checkout.customerEmail,
                    discord_id: checkout.metadata?.discordId,
                })
                break
            case 'order.paid':
                const order = event.data
                if (!order || !order.id || !order.checkoutId) {
                    console.error('❌ No order data in webhook')
                    return res.status(400).json({ error: 'No order data in webhook' })
                }

                if (!order.paid) {
                    console.error('❌ Order not paid')
                    return res.status(400).json({ error: 'Order not paid' })
                }

                console.log('🔍 Polar Order paid:', {
                    order_id: order.id,
                    order_checkout_id: order.checkoutId,
                    order_status: order.status,
                    order_amount: order.totalAmount,
                    order_currency: order.currency,
                    order_customer_email: order.metadata?.customerEmail,
                })

                await processSuccessfulPayment(order.checkoutId)
                break
            default:
                console.log(`ℹ️ Unhandled Polar webhook event type: ${event.type}`)
                break
        }

        // Always respond with 200 to acknowledge receipt
        return res.status(200).json({ success: true })

    } catch (error) {
        if (error instanceof WebhookVerificationError) {
            return res.status(403).send('Webhook verification failed')
        }

        console.error('💥 Error processing Polar webhook:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

async function processSuccessfulPayment(orderId: string): Promise<void> {
    try {
        if (!orderId) {
            console.error('❌ No order ID provided')
            return
        }

        // Check if this payment was already processed
        const pendingPayment = await prisma.pendingPayment.findUnique({
            where: { orderId: orderId, isCompleted: false }
        })

        if (!pendingPayment) {
            console.log('⚠️ No pending payment found for order_id:', orderId)
            return;
        }

        if (pendingPayment.isCompleted) {
            console.log('⚠️ Payment already processed for order_id:', orderId)
            return
        }

        const licenseResult = await generateAndCreateLicense({
            planId: pendingPayment.planId as PlanType,
            customerEmail: pendingPayment.customerEmail,
            paymentId: orderId,
            type: 'card',
        })

        // Send license key email
        try {
            if (licenseResult.success) {
                // Mark payment as completed
                await prisma.pendingPayment.update({
                    where: {
                        orderId: orderId,
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

        console.log('✅ Polar payment processed successfully:', orderId)

    } catch (error) {
        console.error('💥 Error processing successful Polar payment:', error)
    }
}