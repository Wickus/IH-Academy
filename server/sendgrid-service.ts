import { MailService } from '@sendgrid/mail';
import {config} from "dotenv";

if(process.env.NODE_ENV === "development") {
  config();
}

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email notifications will be disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
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
    console.log('Email sending skipped - no SendGrid API key configured');
    return false;
  }

  try {
    const fromEmail = params.from || process.env.FROM_EMAIL || 'no-reply@academy.itshappening.africa';
    await mailService.send({
      to: params.to,
      from: fromEmail,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function notifyGlobalAdminsNewOrganization(
  organization: any,
  creator: any,
  isFreeTrial: boolean = false
): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Email notification skipped - no SendGrid API key configured');
    return;
  }

  const trialText = isFreeTrial ? ' (Free Trial)' : '';
  const subject = `New Organization Created${trialText}: ${organization.name}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #20366B 0%, #278DD4 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">IH Academy</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Global Administrator Notification</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
        <h2 style="color: #20366B; margin: 0 0 20px 0; font-size: 20px;">
          New Organization Created${trialText}
        </h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Organization Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 30%;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; color: #374151;">${organization.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #374151;">${organization.email || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; color: #374151;">${organization.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Business Model:</strong></td>
              <td style="padding: 8px 0; color: #374151;">${organization.businessModel || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Plan Type:</strong></td>
              <td style="padding: 8px 0; color: #374151;">${organization.planType || 'free'}</td>
            </tr>
            ${isFreeTrial ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Trial Period:</strong></td>
              <td style="padding: 8px 0; color: #374151;">21 days</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Created By</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 30%;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; color: #374151;">${creator.name || creator.username}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #374151;">${creator.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;"><strong>Username:</strong></td>
              <td style="padding: 8px 0; color: #374151;">${creator.username}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #20366B; color: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 15px 0;">Access the Global Admin Dashboard to manage this organization:</p>
          <a href="https://academy.itshappening.africa/dashboard" 
             style="background: #24D367; color: #20366B; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            View Global Dashboard
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; margin: 20px 0 0 0; text-align: center;">
          This is an automated notification from IH Academy platform.<br>
          ${isFreeTrial ? 'The organization is on a 21-day free trial.' : 'Please follow up with setup and payment as needed.'}
        </p>
      </div>
    </div>
  `;

  const textContent = `
    New Organization Created${trialText}: ${organization.name}
    
    Organization Details:
    - Name: ${organization.name}
    - Email: ${organization.email || 'Not provided'}
    - Phone: ${organization.phone || 'Not provided'}
    - Business Model: ${organization.businessModel || 'Not specified'}
    - Plan Type: ${organization.planType || 'free'}
    ${isFreeTrial ? '- Trial Period: 21 days' : ''}
    
    Created By:
    - Name: ${creator.name || creator.username}
    - Email: ${creator.email}
    - Username: ${creator.username}
    
    Access the Global Admin Dashboard: https://academy.itshappening.africa/dashboard
    
    ${isFreeTrial ? 'This organization is on a 21-day free trial.' : 'Please follow up with setup and payment as needed.'}
  `;

  // Send to all global administrators - you can add more emails here
  const globalAdminEmails = [
    'admin@itshappening.africa',
    'support@itshappening.africa',
    'katlego@itshappening.africa'
  ];

  for (const email of globalAdminEmails) {
    try {
      await sendEmail({
        to: email,
        from: process.env.FROM_EMAIL || 'no-reply@academy.itshappening.africa',
        subject,
        text: textContent,
        html: htmlContent
      });
    } catch (error) {
      console.error(`Failed to send notification to ${email}:`, error);
    }
  }
}