import type { Express, Request, Response } from "express";
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { payfastService, type PayFastPaymentData } from "./payfast";
import { debitOrderService } from "./debit-order";
import { db } from "./db";
import { organizations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "./email";

// Helper function to generate session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper function to get current user from session
function getCurrentUser(req: any): any {
  const sessionId = req.cookies?.sessionId;
  if (!sessionId) {
    console.log("No sessionId cookie found in request");
    return null;
  }

  const session = (global as any).activeSessions[sessionId];
  if (!session) {
    console.log(`Invalid session ID: ${sessionId}, active sessions: ${Object.keys((global as any).activeSessions || {}).length}`);
    return null;
  }

  return session;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize global sessions
  if (!(global as any).activeSessions) {
    (global as any).activeSessions = {};
  }

  // Create HTTP server
  const httpServer = app.listen(5001);

  // Organization Admin Management routes - GET admins
  app.get("/api/organizations/:id/admins", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      console.log("Getting admins for org", req.params.id, "user:", user?.username, "role:", user?.role);
      
      if (!user || !['organization_admin', 'global_admin'].includes(user.role)) {
        console.log("Access denied - user role:", user?.role);
        return res.status(403).json({ message: "Access denied" });
      }

      const organizationId = parseInt(req.params.id);
      
      // Check if user has access to this organization
      if (user.role === 'organization_admin') {
        const userOrgs = await storage.getUserOrganizations(user.id);
        console.log("User organizations:", userOrgs);
        const hasAccess = userOrgs.some(org => org.organizationId === organizationId);
        if (!hasAccess) {
          console.log("No access to organization", organizationId);
          return res.status(403).json({ message: "Access denied to this organization" });
        }
      }

      const admins = await storage.getOrganisationAdmins(organizationId);
      console.log("Found admins:", admins);
      res.json(admins);
    } catch (error) {
      console.error("Error fetching organization admins:", error);
      res.status(500).json({ message: "Failed to fetch organization admins" });
    }
  });

  // Organization Admin Management routes - INVITE admin
  app.post("/api/organizations/:id/invite-admin", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || !['organization_admin', 'global_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const organizationId = parseInt(req.params.id);
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Get organization details
      const organization = await storage.getOrganizationById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Check if user has access to this organization
      if (user.role === 'organization_admin') {
        const userOrgs = await storage.getUserOrganizations(user.id);
        const hasAccess = userOrgs.some(org => org.organizationId === organizationId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this organization" });
        }
      }

      // Check if user already exists with this email
      let invitedUser = await storage.getUserByEmail(email);
      let userCreated = false;

      if (!invitedUser) {
        // Auto-generate username from email
        const username = email.split('@')[0];
        
        // Create new user with temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        invitedUser = await storage.createUser({
          email,
          name: email, // Use email as name initially 
          username,
          password: tempPassword,
          role: 'organization_admin'
        });
        userCreated = true;
      }

      // Add user as admin to organization
      await storage.addUserToOrganization(invitedUser.id, organizationId, 'admin');

      // Prepare email content
      const inviteLink = `${req.protocol}://${req.headers.host}/login`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, ${organization.primaryColor || '#20366B'} 0%, ${organization.secondaryColor || '#278DD4'} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Join ${organization.name} as an Administrator</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: ${organization.primaryColor || '#20366B'}; margin-top: 0;">Welcome to the Team!</h2>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
              You've been invited to be an administrator for <strong>${organization.name}</strong> on IH Academy. 
              As an administrator, you'll be able to:
            </p>
            
            <ul style="color: #333; line-height: 1.8; margin-bottom: 25px; padding-left: 20px;">
              <li>Manage classes and schedules</li>
              <li>Handle member registrations and bookings</li>
              <li>Oversee coaches and assignments</li>
              <li>Access payment and analytics reports</li>
              <li>Configure organization settings</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background: ${organization.primaryColor || '#20366B'}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                Access Your Dashboard
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: ${organization.primaryColor || '#20366B'}; margin-top: 0; font-size: 16px;">Login Details:</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;">You'll be prompted to set a new password on first login.</p>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              Welcome to the team! If you have any questions, please contact your organization administrator.
            </p>
          </div>
        </div>`;
        
        const textContent = `Hello! You've been invited to be an administrator for ${organization.name} on IH Academy. As an administrator, you'll be able to manage classes, coaches, bookings, and organization settings. Access your dashboard at: ${inviteLink}. Email: ${email}. You'll be prompted to set a new password on first login. Welcome to the team!`;
        
        const emailSent = await sendEmail({
          to: email,
          from: process.env.FROM_EMAIL || 'noreply@itshappening.africa',
          subject: `You've been invited to manage ${organization.name}`,
          text: textContent,
          html: htmlContent
        });
        
        console.log("Email send result for", email, ":", emailSent);

      res.json({ 
        message: "Admin invitation sent successfully",
        userCreated,
        emailSent,
        adminId: invitedUser.id
      });
    } catch (error) {
      console.error("Error inviting admin:", error);
      res.status(500).json({ message: "Failed to send admin invitation" });
    }
  });

  // Basic auth endpoints
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await storage.authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const sessionId = generateSessionId();
      (global as any).activeSessions[sessionId] = user;

      res.cookie('sessionId', sessionId, { 
        httpOnly: true, 
        secure: false, 
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ user, sessionId });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      res.json({ user });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Authentication check failed" });
    }
  });

  return httpServer;
}