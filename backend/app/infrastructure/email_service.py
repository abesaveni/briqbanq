import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
import structlog
from app.core.config import settings

logger = structlog.get_logger()


class EmailService:
    """Service for sending emails via SMTP."""

    @staticmethod
    async def send_email(to_email: str, subject: str, html: str):
        """Generic email sender — logs to console if MAIL_PASSWORD is not set."""
        if not settings.mail_password:
            logger.warning("smtp_password_not_set", email=to_email)
            print(f"\n[EMAIL MOCK] To: {to_email} | Subject: {subject}\n")
            return
        try:
            await asyncio.to_thread(EmailService._send_smtp_sync, to_email, subject, html)
            logger.info("email_sent_successfully", email=to_email, subject=subject)
        except Exception as e:
            logger.error("email_send_failed", email=to_email, error=str(e))

    @staticmethod
    async def send_otp_email(to_email: str, otp: str):
        """Send OTP email via Gmail SMTP (non-blocking)."""
        logger.info("email_service_invoked", to_email=to_email)
        subject = "Your BrickBanq Verification Code"
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #008080;">BrickBanq Verification</h2>
                    <p>Hello,</p>
                    <p>Your verification code is:</p>
                    <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px; margin: 20px 0;">
                        {otp}
                    </div>
                    <p>This code will expire in 5 minutes. If you did not request this code, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #777;">&copy; 2026 BrickBanq. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, body)

    @staticmethod
    async def send_password_reset_email(to_email: str, otp: str):
        """Send password-reset OTP email."""
        subject = "Reset Your BriqBanq Password"
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1B3A6B; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BriqBanq</h1>
                        <p style="color: #a0c4e8; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #1B3A6B;">Password Reset Request</h2>
                        <p>We received a request to reset your password. Use the code below to set a new password:</p>
                        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #1B3A6B; border-radius: 8px; margin: 24px 0; border: 2px dashed #5B9BD5;">
                            {otp}
                        </div>
                        <p>This code expires in <strong>10 minutes</strong>.</p>
                        <p style="color: #dc2626;">If you did not request a password reset, please ignore this email. Your password will not change.</p>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BriqBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, body)

    @staticmethod
    async def send_payment_receipt_email(
        to_email: str,
        borrower_name: str,
        case_id: str,
        case_number: str,
        amount_display: str,
        order_id: str,
        payment_id: str,
        paid_at: str,
    ):
        """Send payment receipt email to borrower after successful Square payment."""
        subject = f"Payment Confirmed — {amount_display} | BrickBanq Case {case_number}"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5;">
                <div style="max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <div style="background: #1a1a2e; padding: 24px 20px; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: 0.5px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0; font-size: 13px;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 32px 28px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <div style="display: inline-block; background: #dcfce7; border-radius: 50%; padding: 16px; margin-bottom: 12px;">
                                <span style="font-size: 32px;">✓</span>
                            </div>
                            <h2 style="color: #16a34a; margin: 0; font-size: 22px;">Payment Successful</h2>
                            <p style="color: #555; margin: 8px 0 0; font-size: 15px;">Your payment of <strong>{amount_display}</strong> has been received.</p>
                        </div>
                        <p style="margin: 0 0 20px;">Hi <strong>{borrower_name}</strong>,</p>
                        <p style="margin: 0 0 20px;">Thank you for completing your payment. Your case has been successfully created on the BrickBanq platform. Our team will review your submission and be in touch shortly.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
                            <tr style="background: #f0fdf4;">
                                <td style="padding: 10px 14px; font-weight: 600; color: #166534; width: 42%; border-bottom: 1px solid #dcfce7;">Payment Status</td>
                                <td style="padding: 10px 14px; color: #16a34a; font-weight: 700; border-bottom: 1px solid #dcfce7;">PAID ✓</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Amount Paid</td>
                                <td style="padding: 10px 14px; font-weight: 700; color: #111827; border-bottom: 1px solid #f3f4f6;">{amount_display}</td>
                            </tr>
                            <tr style="background: #f9fafb;">
                                <td style="padding: 10px 14px; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Case Reference</td>
                                <td style="padding: 10px 14px; color: #374151; border-bottom: 1px solid #f3f4f6; font-family: monospace;">{case_number}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Case ID</td>
                                <td style="padding: 10px 14px; color: #6b7280; font-size: 12px; border-bottom: 1px solid #f3f4f6; font-family: monospace;">{case_id}</td>
                            </tr>
                            <tr style="background: #f9fafb;">
                                <td style="padding: 10px 14px; font-weight: 600; color: #374151; border-bottom: 1px solid #f3f4f6;">Transaction ID</td>
                                <td style="padding: 10px 14px; color: #6b7280; font-size: 12px; border-bottom: 1px solid #f3f4f6; font-family: monospace;">{payment_id}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; font-weight: 600; color: #374151;">Date &amp; Time</td>
                                <td style="padding: 10px 14px; color: #374151;">{paid_at}</td>
                            </tr>
                        </table>
                        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px; margin: 24px 0; font-size: 13px; color: #1e40af;">
                            <strong>What happens next?</strong><br/>
                            Our team will review your case within 1–2 business days. You'll receive another email once your case moves to the review stage. You can log in to your BrickBanq dashboard at any time to track progress.
                        </div>
                        <div style="background: #f9fafb; border-radius: 8px; padding: 14px 16px; margin: 0 0 24px; font-size: 13px; color: #6b7280;">
                            <strong style="color: #374151;">Verification Package Includes:</strong><br/>
                            InfoTrack Property Search (A$85.00) · InfoTrack KYC/GreenID Verification (A$45.00) · Platform Onboarding Fee (A$120.00)
                        </div>
                    </div>
                    <div style="background: #f0f0f0; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="font-size: 12px; color: #9ca3af; margin: 0;">This is an automated receipt. Please keep it for your records.</p>
                        <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0;">&copy; 2026 BrickBanq Pty Ltd. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_case_approved_email(
        to_email: str,
        borrower_name: str,
        case_number: str,
        property_address: str,
    ):
        """Notify borrower that their case has been approved and moved to auction."""
        subject = f"Your Case {case_number} Has Been Approved — BrickBanq"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #22c55e;">Case Approved ✔</h2>
                        <p>Hi {borrower_name},</p>
                        <p>Great news! Your mortgage case has been reviewed and <strong>approved</strong> by our team.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold; width: 40%;">Case Reference</td><td style="padding: 8px; background: #f9f9f9;">{case_number}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Property</td><td style="padding: 8px;">{property_address}</td></tr>
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Status</td><td style="padding: 8px; background: #f9f9f9; color: #16a34a; font-weight: bold;">APPROVED → MOVING TO AUCTION</td></tr>
                        </table>
                        <p>Your property will shortly be listed in the live auction marketplace where lenders and investors can bid. You can monitor progress in your <strong>View My Auction</strong> dashboard.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://brickbanq.au/borrower/auction-room" style="background: #4f46e5; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">View My Auction</a>
                        </div>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_bid_closed_to_borrower(
        to_email: str,
        borrower_name: str,
        case_number: str,
        property_address: str,
        winning_bidder_name: str,
        winning_amount: str,
    ):
        """Notify borrower that they approved a bid and the auction is now closed."""
        subject = f"Auction Closed — {case_number} | BrickBanq"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #4f46e5;">Auction Successfully Closed</h2>
                        <p>Hi {borrower_name},</p>
                        <p>You have approved the winning bid for your case. The auction has been closed and the deal is now progressing to settlement.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold; width: 40%;">Case Reference</td><td style="padding: 8px; background: #f9f9f9;">{case_number}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Property</td><td style="padding: 8px;">{property_address}</td></tr>
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Winning Bidder</td><td style="padding: 8px; background: #f9f9f9;">{winning_bidder_name}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Final Bid Amount</td><td style="padding: 8px; color: #16a34a; font-weight: bold;">{winning_amount}</td></tr>
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Status</td><td style="padding: 8px; background: #f9f9f9; color: #dc2626; font-weight: bold;">CLOSED</td></tr>
                        </table>
                        <p>Our team will be in touch shortly to guide you through the next steps of the settlement process.</p>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_bid_closed_to_admin(
        to_email: str,
        case_number: str,
        property_address: str,
        winning_bidder_name: str,
        winning_amount: str,
        borrower_name: str,
    ):
        """Notify admin that an auction has been closed by borrower approval."""
        subject = f"[Admin] Auction Closed — {case_number} | BrickBanq"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq — Admin Alert</h1>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #dc2626;">Auction Closed — Action Required</h2>
                        <p>An auction has been closed by borrower approval. Please review and proceed with settlement.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold; width: 40%;">Case Reference</td><td style="padding: 8px; background: #f9f9f9;">{case_number}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Property</td><td style="padding: 8px;">{property_address}</td></tr>
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Borrower</td><td style="padding: 8px; background: #f9f9f9;">{borrower_name}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Winning Bidder</td><td style="padding: 8px;">{winning_bidder_name}</td></tr>
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Final Amount</td><td style="padding: 8px; background: #f9f9f9; color: #16a34a; font-weight: bold;">{winning_amount}</td></tr>
                        </table>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_bid_won_to_bidder(
        to_email: str,
        bidder_name: str,
        case_number: str,
        property_address: str,
        winning_amount: str,
    ):
        """Notify winning bidder that their bid was accepted."""
        subject = f"Congratulations! Your Bid Won — {case_number} | BrickBanq"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #22c55e;">Congratulations — Your Bid Won! 🎉</h2>
                        <p>Hi {bidder_name},</p>
                        <p>The borrower has accepted your bid. You are now the winning bidder for this property auction.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold; width: 40%;">Case Reference</td><td style="padding: 8px; background: #f9f9f9;">{case_number}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Property</td><td style="padding: 8px;">{property_address}</td></tr>
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Your Winning Bid</td><td style="padding: 8px; background: #f9f9f9; color: #16a34a; font-weight: bold;">{winning_amount}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Status</td><td style="padding: 8px; color: #16a34a; font-weight: bold;">WON</td></tr>
                        </table>
                        <p>Our team will contact you shortly with next steps regarding the settlement and contract signing process.</p>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_bid_outbid_notification(
        to_email: str,
        bidder_name: str,
        case_number: str,
        property_address: str,
        your_bid: str,
        winning_amount: str,
    ):
        """Notify losing bidders that the auction has closed and their bid did not win."""
        subject = f"Auction Closed — {case_number} | BrickBanq"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #f59e0b;">Auction Closed</h2>
                        <p>Hi {bidder_name},</p>
                        <p>The auction for the below property has been closed. Unfortunately, your bid was not selected as the winning bid.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold; width: 40%;">Case Reference</td><td style="padding: 8px; background: #f9f9f9;">{case_number}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Property</td><td style="padding: 8px;">{property_address}</td></tr>
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Your Bid</td><td style="padding: 8px; background: #f9f9f9;">{your_bid}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Final Accepted Bid</td><td style="padding: 8px; color: #16a34a; font-weight: bold;">{winning_amount}</td></tr>
                        </table>
                        <p>Thank you for participating. We invite you to explore other available properties in our live auction marketplace.</p>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_kyc_submitted_email(to_email: str, name: str):
        """Notify user that their KYC has been submitted and is under review."""
        subject = "KYC Verification Submitted — BrickBanq"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #f59e0b;">KYC Submitted for Review</h2>
                        <p>Hi {name},</p>
                        <p>Thank you for submitting your identity verification documents. Our compliance team will review your submission shortly.</p>
                        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0; color: #92400e; font-weight: bold;">What happens next?</p>
                            <ul style="margin: 8px 0 0; color: #78350f;">
                                <li>An admin will review your documents (usually within 1 business day)</li>
                                <li>You will receive an email once a decision has been made</li>
                                <li>Once approved, you will have full access to the platform</li>
                            </ul>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://brickbanq.au/borrower/identity-verification" style="background: #4f46e5; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Verification Status</a>
                        </div>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_kyc_approved_email(to_email: str, name: str):
        """Notify user that their KYC has been approved."""
        subject = "Identity Verified — You're Approved on BrickBanq"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #22c55e;">Identity Verified ✔</h2>
                        <p>Hi {name},</p>
                        <p>Great news! Your identity has been <strong>verified</strong> by our compliance team. You now have full access to the BrickBanq platform.</p>
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; color: #166534; font-size: 18px; font-weight: bold;">✓ KYC Approved</p>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://brickbanq.au/borrower/dashboard" style="background: #16a34a; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
                        </div>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_kyc_rejected_email(to_email: str, name: str, reason: str = ""):
        """Notify user that their KYC has been rejected."""
        subject = "Identity Verification Update — BrickBanq"
        reason_section = f"""
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b; font-weight: bold;">Reason for rejection:</p>
                <p style="margin: 8px 0 0; color: #7f1d1d;">{reason}</p>
            </div>
        """ if reason else ""
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #dc2626;">Verification Unsuccessful</h2>
                        <p>Hi {name},</p>
                        <p>Unfortunately, we were unable to verify your identity based on the documents provided.</p>
                        {reason_section}
                        <p>Please resubmit with clear, valid documents. If you need assistance, contact our support team.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://brickbanq.au/borrower/identity-verification" style="background: #4f46e5; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">Resubmit Documents</a>
                        </div>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_case_submitted_email(to_email: str, admin_name: str, case_title: str, borrower_name: str, property_address: str, case_number: str = ""):
        """Notify admin that a new case has been submitted for review."""
        ref = case_number or case_title
        subject = f"[Admin] New Case Submitted — {ref} | BrickBanq"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq — Admin Alert</h1>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #4f46e5;">New Case Submitted for Review</h2>
                        <p>Hi {admin_name},</p>
                        <p>A new mortgage case has been submitted and is awaiting your review.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold; width: 40%;">Case Title</td><td style="padding: 8px; background: #f9f9f9;">{case_title}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Borrower</td><td style="padding: 8px;">{borrower_name}</td></tr>
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Property</td><td style="padding: 8px; background: #f9f9f9;">{property_address}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Status</td><td style="padding: 8px; color: #f59e0b; font-weight: bold;">SUBMITTED — Awaiting Review</td></tr>
                        </table>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://brickbanq.au/admin/case-management" style="background: #4f46e5; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">Review Case</a>
                        </div>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_case_rejected_email(to_email: str, borrower_name: str, case_title: str, reason: str = ""):
        """Notify borrower that their case has been rejected."""
        reason_section = f"""
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b; font-weight: bold;">Reason for rejection:</p>
                <p style="margin: 8px 0 0; color: #7f1d1d;">{reason}</p>
            </div>
        """ if reason else ""
        subject = f"Case Update — Action Required | BrickBanq"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #dc2626;">Case Requires Attention</h2>
                        <p>Hi {borrower_name},</p>
                        <p>Your case <strong>{case_title}</strong> has been reviewed and requires updates before it can be approved.</p>
                        {reason_section}
                        <p>Please log in to your dashboard, update the required information, and resubmit your case.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://brickbanq.au/borrower/my-case" style="background: #4f46e5; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">Update My Case</a>
                        </div>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_new_bid_to_borrower(to_email: str, borrower_name: str, case_title: str, bid_amount: str, bidder_count: int):
        """Notify borrower that a new bid was placed on their case."""
        subject = f"New Bid Received — {case_title} | BrickBanq"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #4f46e5;">New Bid on Your Case</h2>
                        <p>Hi {borrower_name},</p>
                        <p>A new bid has been placed on your mortgage case.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold; width: 40%;">Case</td><td style="padding: 8px; background: #f9f9f9;">{case_title}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Latest Bid</td><td style="padding: 8px; color: #16a34a; font-weight: bold; font-size: 18px;">{bid_amount}</td></tr>
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Total Bids</td><td style="padding: 8px; background: #f9f9f9;">{bidder_count}</td></tr>
                        </table>
                        <p>Log in to your dashboard to view all bids and choose the best offer.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://brickbanq.au/borrower/my-case" style="background: #4f46e5; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Bids</a>
                        </div>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_bid_placed_confirmation(to_email: str, bidder_name: str, case_title: str, bid_amount: str, property_address: str):
        """Confirm to a lender/investor that their bid was placed successfully."""
        subject = f"Bid Placed Successfully — {case_title} | BrickBanq"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #22c55e;">Bid Placed Successfully</h2>
                        <p>Hi {bidder_name},</p>
                        <p>Your bid has been placed successfully. You will be notified if you are outbid or if the borrower accepts your offer.</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold; width: 40%;">Auction</td><td style="padding: 8px; background: #f9f9f9;">{case_title}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Property</td><td style="padding: 8px;">{property_address}</td></tr>
                            <tr><td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Your Bid</td><td style="padding: 8px; background: #f9f9f9; color: #16a34a; font-weight: bold; font-size: 18px;">{bid_amount}</td></tr>
                        </table>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://brickbanq.au/lender/auction-room" style="background: #4f46e5; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Auction</a>
                        </div>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_welcome_email(to_email: str, name: str, role: str):
        """Send a welcome email after successful registration."""
        role_label = role.capitalize()
        subject = f"Welcome to BrickBanq — Your Account is Ready"
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="background: #1a1a2e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 22px;">BrickBanq</h1>
                        <p style="color: #a0a0b0; margin: 4px 0 0;">Mortgage Resolution Platform</p>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="color: #4f46e5;">Welcome to BrickBanq!</h2>
                        <p>Hi {name},</p>
                        <p>Your account has been created successfully. You are registered as a <strong>{role_label}</strong>.</p>
                        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0; color: #0369a1; font-weight: bold;">Getting Started</p>
                            <ul style="margin: 8px 0 0; color: #0c4a6e;">
                                <li>Complete your KYC verification to unlock full platform access</li>
                                <li>Explore the dashboard to see available opportunities</li>
                                <li>Contact support if you need any assistance</li>
                            </ul>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://brickbanq.au" style="background: #4f46e5; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
                        </div>
                    </div>
                    <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                        <p style="font-size: 12px; color: #777; margin: 0;">&copy; 2026 BrickBanq. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_settlement_created_email(to_email: str, name: str, amount: str, deal_ref: str):
        """Notify a party that a settlement has been initiated."""
        subject = f"Settlement Initiated — {deal_ref} | BrickBanq"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
            <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;">BrickBanq</h1>
                <p style="color:#a0a0b0;margin:4px 0 0;">Mortgage Resolution Platform</p>
            </div>
            <div style="padding:30px 20px;">
                <h2 style="color:#4f46e5;">Settlement Initiated</h2>
                <p>Hi {name},</p>
                <p>A settlement has been initiated for your deal. Our team will process the funds shortly.</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold;width:40%;">Deal Reference</td><td style="padding:8px;background:#f9f9f9;">{deal_ref}</td></tr>
                    <tr><td style="padding:8px;font-weight:bold;">Settlement Amount</td><td style="padding:8px;color:#16a34a;font-weight:bold;">{amount}</td></tr>
                    <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold;">Status</td><td style="padding:8px;background:#f9f9f9;color:#f59e0b;font-weight:bold;">PENDING</td></tr>
                </table>
            </div>
            <div style="background:#f0f0f0;padding:15px;text-align:center;border-radius:0 0 8px 8px;">
                <p style="font-size:12px;color:#777;margin:0;">&copy; 2026 BrickBanq. All rights reserved.</p>
            </div>
        </div></body></html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_settlement_completed_email(to_email: str, name: str, amount: str, deal_ref: str):
        """Notify a party that settlement has been completed."""
        subject = f"Settlement Completed — {deal_ref} | BrickBanq"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
            <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;">BrickBanq</h1>
                <p style="color:#a0a0b0;margin:4px 0 0;">Mortgage Resolution Platform</p>
            </div>
            <div style="padding:30px 20px;">
                <h2 style="color:#22c55e;">Settlement Completed ✔</h2>
                <p>Hi {name},</p>
                <p>The settlement for your deal has been <strong>completed</strong>. Funds have been disbursed successfully.</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold;width:40%;">Deal Reference</td><td style="padding:8px;background:#f9f9f9;">{deal_ref}</td></tr>
                    <tr><td style="padding:8px;font-weight:bold;">Amount Settled</td><td style="padding:8px;color:#16a34a;font-weight:bold;">{amount}</td></tr>
                    <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold;">Status</td><td style="padding:8px;background:#f9f9f9;color:#16a34a;font-weight:bold;">COMPLETED</td></tr>
                </table>
            </div>
            <div style="background:#f0f0f0;padding:15px;text-align:center;border-radius:0 0 8px 8px;">
                <p style="font-size:12px;color:#777;margin:0;">&copy; 2026 BrickBanq. All rights reserved.</p>
            </div>
        </div></body></html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_contract_sent_email(to_email: str, name: str, contract_title: str):
        """Notify signer that a contract has been sent for their signature."""
        subject = f"Contract Ready for Signature — {contract_title} | BrickBanq"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
            <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;">BrickBanq</h1>
                <p style="color:#a0a0b0;margin:4px 0 0;">Mortgage Resolution Platform</p>
            </div>
            <div style="padding:30px 20px;">
                <h2 style="color:#4f46e5;">Action Required — Sign Contract</h2>
                <p>Hi {name},</p>
                <p>A contract has been sent to you for signature. Please log in to review and sign.</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold;width:40%;">Contract</td><td style="padding:8px;background:#f9f9f9;">{contract_title}</td></tr>
                    <tr><td style="padding:8px;font-weight:bold;">Status</td><td style="padding:8px;color:#f59e0b;font-weight:bold;">AWAITING YOUR SIGNATURE</td></tr>
                </table>
                <div style="text-align:center;margin:30px 0;">
                    <a href="http://brickbanq.au" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">Sign Contract</a>
                </div>
            </div>
            <div style="background:#f0f0f0;padding:15px;text-align:center;border-radius:0 0 8px 8px;">
                <p style="font-size:12px;color:#777;margin:0;">&copy; 2026 BrickBanq. All rights reserved.</p>
            </div>
        </div></body></html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_contract_executed_email(to_email: str, name: str, contract_title: str):
        """Notify parties that a contract has been fully executed."""
        subject = f"Contract Executed — {contract_title} | BrickBanq"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
            <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;">BrickBanq</h1>
                <p style="color:#a0a0b0;margin:4px 0 0;">Mortgage Resolution Platform</p>
            </div>
            <div style="padding:30px 20px;">
                <h2 style="color:#22c55e;">Contract Fully Executed ✔</h2>
                <p>Hi {name},</p>
                <p>Your contract has been fully signed by all parties and is now <strong>executed</strong>.</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold;width:40%;">Contract</td><td style="padding:8px;background:#f9f9f9;">{contract_title}</td></tr>
                    <tr><td style="padding:8px;font-weight:bold;">Status</td><td style="padding:8px;color:#16a34a;font-weight:bold;">EXECUTED</td></tr>
                </table>
            </div>
            <div style="background:#f0f0f0;padding:15px;text-align:center;border-radius:0 0 8px 8px;">
                <p style="font-size:12px;color:#777;margin:0;">&copy; 2026 BrickBanq. All rights reserved.</p>
            </div>
        </div></body></html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_escrow_created_email(to_email: str, name: str, amount: str):
        """Notify payer that escrow has been set up for their deal."""
        subject = "Escrow Account Created — BrickBanq"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
            <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;">BrickBanq</h1>
                <p style="color:#a0a0b0;margin:4px 0 0;">Mortgage Resolution Platform</p>
            </div>
            <div style="padding:30px 20px;">
                <h2 style="color:#4f46e5;">Escrow Account Initiated</h2>
                <p>Hi {name},</p>
                <p>An escrow account has been set up for your deal. Funds will be held securely until settlement is complete.</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold;width:40%;">Escrow Amount</td><td style="padding:8px;background:#f9f9f9;color:#16a34a;font-weight:bold;">{amount}</td></tr>
                    <tr><td style="padding:8px;font-weight:bold;">Status</td><td style="padding:8px;color:#f59e0b;font-weight:bold;">PENDING</td></tr>
                </table>
            </div>
            <div style="background:#f0f0f0;padding:15px;text-align:center;border-radius:0 0 8px 8px;">
                <p style="font-size:12px;color:#777;margin:0;">&copy; 2026 BrickBanq. All rights reserved.</p>
            </div>
        </div></body></html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_escrow_released_email(to_email: str, name: str, amount: str):
        """Notify payee that escrow funds have been released."""
        subject = "Escrow Funds Released — BrickBanq"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
            <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;">BrickBanq</h1>
                <p style="color:#a0a0b0;margin:4px 0 0;">Mortgage Resolution Platform</p>
            </div>
            <div style="padding:30px 20px;">
                <h2 style="color:#22c55e;">Escrow Funds Released ✔</h2>
                <p>Hi {name},</p>
                <p>The escrow funds for your deal have been <strong>released</strong>. Please check your wallet for the credited amount.</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;background:#f9f9f9;font-weight:bold;width:40%;">Amount Released</td><td style="padding:8px;background:#f9f9f9;color:#16a34a;font-weight:bold;">{amount}</td></tr>
                    <tr><td style="padding:8px;font-weight:bold;">Status</td><td style="padding:8px;color:#16a34a;font-weight:bold;">RELEASED</td></tr>
                </table>
            </div>
            <div style="background:#f0f0f0;padding:15px;text-align:center;border-radius:0 0 8px 8px;">
                <p style="font-size:12px;color:#777;margin:0;">&copy; 2026 BrickBanq. All rights reserved.</p>
            </div>
        </div></body></html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_role_approved_email(to_email: str, name: str, role_type: str):
        """Notify user that their role request has been approved."""
        role_label = role_type.capitalize()
        subject = f"Role Approved — {role_label} | BrickBanq"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
            <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;">BrickBanq</h1>
                <p style="color:#a0a0b0;margin:4px 0 0;">Mortgage Resolution Platform</p>
            </div>
            <div style="padding:30px 20px;">
                <h2 style="color:#22c55e;">Role Approved ✔</h2>
                <p>Hi {name},</p>
                <p>Your request for the <strong>{role_label}</strong> role has been approved. You can now access all features available to {role_label}s on the platform.</p>
                <div style="text-align:center;margin:30px 0;">
                    <a href="http://brickbanq.au" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">Go to Dashboard</a>
                </div>
            </div>
            <div style="background:#f0f0f0;padding:15px;text-align:center;border-radius:0 0 8px 8px;">
                <p style="font-size:12px;color:#777;margin:0;">&copy; 2026 BrickBanq. All rights reserved.</p>
            </div>
        </div></body></html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    async def send_role_rejected_email(to_email: str, name: str, role_type: str, reason: str = ""):
        """Notify user that their role request has been rejected."""
        role_label = role_type.capitalize()
        reason_section = f"""
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:20px 0;">
                <p style="margin:0;color:#991b1b;font-weight:bold;">Reason:</p>
                <p style="margin:8px 0 0;color:#7f1d1d;">{reason}</p>
            </div>
        """ if reason else ""
        subject = f"Role Request Update — {role_label} | BrickBanq"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
            <div style="background:#1a1a2e;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:22px;">BrickBanq</h1>
                <p style="color:#a0a0b0;margin:4px 0 0;">Mortgage Resolution Platform</p>
            </div>
            <div style="padding:30px 20px;">
                <h2 style="color:#dc2626;">Role Request Not Approved</h2>
                <p>Hi {name},</p>
                <p>Your request for the <strong>{role_label}</strong> role was not approved at this time.</p>
                {reason_section}
                <p>Please contact support if you believe this is an error.</p>
            </div>
            <div style="background:#f0f0f0;padding:15px;text-align:center;border-radius:0 0 8px 8px;">
                <p style="font-size:12px;color:#777;margin:0;">&copy; 2026 BrickBanq. All rights reserved.</p>
            </div>
        </div></body></html>
        """
        await EmailService.send_email(to_email, subject, html)

    @staticmethod
    def _send_smtp_sync(to_email: str, subject: str, html_content: str):
        """Synchronous SMTP helper for to_thread."""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.mail_from
        msg["To"] = to_email

        part = MIMEText(html_content, "html")
        msg.attach(part)

        with smtplib.SMTP(settings.mail_server, settings.mail_port) as server:
            if settings.mail_tls:
                server.starttls()
            server.login(settings.mail_username, settings.mail_password)
            server.send_message(msg)
