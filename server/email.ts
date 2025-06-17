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

export async function sendBookingMoveEmail(params: {
  to: string;
  participantName: string;
  oldClass: {
    name: string;
    startTime: Date;
    location: string | null;
  };
  newClass: {
    name: string;
    startTime: Date;
    location: string | null;
  };
  reason: string;
  organizationName: string;
}): Promise<boolean> {
  const { to, participantName, oldClass, newClass, reason, organizationName } = params;
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Johannesburg'
    }).format(date);
  };

  const subject = `Your Booking Has Been Moved - ${newClass.name}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #20366B 0%, #278DD4 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">ItsHappening.Africa</h1>
          <p style="color: #ffffff; opacity: 0.95; margin: 8px 0 0 0; font-size: 16px;">Booking Update Notification</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #ea580c; margin: 0 0 20px 0; font-size: 24px;">Your Booking Has Been Moved</h2>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Dear ${participantName},</p>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">We need to inform you that your booking has been moved to a different class.</p>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #92400e; font-size: 18px;">Reason for Change:</h3>
            <p style="margin-bottom: 0; color: #92400e; font-size: 16px;">${reason}</p>
          </div>

          <div style="margin: 30px 0;">
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
              <h4 style="margin-top: 0; color: #dc2626; font-size: 16px;">Previous Class</h4>
              <p style="margin: 8px 0; color: #374151;"><strong>Class:</strong> ${oldClass.name}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>Date & Time:</strong> ${formatDate(oldClass.startTime)}</p>
              ${oldClass.location ? `<p style="margin: 8px 0; color: #374151;"><strong>Location:</strong> ${oldClass.location}</p>` : ''}
            </div>
            
            <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #16a34a; font-size: 16px;">New Class</h4>
              <p style="margin: 8px 0; color: #374151;"><strong>Class:</strong> ${newClass.name}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>Date & Time:</strong> ${formatDate(newClass.startTime)}</p>
              ${newClass.location ? `<p style="margin: 8px 0; color: #374151;"><strong>Location:</strong> ${newClass.location}</p>` : ''}
            </div>
          </div>

          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Your booking details remain the same, only the class has changed. Please make sure to attend the new class at the updated time and location.</p>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">If you have any questions or concerns about this change, please don't hesitate to contact us.</p>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Thank you for your understanding.</p>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Best regards,<br><strong>${organizationName} Team</strong></p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            This email was sent by ItsHappening.Africa on behalf of ${organizationName}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Booking Update - ${organizationName}
    
    Dear ${participantName},
    
    We need to inform you that your booking has been moved to a different class.
    
    Reason for Change: ${reason}
    
    Previous Class:
    - Class: ${oldClass.name}
    - Date & Time: ${formatDate(oldClass.startTime)}
    ${oldClass.location ? `- Location: ${oldClass.location}` : ''}
    
    New Class:
    - Class: ${newClass.name}
    - Date & Time: ${formatDate(newClass.startTime)}
    ${newClass.location ? `- Location: ${newClass.location}` : ''}
    
    Your booking details remain the same, only the class has changed. Please make sure to attend the new class at the updated time and location.
    
    If you have any questions or concerns about this change, please don't hesitate to contact us.
    
    Thank you for your understanding.
    
    Best regards,
    The ${organizationName} Team
    
    --
    This email was sent by ItsHappening.Africa on behalf of ${organizationName}
  `;

  try {
    const emailSent = await sendEmail({
      to,
      from: 'info@itshappening.africa',
      subject,
      text: textContent,
      html: htmlContent,
    });
    
    if (emailSent) {
      console.log(`Booking move email successfully sent to ${to}`);
    }
    
    return emailSent;
  } catch (error) {
    console.error('Booking move email failed:', error);
    return false;
  }
}

export async function sendPaymentReminderEmail(params: {
  to: string;
  participantName: string;
  className: string;
  amount: string;
  classDate: Date;
  paymentUrl: string;
  organizationName: string;
}): Promise<boolean> {
  const { to, participantName, className, amount, classDate, paymentUrl, organizationName } = params;
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Johannesburg'
    }).format(date);
  };

  const subject = `Payment Reminder - ${className}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #20366B 0%, #278DD4 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">ItsHappening.Africa</h1>
          <p style="color: #ffffff; opacity: 0.95; margin: 8px 0 0 0; font-size: 16px;">Payment Reminder</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #ea580c; margin: 0 0 20px 0; font-size: 24px;">Payment Required</h2>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Dear ${participantName},</p>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">We hope you're looking forward to your upcoming class! We noticed that payment for your booking is still pending.</p>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #92400e; font-size: 18px;">Booking Details:</h3>
            <p style="margin: 8px 0; color: #92400e;"><strong>Class:</strong> ${className}</p>
            <p style="margin: 8px 0; color: #92400e;"><strong>Date & Time:</strong> ${formatDate(classDate)}</p>
            <p style="margin: 8px 0; color: #92400e;"><strong>Amount:</strong> R${amount}</p>
          </div>

          <p style="color: #374151; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">To secure your spot in this class, please complete your payment by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentUrl}" style="display: inline-block; background-color: #ea580c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Pay Now - R${amount}
            </a>
          </div>

          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">If you're unable to attend or no longer wish to participate, please let us know as soon as possible so we can offer your spot to someone else.</p>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">If you have any questions about your booking or payment, please don't hesitate to contact us.</p>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Thank you!</p>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Best regards,<br><strong>${organizationName} Team</strong></p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            This email was sent by ItsHappening.Africa on behalf of ${organizationName}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Payment Reminder - ${organizationName}
    
    Dear ${participantName},
    
    We hope you're looking forward to your upcoming class! We noticed that payment for your booking is still pending.
    
    Booking Details:
    - Class: ${className}
    - Date & Time: ${formatDate(classDate)}
    - Amount: R${amount}
    
    To secure your spot in this class, please complete your payment by visiting: ${paymentUrl}
    
    If you're unable to attend or no longer wish to participate, please let us know as soon as possible so we can offer your spot to someone else.
    
    If you have any questions about your booking or payment, please don't hesitate to contact us.
    
    Thank you!
    
    Best regards,
    The ${organizationName} Team
    
    --
    This email was sent by ItsHappening.Africa on behalf of ${organizationName}
  `;

  try {
    const emailSent = await sendEmail({
      to,
      from: 'info@itshappening.africa',
      subject,
      text: textContent,
      html: htmlContent,
    });
    
    if (emailSent) {
      console.log(`Payment reminder email successfully sent to ${to}`);
    }
    
    return emailSent;
  } catch (error) {
    console.error('Payment reminder email failed:', error);
    return false;
  }
}

export async function sendBookingCancellationEmail(params: {
  to: string;
  participantName: string;
  className: string;
  amount: string;
  classDate: Date;
  organizationName: string;
}): Promise<boolean> {
  const { to, participantName, className, amount, classDate, organizationName } = params;
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Johannesburg'
    }).format(date);
  };

  const subject = `Booking Cancelled - ${className}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Cancelled</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #20366B 0%, #278DD4 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">ItsHappening.Africa</h1>
          <p style="color: #ffffff; opacity: 0.95; margin: 8px 0 0 0; font-size: 16px;">Booking Cancellation</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">Booking Cancelled</h2>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Dear ${participantName},</p>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">We regret to inform you that your booking has been cancelled due to non-payment.</p>
          
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #dc2626; font-size: 18px;">Cancelled Booking Details:</h3>
            <p style="margin: 8px 0; color: #dc2626;"><strong>Class:</strong> ${className}</p>
            <p style="margin: 8px 0; color: #dc2626;"><strong>Date & Time:</strong> ${formatDate(classDate)}</p>
            <p style="margin: 8px 0; color: #dc2626;"><strong>Amount:</strong> R${amount}</p>
          </div>

          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">We understand that circumstances can change, and we're sorry to see you won't be joining us for this session.</p>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="margin-top: 0; color: #16a34a; font-size: 18px;">Want to Rebook?</h3>
            <p style="margin-bottom: 0; color: #16a34a;">If you still want to participate in our classes, you can easily rebook through our system and complete payment to secure your spot.</p>
          </div>

          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">We hope to see you in a future class! If you have any questions or need assistance with rebooking, please don't hesitate to contact us.</p>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Thank you for your understanding.</p>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Best regards,<br><strong>${organizationName} Team</strong></p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            This email was sent by ItsHappening.Africa on behalf of ${organizationName}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Booking Cancellation - ${organizationName}
    
    Dear ${participantName},
    
    We regret to inform you that your booking has been cancelled due to non-payment.
    
    Cancelled Booking Details:
    - Class: ${className}
    - Date & Time: ${formatDate(classDate)}
    - Amount: R${amount}
    
    We understand that circumstances can change, and we're sorry to see you won't be joining us for this session.
    
    Want to Rebook?
    If you still want to participate in our classes, you can easily rebook through our system and complete payment to secure your spot.
    
    We hope to see you in a future class! If you have any questions or need assistance with rebooking, please don't hesitate to contact us.
    
    Thank you for your understanding.
    
    Best regards,
    The ${organizationName} Team
    
    --
    This email was sent by ItsHappening.Africa on behalf of ${organizationName}
  `;

  try {
    const emailSent = await sendEmail({
      to,
      from: 'info@itshappening.africa',
      subject,
      text: textContent,
      html: htmlContent,
    });
    
    if (emailSent) {
      console.log(`Booking cancellation email successfully sent to ${to}`);
    }
    
    return emailSent;
  } catch (error) {
    console.error('Booking cancellation email failed:', error);
    return false;
  }
}