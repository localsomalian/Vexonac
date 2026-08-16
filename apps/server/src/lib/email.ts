import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface LicenseEmailData {
  email: string
  licenseKey?: string | null
  planName: string
  planPrice: string
  expiresAt?: Date | null
  isService?: boolean
}

interface EmailResult {
  success: boolean
  error?: string
}

export async function sendLicenseEmail(data: LicenseEmailData): Promise<EmailResult> {
  if (!resend) return { success: false, error: 'Email service not configured' }
  try {
    const { email, licenseKey, planName, planPrice, expiresAt, isService = false } = data

    const { data: emailData, error } = await resend.emails.send({
      from: 'VexonAC <noreply@vexonac.com>',
      to: [email],
      subject: isService 
        ? `ðŸ› ï¸ Your VexonAC Premium Setup Service - ${planName}`
        : `ðŸŽ‰ Your VexonAC License Key - ${planName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${isService ? 'Your VexonAC Premium Setup Service' : 'Your VexonAC License Key'}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
            
            <!-- Header -->
            <div style="background: ${isService ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)'}; padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                ${isService ? 'ðŸ› ï¸ Premium Setup Service' : 'ðŸŽ‰ License Key Ready!'}
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">
                ${isService ? 'Your premium setup service has been confirmed' : 'Your VexonAC license is ready to redeem'}
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 32px 24px;">
              
              <!-- Purchase Details -->
              <div style="background: #2a2a2a; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #404040;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #ffffff;">Purchase Details</h2>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="color: #9ca3af; font-size: 14px;">Plan:</span>
                  <span style="color: #ffffff; font-weight: 600;">${planName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="color: #9ca3af; font-size: 14px;">Price:</span>
                  <span style="color: #10b981; font-weight: 600; font-size: 16px;">${planPrice}</span>
                </div>
                ${expiresAt ? `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #9ca3af; font-size: 14px;">Expires:</span>
                  <span style="color: #ffffff;">${expiresAt.toLocaleDateString()}</span>
                </div>
                ` : ''}
              </div>

              ${isService ? `
                <!-- Premium Service Details -->
                <div style="background: linear-gradient(135deg, #f59e0b20 0%, #ea580c20 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #f59e0b40;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #f59e0b;">ðŸ› ï¸ What's Included</h2>
                  <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
                    <li style="margin-bottom: 8px;">Complete VexonAC installation and configuration</li>
                    <li style="margin-bottom: 8px;">Custom optimization for your server setup</li>
                    <li style="margin-bottom: 8px;">Priority updates and maintenance</li>
                    <li style="margin-bottom: 8px;">Access to premium features and configurations</li>
                    <li style="margin-bottom: 8px;">Direct line to our premium support team</li>
                  </ul>
                </div>

                <!-- Next Steps -->
                <div style="background: #1e3a8a20; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #3b82f640;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #60a5fa;">ðŸ“‹ Next Steps</h2>
                  <p style="margin: 0 0 16px 0; color: #d1d5db; line-height: 1.6;">
                    Our premium setup team will contact you within <strong>24 hours</strong> to schedule your installation.
                  </p>
                  <p style="margin: 0; color: #d1d5db; line-height: 1.6;">
                    Please make sure to check your email and Discord for updates from our team.
                  </p>
                </div>
              ` : `
                <!-- License Key -->
                <div style="background: linear-gradient(135deg, #3b82f620 0%, #06b6d420 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #3b82f640;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #60a5fa;">ðŸ”‘ Your License Key</h2>
                  <div style="background: #1a1a1a; border-radius: 8px; padding: 16px; border: 1px solid #404040; text-align: center;">
                    <code style="font-family: 'Courier New', monospace; font-size: 16px; color: #10b981; word-break: break-all; display: block; line-height: 1.4;">${licenseKey}</code>
                  </div>
                  <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 14px; text-align: center;">
                    Copy this key and use it in your VexonAC dashboard to activate your license
                  </p>
                </div>

                <!-- How to Redeem -->
                <div style="background: #1e3a8a20; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #3b82f640;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #60a5fa;">ðŸ“‹ How to Redeem</h2>
                  <ol style="margin: 0; padding-left: 20px; color: #d1d5db;">
                    <li style="margin-bottom: 12px;">Visit <a href="https://vexonac.com/dashboard" style="color: #60a5fa; text-decoration: none;">vexonac.com/dashboard</a></li>
                    <li style="margin-bottom: 12px;">Sign in with your Discord account</li>
                    <li style="margin-bottom: 12px;">Click "Redeem License Key"</li>
                    <li style="margin-bottom: 12px;">Paste your license key and follow the setup instructions</li>
                  </ol>
                </div>
              `}

              <!-- Support -->
              <div style="background: #2a2a2a; border-radius: 12px; padding: 24px; border: 1px solid #404040;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #ffffff;">ðŸ’¬ Need Help?</h2>
                <p style="margin: 0 0 16px 0; color: #d1d5db; line-height: 1.6;">
                  If you have any questions or need assistance, our support team is here to help!
                </p>
                <div style="text-align: center;">
                  <a href="https://discord.gg/vexonac" style="display: inline-block; background: #5865f2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                    ðŸ’¬ Join Discord
                  </a>
                  <a href="https://docs.vexonac.com" style="display: inline-block; background: #374151; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    ðŸ“š Documentation
                  </a>
                </div>
              </div>

            </div>

            <!-- Footer -->
            <div style="background: #1a1a1a; padding: 24px; text-align: center; border-top: 1px solid #333;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px;">
                Thank you for choosing VexonAC!
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This email was sent to ${email}. If you didn't request this, please contact our support team.
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('âŒ Failed to send license email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('âŒ Error sending license email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function sendPaymentFailedEmail(email: string, orderId: string): Promise<EmailResult> {
  if (!resend) return { success: false, error: 'Email service not configured' }
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'VexonAC <noreply@vexonac.com>',
      to: [email],
      subject: 'âŒ VexonAC Payment Failed',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Failed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; overflow: hidden; border: 1px solid #333;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: white;">âŒ Payment Failed</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">
                We couldn't process your VexonAC payment
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 32px 24px;">
              <p style="margin: 0 0 24px 0; color: #d1d5db; line-height: 1.6;">
                Unfortunately, your payment for order <strong>${orderId}</strong> could not be completed.
              </p>
              
              <div style="background: #2a2a2a; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #404040;">
                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #ffffff;">What to do next?</h2>
                <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
                  <li style="margin-bottom: 8px;">Check your payment method and try again</li>
                  <li style="margin-bottom: 8px;">Ensure you have sufficient funds</li>
                  <li style="margin-bottom: 8px;">Contact your bank if the issue persists</li>
                  <li style="margin-bottom: 8px;">Reach out to our support team for assistance</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="https://vexonac.com/#pricing" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  ðŸ”„ Try Again
                </a>
                <a href="https://discord.gg/vexonac" style="display: inline-block; background: #5865f2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  ðŸ’¬ Get Support
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #1a1a1a; padding: 24px; text-align: center; border-top: 1px solid #333;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This email was sent to ${email}. If you have questions, contact our support team.
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('âŒ Failed to send payment failed email:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('âŒ Error sending payment failed email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
} 

