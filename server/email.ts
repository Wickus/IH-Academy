import { MailService } from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendCoachInvitationEmail(
  organizationName: string,
  coachEmail: string,
  coachFirstName: string,
  coachLastName: string,
  invitationLink: string,
  organizationColors: { primaryColor: string; secondaryColor: string; accentColor: string }
): Promise<boolean> {
  const subject = `Coach Invitation - Join ${organizationName}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Coach Invitation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${organizationColors.primaryColor} 0%, ${organizationColors.secondaryColor} 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">ItsHappening.Africa</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Sports Academy Management Platform</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: ${organizationColors.primaryColor}; margin: 0 0 20px 0; font-size: 24px;">You're Invited to Coach!</h2>
          
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            Hello ${coachFirstName} ${coachLastName},
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
            You've been invited to join <strong style="color: ${organizationColors.primaryColor};">${organizationName}</strong> as a professional coach on the ItsHappening.Africa platform.
          </p>
          
          <p style="color: #374151; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
            As a coach, you'll be able to:
          </p>
          
          <ul style="color: #374151; line-height: 1.6; margin: 0 0 30px 20px; font-size: 16px;">
            <li>Manage your class schedules and availability</li>
            <li>Track student attendance and progress</li>
            <li>Handle walk-in registrations and payments</li>
            <li>Work across multiple sports organizations</li>
            <li>Access comprehensive reporting tools</li>
          </ul>
          
          <!-- Call to Action Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${invitationLink}" 
               style="background: linear-gradient(135deg, ${organizationColors.accentColor} 0%, ${organizationColors.secondaryColor} 100%); 
                      color: white; 
                      text-decoration: none; 
                      padding: 16px 32px; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block; 
                      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                      transition: transform 0.2s;">
              Complete Your Registration
            </a>
          </div>
          
          <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
              <strong>Important:</strong> This invitation will expire in 7 days.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              If you can't click the button above, copy and paste this link into your browser:
            </p>
            <p style="color: ${organizationColors.secondaryColor}; font-size: 14px; margin: 10px 0 0 0; word-break: break-all;">
              ${invitationLink}
            </p>
          </div>
          
          <p style="color: #374151; line-height: 1.6; margin: 30px 0 0 0; font-size: 16px;">
            Welcome to the team!<br>
            <strong style="color: ${organizationColors.primaryColor};">The ${organizationName} Team</strong>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
            This email was sent by ItsHappening.Africa on behalf of ${organizationName}
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Empowering African sports communities through technology
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Coach Invitation - Join ${organizationName}
    
    Hello ${coachFirstName} ${coachLastName},
    
    You've been invited to join ${organizationName} as a professional coach on the ItsHappening.Africa platform.
    
    As a coach, you'll be able to:
    - Manage your class schedules and availability
    - Track student attendance and progress
    - Handle walk-in registrations and payments
    - Work across multiple sports organizations
    - Access comprehensive reporting tools
    
    Complete your registration by visiting: ${invitationLink}
    
    Important: This invitation will expire in 7 days.
    
    Welcome to the team!
    The ${organizationName} Team
    
    --
    This email was sent by ItsHappening.Africa on behalf of ${organizationName}
    Empowering African sports communities through technology
  `;

  return await sendEmail({
    to: coachEmail,
    from: 'noreply@itshappening.africa',
    subject,
    text: textContent,
    html: htmlContent,
  });
}