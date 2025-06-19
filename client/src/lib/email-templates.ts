import { Organization } from "./api";

export function generateInviteEmailTemplate(organization: Organization): {
  subject: string;
  body: string;
} {
  const inviteUrl = `${window.location.origin}/invite/${organization.inviteCode}`;
  
  const subject = `You're invited to join ${organization.name}!`;
  
  const body = `Dear Friend,

I'm excited to invite you to join ${organization.name} on ItsHappening.Africa!

${organization.description ? `About ${organization.name}:
${organization.description}

` : ''}We offer amazing sports activities and classes that I think you'd love. By joining our community, you'll get:

✓ Access to all our sports classes and activities
✓ Easy online booking and scheduling
✓ Professional coaching and instruction
✓ Track your progress and achievements
✓ Connect with other sports enthusiasts

Getting started is simple - just click the link below to view our organization and join:

${inviteUrl}

Or use our quick invite code: ${organization.inviteCode}

I look forward to seeing you at our next session!

Best regards,
${organization.name} Team

---
This invitation was sent through ItsHappening.Africa - Empowering African sports communities through technology.
Visit: https://itshappening.africa`;

  return { subject, body };
}

export function generateInviteEmailHTML(organization: Organization): {
  subject: string;
  htmlBody: string;
} {
  const inviteUrl = `${window.location.origin}/invite/${organization.inviteCode}`;
  
  const subject = `You're invited to join ${organization.name}!`;
  
  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join ${organization.name}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, ${organization.primaryColor}15 0%, ${organization.secondaryColor}10 50%, ${organization.accentColor}05 100%); min-height: 100vh;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${organization.primaryColor} 0%, ${organization.secondaryColor} 100%); padding: 40px 30px; text-align: center; color: white;">
            ${organization.logo ? `
            <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <img src="${organization.logo}" alt="${organization.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" />
            </div>
            ` : `
            <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold; color: white;">
                ${organization.name.charAt(0)}
            </div>
            `}
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                You're Invited!
            </h1>
            <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">
                Join ${organization.name} for amazing sports activities
            </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px; color: ${organization.primaryColor}; font-size: 24px;">
                    Welcome to Our Sports Community!
                </h2>
                <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                    We're excited to invite you to join our vibrant sports community where fitness meets fun.
                </p>
            </div>

            ${organization.description ? `
            <div style="background: ${organization.secondaryColor}08; border-left: 4px solid ${organization.secondaryColor}; padding: 20px; margin: 30px 0; border-radius: 6px;">
                <h3 style="margin: 0 0 10px; color: ${organization.primaryColor}; font-size: 18px;">About ${organization.name}</h3>
                <p style="margin: 0; color: #374151; line-height: 1.6;">
                    ${organization.description}
                </p>
            </div>
            ` : ''}

            <!-- Benefits -->
            <div style="margin: 30px 0;">
                <h3 style="margin: 0 0 20px; color: ${organization.primaryColor}; font-size: 20px; text-align: center;">
                    What You'll Get
                </h3>
                <div style="display: grid; gap: 15px;">
                    <div style="display: flex; align-items: center; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${organization.accentColor};">
                        <div style="width: 24px; height: 24px; background: ${organization.accentColor}; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">✓</div>
                        <span style="color: #374151; font-size: 16px;">Access to all our sports classes and activities</span>
                    </div>
                    <div style="display: flex; align-items: center; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${organization.accentColor};">
                        <div style="width: 24px; height: 24px; background: ${organization.accentColor}; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">✓</div>
                        <span style="color: #374151; font-size: 16px;">Easy online booking and scheduling</span>
                    </div>
                    <div style="display: flex; align-items: center; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${organization.accentColor};">
                        <div style="width: 24px; height: 24px; background: ${organization.accentColor}; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">✓</div>
                        <span style="color: #374151; font-size: 16px;">Professional coaching and instruction</span>
                    </div>
                    <div style="display: flex; align-items: center; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${organization.accentColor};">
                        <div style="width: 24px; height: 24px; background: ${organization.accentColor}; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">✓</div>
                        <span style="color: #374151; font-size: 16px;">Track your progress and achievements</span>
                    </div>
                    <div style="display: flex; align-items: center; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid ${organization.accentColor};">
                        <div style="width: 24px; height: 24px; background: ${organization.accentColor}; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">✓</div>
                        <span style="color: #374151; font-size: 16px;">Connect with other sports enthusiasts</span>
                    </div>
                </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="${inviteUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${organization.primaryColor} 0%, ${organization.secondaryColor} 100%); color: white; text-decoration: none; padding: 18px 40px; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 6px 20px ${organization.primaryColor}40; transition: all 0.3s ease;">
                    Join ${organization.name} Now
                </a>
            </div>

            <!-- Alternative -->
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px; border: 2px dashed ${organization.secondaryColor};">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                    Can't click the button? Use our quick invite code:
                </p>
                <div style="display: inline-block; background: white; padding: 12px 20px; border-radius: 6px; border: 1px solid ${organization.secondaryColor}; font-family: monospace; font-size: 16px; font-weight: bold; color: ${organization.primaryColor};">
                    ${organization.inviteCode}
                </div>
                <p style="margin: 10px 0 0; color: #6b7280; font-size: 14px;">
                    Visit: <a href="${inviteUrl}" style="color: ${organization.primaryColor};">${inviteUrl}</a>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                This invitation was sent through ItsHappening.Africa
            </p>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Empowering African sports communities through technology
            </p>
        </div>
    </div>
</body>
</html>`;

  return { subject, htmlBody };
}