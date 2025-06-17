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
      text: params.text || "",
      html: params.html,
    });
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    if (error.response?.body?.errors) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body.errors, null, 2));
    }
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
  // For now, we'll display the invitation details in the console
  // This ensures the invitation system works while email delivery is being set up
  console.log(`
=== COACH INVITATION ===
Organization: ${organizationName}
Coach: ${coachFirstName} ${coachLastName}
Email: ${coachEmail}
Invitation Link: ${invitationLink}
Expires: 7 days from now
========================
  `);
  
  // Still attempt SendGrid email delivery
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
        <div style="background: linear-gradient(135deg, #20366B 0%, #278DD4 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff !important; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">ItsHappening.Africa</h1>
          <p style="color: #ffffff !important; opacity: 0.95; margin: 8px 0 0 0; font-size: 16px;">Sports Academy Management Platform</p>
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
               style="background: linear-gradient(135deg, #24D367 0%, #278DD4 100%); 
                      color: #ffffff !important; 
                      text-decoration: none; 
                      padding: 16px 32px; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block; 
                      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
                      border: 2px solid #24D367;
                      text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
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

  // Try to send email, but don't fail the invitation process if email fails
  try {
    const emailSent = await sendEmail({
      to: coachEmail,
      from: 'info@itshappening.africa',
      subject,
      text: textContent,
      html: htmlContent,
    });
    
    if (emailSent) {
      console.log(`Email successfully sent to ${coachEmail}`);
    }
    
    return emailSent;
  } catch (error) {
    console.error('Email sending failed, but invitation was created successfully');
    return false; // Don't block the invitation process
  }
}

export async function sendCoachAssignmentEmail(
  email: string,
  coachName: string,
  classData: any,
  icalContent: string
): Promise<boolean> {
  const classDate = new Date(classData.startTime).toLocaleDateString();
  const classTime = new Date(classData.startTime).toLocaleTimeString();
  
  const subject = `Class Assignment - ${classData.name}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Class Assignment</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #20366B 0%, #278DD4 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">ItsHappening.Africa</h1>
          <p style="color: #ffffff; opacity: 0.95; margin: 8px 0 0 0; font-size: 16px;">Class Assignment Notification</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #20366B; margin: 0 0 20px 0; font-size: 24px;">You've been assigned to coach: ${classData.name}</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello ${coachName},</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">You have been assigned to coach the following class:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #278DD4;">
            <h3 style="color: #20366B; margin: 0 0 15px 0; font-size: 20px;">${classData.name}</h3>
            <p style="color: #475569; margin: 5px 0;"><strong>Date:</strong> ${classDate}</p>
            <p style="color: #475569; margin: 5px 0;"><strong>Time:</strong> ${classTime}</p>
            <p style="color: #475569; margin: 5px 0;"><strong>Location:</strong> ${classData.location || 'TBA'}</p>
            <p style="color: #475569; margin: 5px 0;"><strong>Capacity:</strong> ${classData.capacity} participants</p>
            ${classData.description ? `<p style="color: #475569; margin: 5px 0;"><strong>Description:</strong> ${classData.description}</p>` : ''}
          </div>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0;">A calendar event has been attached to this email so you can add it to your calendar.</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 20px 0;">Please log in to your coach dashboard to view more details and manage this class.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Class Assignment - ${classData.name}
    
    Hello ${coachName},
    
    You have been assigned to coach: ${classData.name}
    
    Class Details:
    - Date: ${classDate}
    - Time: ${classTime}
    - Location: ${classData.location || 'TBA'}
    - Capacity: ${classData.capacity} participants
    ${classData.description ? `- Description: ${classData.description}` : ''}
    
    A calendar event is attached to this email. Please check your coach dashboard for more details.
    
    --
    ItsHappening.Africa
  `;

  try {
    console.log(`Sending coach assignment email to ${email} for class: ${classData.name}`);
    
    const emailSent = await sendEmail({
      to: email,
      from: 'info@itshappening.africa',
      subject,
      text: textContent,
      html: htmlContent,
    });
    
    if (emailSent) {
      console.log(`Coach assignment email successfully sent to ${email}`);
    }
    
    return emailSent;
  } catch (error) {
    console.error('Coach assignment email failed:', error);
    return false;
  }
}