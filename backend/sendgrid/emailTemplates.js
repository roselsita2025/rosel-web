export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #ecb232, #99452e); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Verify Your Email</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>Thank you for signing up! Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ecb232;">{verificationCode}</span>
    </div>
    <p>Enter this code on the verification page to complete your registration.</p>
    <p>This code will expire in 15 minutes for security reasons.</p>
    <p>If you didn't create an account with us, please ignore this email.</p>
    <p>Best regards,<br>Rosel Frozen Meat Supplier </p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #ecb232, #99452e); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset Successful</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We're writing to confirm that your password has been successfully reset.</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #ecb232; color: white; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; display: inline-block; font-size: 30px;">
        ✓
      </div>
    </div>
    <p>If you did not initiate this password reset, please contact our support team immediately.</p>
    <p>For security reasons, we recommend that you:</p>
    <ul>
      <li>Use a strong, unique password</li>
      <li>Enable two-factor authentication if available</li>
      <li>Avoid using the same password across multiple sites</li>
    </ul>
    <p>Thank you for helping us keep your account secure.</p>
    <p>Best regards,<br>Rosel Frozen Meat Supplier </p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #ecb232, #99452e); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
    <p>To reset your password, click the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{resetURL}" style="background-color: #ecb232; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>Best regards,<br>Rosel Frozen Meat Supplier </p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Rosel Frozen Meat Supplier</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">

  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">

    <!-- Header with logo -->
    <div style="text-align: center; padding: 30px 20px;">
      <img src="https://via.placeholder.com/200x60?text=Rosel+Logo" alt="Rosel Frozen Meat Supplier Logo" style="max-width: 180px; height: auto;">
    </div>

    <!-- Banner -->
    <div style="background: linear-gradient(to right, #ecb232, #99452e); padding: 30px 20px; text-align: center;">
      <h1 style="color: white; font-size: 28px; margin: 0;">Welcome to Rosel Frozen Meat Supplier</h1>
    </div>

    <!-- Body content -->
    <div style="padding: 30px 20px; color: #333;">

      <p style="font-size: 16px;">Hi <strong>{Name}</strong>,</p>

      <p style="font-size: 16px; margin-bottom: 20px;">
        Thank you for registering! We're thrilled to have you with us. As a customer of Rosel Frozen Meat Supplier, you now have access to premium quality frozen meats delivered right to your doorstep.
      </p>

      <p style="font-size: 16px;">Here's what you can do:</p>
      <ul style="font-size: 16px; padding-left: 20px; margin-bottom: 25px;">
        <li>Browse and order our premium frozen products</li>
        <li>Track your orders and delivery schedules</li>
        <li>Enjoy exclusive promos and seasonal discounts</li>
      </ul>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yourwebsite.com/shop" target="_blank" style="background-color: #99452e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
          Start Shopping Now
        </a>
      </div>

      <p style="font-size: 14px; color: #555;">
        If you have any questions or need assistance, feel free to contact us at 
        <a href="mailto:support@roselfrozenmeats.com" style="color: #99452e;">support@roselfrozenmeats.com</a>.
      </p>

      <p style="margin-top: 30px; font-size: 16px;">We look forward to serving you,</p>
      <p style="font-size: 16px;">— The Rosel Frozen Meat Supplier Team</p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888;">
      <p>Rosel Frozen Meat Supplier</p>
      <p>Blk 8 Lot 4 Alagaw St., Greensite Homes Subdivision,<br> Molino II, Bacoor City, Cavite</p>
      <p>This is an automated message. Please do not reply.</p>
    </div>

  </div>

</body>
</html>
`;

export const LOGIN_OTP_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Verification Code</title>
  <style>
    @media (prefers-color-scheme: dark) {
      body { background-color: #121212 !important; color: #eaeaea !important; }
    }
  </style>
  </head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #ecb232, #99452e); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Login Verification</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We received a request to sign in to your account. Use the verification code below to complete your login:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ecb232;">{otpCode}</span>
    </div>
    <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    <p>Best regards,<br>Rosel Frozen Meat Supplier</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const REPLACEMENT_REQUEST_SUBMITTED_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Replacement Request Submitted</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #ecb232, #99452e); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">New Replacement Request</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello Admin,</p>
    <p>A new replacement request has been submitted and requires your attention.</p>
    
    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ecb232;">
      <h3 style="margin-top: 0; color: #99452e;">Request Details</h3>
      <p><strong>Request Number:</strong> #{requestNumber}</p>
      <p><strong>Customer:</strong> {customerName} ({customerEmail})</p>
      <p><strong>Order Number:</strong> #{orderNumber}</p>
      <p><strong>Product:</strong> {productName}</p>
      <p><strong>Quantity:</strong> {quantity}</p>
      <p><strong>Reason:</strong> {reason}</p>
      <p><strong>Priority:</strong> <span style="color: {priority === 'urgent' ? '#dc2626' : priority === 'high' ? '#ea580c' : '#16a34a'};">{priority}</span></p>
      <p><strong>Submitted:</strong> {requestDate}</p>
    </div>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #374151;">Description:</h4>
      <p style="margin-bottom: 0;">{description}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://yourwebsite.com/admin/replacement-requests" style="background-color: #99452e; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Request</a>
    </div>
    
    <p>Please review this request and take appropriate action as soon as possible.</p>
    <p>Best regards,<br>Rosel Frozen Meat Supplier System</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const REPLACEMENT_REQUEST_STATUS_UPDATE_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Replacement Request Status Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #ecb232, #99452e); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Replacement Request Update</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello {customerName},</p>
    <p>We have an update regarding your replacement request.</p>
    
    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ecb232;">
      <h3 style="margin-top: 0; color: #99452e;">Request Information</h3>
      <p><strong>Request Number:</strong> #{requestNumber}</p>
      <p><strong>Product:</strong> {productName}</p>
      <p><strong>Status:</strong> <span style="color: {newStatus === 'approved' ? '#16a34a' : newStatus === 'rejected' ? '#dc2626' : '#ea580c'}; font-weight: bold;">{newStatus}</span></p>
      <p><strong>Submitted:</strong> {requestDate}</p>
      <p><strong>Last Updated:</strong> {updateDate}</p>
    </div>
    
    <!-- Admin Response Section -->
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #374151;">Admin Response:</h4>
      <p style="margin-bottom: 0;">{adminResponse}</p>
    </div>
    
    <!-- Tracking Information Section -->
    <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h4 style="margin-top: 0; color: #1e40af;">Tracking Information</h4>
      <p style="margin-bottom: 0;"><strong>Tracking Number:</strong> {trackingNumber}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://yourwebsite.com/replacement-requests/{requestNumber}" style="background-color: #99452e; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Request Details</a>
    </div>
    
    <p>If you have any questions about this update, please don't hesitate to contact our customer service team.</p>
    <p>Thank you for your patience and understanding.</p>
    <p>Best regards,<br>Rosel Frozen Meat Supplier Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const REPLACEMENT_REQUEST_APPROVED_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Replacement Request Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #16a34a, #15803d); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Request Approved!</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello {customerName},</p>
    <p>Great news! Your replacement request has been approved and we're processing your replacement.</p>
    
    <div style="background-color: #dcfce7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #16a34a;">
      <h3 style="margin-top: 0; color: #15803d;">✓ Request Approved</h3>
      <p><strong>Request Number:</strong> #{requestNumber}</p>
      <p><strong>Product:</strong> {productName}</p>
      <p><strong>Quantity:</strong> {quantity}</p>
    </div>
    
    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #374151;">Next Steps:</h4>
      <ul style="margin-bottom: 0;">
        <li>We will prepare your replacement item</li>
        <li>You will receive a tracking number once shipped</li>
        <li>Please return the original item if requested</li>
      </ul>
    </div>
    
    <!-- Additional Information Section -->
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #374151;">Additional Information:</h4>
      <p style="margin-bottom: 0;">{adminResponse}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://yourwebsite.com/replacement-requests/{requestNumber}" style="background-color: #16a34a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Your Request</a>
    </div>
    
    <p>Thank you for choosing Rosel Frozen Meat Supplier. We appreciate your business!</p>
    <p>Best regards,<br>Rosel Frozen Meat Supplier Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const REPLACEMENT_REQUEST_REJECTED_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Replacement Request Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #dc2626, #b91c1c); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Request Update</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello {customerName},</p>
    <p>We have reviewed your replacement request and unfortunately cannot approve it at this time.</p>
    
    <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <h3 style="margin-top: 0; color: #b91c1c;">Request Information</h3>
      <p><strong>Request Number:</strong> #{requestNumber}</p>
      <p><strong>Product:</strong> {productName}</p>
      <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">Rejected</span></p>
    </div>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #374151;">Reason for Rejection:</h4>
      <p style="margin-bottom: 0;">{adminResponse}</p>
    </div>
    
    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #374151;">What's Next?</h4>
      <ul style="margin-bottom: 0;">
        <li>If you disagree with this decision, please contact our customer service</li>
        <li>You may submit a new request with additional information</li>
        <li>We're here to help resolve any concerns you may have</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://yourwebsite.com/contact" style="background-color: #dc2626; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Contact Support</a>
    </div>
    
    <p>We apologize for any inconvenience and thank you for your understanding.</p>
    <p>Best regards,<br>Rosel Frozen Meat Supplier Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const LOW_STOCK_ALERT_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Low Stock Alert</title>
  <style>
    @media (prefers-color-scheme: dark) {
      body { background-color: #121212 !important; color: #eaeaea !important; }
    }
  </style>
  </head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #ecb232, #99452e); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Low Stock Alert</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello Admin,</p>
    <p>The following product is running low on stock and may require replenishment:</p>

    <div style="display: flex; gap: 12px; align-items: center; background-color: #ffffff; border: 1px solid #eee; border-left: 4px solid #ecb232; padding: 12px; border-radius: 6px;">
      <div style="width: 64px; height: 64px; background: #fafafa; display: flex; align-items: center; justify-content: center; border-radius: 6px; overflow: hidden;">
        <img src="{productImage}" alt="{productName}" style="max-width: 100%; max-height: 100%;"/>
      </div>
      <div>
        <div style="font-size: 16px; font-weight: bold; color: #99452e;">{productName}</div>
        <div style="font-size: 14px; color: #374151;">Current Stock: <strong>{currentStock}</strong> • Threshold: <strong>{threshold}</strong></div>
      </div>
    </div>

    <p style="margin-top: 16px;">Please review inventory levels and take action if necessary.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{manageUrl}" style="background-color: #99452e; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Inventory</a>
    </div>

    <p style="font-size: 12px; color: #6b7280;">This is an automated alert triggered when stock crosses the configured threshold.</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;