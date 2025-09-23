import { sgMail, sender } from '../sendgrid/mail.config.js';
import { User } from "../models/user.model.js";

/**
 * Send contact form message to admin
 * POST /api/contact/send-message
 */
export const sendContactMessage = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Determine admin recipients dynamically (users with admin role)
        const admins = await User.find({ role: 'admin' }).select('email name').lean();
        const adminRecipients = (admins || [])
            .map((u) => ({ email: u.email, name: u.name || 'Admin' }))
            .filter((r) => !!r.email);

        // Fallback to configured single sender if no admin users are found
        const fallbackAdminEmail = process.env.SENDGRID_SINGLE_SENDER;
        if (adminRecipients.length === 0) {
            if (!fallbackAdminEmail) {
                return res.status(500).json({
                    success: false,
                    message: 'No admin recipients configured'
                });
            }
        }

        // Create email content
        const emailSubject = `New Contact Form Message from ${name}`;
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #860809; border-bottom: 2px solid #f7e9b8; padding-bottom: 10px;">
                    New Contact Form Message
                </h2>
                
                <div style="background-color: #f7e9b8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #a31f17; margin-top: 0;">Contact Details:</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                </div>
                
                <div style="background-color: #fffefc; padding: 20px; border-radius: 8px; border: 1px solid #f7e9b8;">
                    <h3 style="color: #a31f17; margin-top: 0;">Message:</h3>
                    <p style="line-height: 1.6; color: #030105;">${message.replace(/\n/g, '<br>')}</p>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #f7e9b8; color: #82695b; font-size: 12px;">
                    <p>This message was sent from the Rosel Meat Contact Form.</p>
                    <p>Reply directly to this email to respond to the customer.</p>
                </div>
            </div>
        `;

        // Send email to admin
        const msg = {
            from: sender,
            to: adminRecipients.length > 0 ? adminRecipients : [{ email: fallbackAdminEmail }],
            replyTo: { email: email, name: name },
            subject: emailSubject,
            html: emailContent,
            categories: ["Contact Form"],
        };

        await sgMail.send(msg);

        // Send confirmation email to customer
        const confirmationContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #860809; border-bottom: 2px solid #f7e9b8; padding-bottom: 10px;">
                    Thank You for Contacting Us!
                </h2>
                
                <p style="color: #030105; line-height: 1.6;">
                    Hi ${name},
                </p>
                
                <p style="color: #030105; line-height: 1.6;">
                    Thank you for reaching out to us! We have received your message and will get back to you as soon as possible.
                </p>
                
                <div style="background-color: #f7e9b8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #a31f17; margin-top: 0;">Your Message:</h3>
                    <p style="line-height: 1.6; color: #030105;">${message.replace(/\n/g, '<br>')}</p>
                </div>
                
                <p style="color: #030105; line-height: 1.6;">
                    In the meantime, feel free to browse our products or check out our FAQ section for quick answers to common questions.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f7e9b8;">
                    <p style="color: #82695b; font-size: 14px;">
                        Best regards,<br>
                        The Rosel Meat Team
                    </p>
                </div>
            </div>
        `;

        const confirmationMsg = {
            from: sender,
            to: [{ email: email, name: name }],
            subject: "Thank you for contacting Rosel Meat - We'll be in touch soon!",
            html: confirmationContent,
            categories: ["Contact Form Confirmation"],
        };

        await sgMail.send(confirmationMsg);

        res.status(200).json({
            success: true,
            message: 'Message sent successfully! We will get back to you soon.'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
};

/**
 * Get contact information
 * GET /api/contact/info
 */
export const getContactInfo = async (req, res) => {
    try {
        const contactInfo = {
            address: process.env.LALAMOVE_PICKUP_ADDRESS || 'Las Pinas, Philippines',
            phone: process.env.LALAMOVE_PICK_PHONE || 'Phone not configured',
            email: process.env.SENDGRID_SINGLE_SENDER || 'Email not configured',
            lat: parseFloat(process.env.LALAMOVE_PICKUP_LAT) || 14.4500,
            lng: parseFloat(process.env.LALAMOVE_PICKUP_LNG) || 120.9833
        };

        res.status(200).json({
            success: true,
            data: contactInfo
        });
    } catch (error) {
        console.error('Get contact info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get contact information'
        });
    }
};
