import sgMail from "@sendgrid/mail";
import '../utils/env.js';

const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

export const sender = {
  email: process.env.SENDGRID_SINGLE_SENDER,
  name: process.env.EMAIL_FROM_NAME || "Rosel",
};

export { sgMail };


