import sgMail from '@sendgrid/mail';

// Configure SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - emails will not be sent");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("SendGrid not configured - would send email:", params.subject, "to", params.to);
    return false;
  }

  try {
    console.log("Sending email via SendGrid to:", params.to);
    
    const msg = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };

    const response = await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      ...(params.html ? { html: params.html } : {}),
      ...(params.text ? { text: params.text } : {}),
    });
    console.log("Email sent successfully:", response[0].statusCode);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    
    // Log specific error details if available
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any;
      console.error('SendGrid error details:', sgError.response?.body);
    }
    
    return false;
  }
}