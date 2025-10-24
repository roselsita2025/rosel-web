import { PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE, LOGIN_OTP_TEMPLATE, ORDER_CONFIRMATION_TEMPLATE } from "./emailTemplates.js"
import { sgMail, sender } from "./mail.config.js"

export const sendVerificationEmail = async (email, verificationToken) => {
    const recipient = [{email}];

    try {
        const msg = {
            from: sender,
            to: recipient,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            categories: ["Email Verification"],
        };
        const response = await sgMail.send(msg);
        console.log("Email sent successfully", response?.[0]?.statusCode);
    } catch (error) {
        console.log(`Error sending verification`, error);
        throw new Error(`Error sending verification email: ${error}`);
    }
};

export const sendWelcomeEmail = async (email, name) => {
    const recipient = [{email }];

    try {
        const msg = {
            from: sender,
            to: recipient,
            subject: "Welcome email",
            html: WELCOME_EMAIL_TEMPLATE.replace("{Name}", name).replace("{supportEmail}", process.env.SENDGRID_SINGLE_SENDER),
            categories: ["Welcome email"],
        };
        const response = await sgMail.send(msg);
        console.log("Welcome email sent successfully", response?.[0]?.statusCode);
    } catch (error) {
        console.log(`Error sending Welcome email`, error);
        throw new Error(`Error sending Welcome email: ${error}`);
    }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
    const recipient = [{ email }];

    try {
        const msg = {
            from: sender,
            to: recipient,
            subject: "Reset your password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            categories: ["Reset Password Request"],
        };
        await sgMail.send(msg);
    } catch (error) {
        console.log(`Error sending password reset email`, error);
        throw new Error(`Error sending password reset email: ${error}`);
    }
};

export const sendResetSuccessEmail = async (email) => {
    const recipient = [{ email }];
    try {
        const msg = {
            from: sender,
            to: recipient,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            categories: ["Reset Password Success"],
        };
        const response = await sgMail.send(msg);
        console.log("Password reset email sent successfully", response?.[0]?.statusCode);
    } catch (error) {
        console.log(`Error sending password reset success email`, error);

        throw new Error(`Error sending password reset success email: ${error}`);  
    }
};

export const sendLoginOtpEmail = async (email, otpCode) => {
    const recipient = [{ email }];
    try {
        const msg = {
            from: sender,
            to: recipient,
            subject: "Your login verification code",
            html: LOGIN_OTP_TEMPLATE.replace("{otpCode}", otpCode),
            categories: ["Login OTP"],
        };
        const response = await sgMail.send(msg);
        console.log("Login OTP email sent", response?.[0]?.statusCode);
    } catch (error) {
        console.log("Error sending login OTP email", error);
        throw new Error(`Error sending login OTP email: ${error}`);
    }
};

export const sendOrderConfirmationEmail = async (email, data) => {
    const recipient = [{ email }];
    try {
        let itemsHtml = '';
        if (Array.isArray(data.items)) {
            itemsHtml = data.items.map(i => `
              <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:6px 0;">
                <span>${i.name} × ${i.quantity}</span>
                <span>₱${Number(i.total).toFixed(2)}</span>
              </div>
            `).join('');
        }
        const html = ORDER_CONFIRMATION_TEMPLATE
            .replace('{customerName}', data.customerName || 'Customer')
            .replace('{orderNumber}', data.orderNumber)
            .replace('{orderStatus}', data.orderStatus || 'Processing')
            .replace('{orderDate}', data.orderDate)
            .replace('{orderTotal}', String(data.orderTotal))
            .replace('{orderItems}', itemsHtml)
            .replace('{trackUrl}', data.trackUrl);

        const msg = {
            from: sender,
            to: recipient,
            subject: `Order Confirmation #${data.orderNumber}`,
            html,
            categories: ["Order Confirmation"],
        };
        const response = await sgMail.send(msg);
        console.log("Order confirmation email sent", response?.[0]?.statusCode);
    } catch (error) {
        console.log("Error sending order confirmation email", error);
        // Do not throw to avoid failing order flow on email issues
    }
};

export const sendEmail = async (recipients, subject, template, data) => {
    const recipientList = recipients.map(email => ({ email }));
    
    try {
        let htmlContent = template;
        Object.keys(data).forEach(key => {
            const placeholder = `{${key}}`;
            htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), data[key] || '');
        });

        const msg = {
            from: sender,
            to: recipientList,
            subject: subject,
            html: htmlContent,
            categories: ["Replacement Request"],
        };
        
        const response = await sgMail.send(msg);
        console.log("Email sent successfully", response?.[0]?.statusCode);
        return response;
    } catch (error) {
        console.log(`Error sending email:`, error);
        throw new Error(`Error sending email: ${error}`);
    }
};


