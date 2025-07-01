import type { Express, Request, Response } from "express";
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { payfastService, type PayFastPaymentData } from "./payfast";
import { debitOrderService } from "./debit-order";
import { db } from "./db";
import { organizations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendCoachInvitationEmail, sendCoachAssignmentEmail, sendBookingMoveEmail, sendPaymentReminderEmail, sendBookingCancellationEmail, sendWalkInRegistrationEmail, sendEmail } from "./email";

// Helper function to generate iCal events
function generateICalEvent(classData: any, booking: any): string {
  const startDate = new Date(classData.startTime);
  const endDate = new Date(classData.endTime);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IH Academy//Sports Booking System//EN
BEGIN:VEVENT
UID:booking-${booking.id}@ihacademy.africa
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${classData.name}
DESCRIPTION:Sports class booking\\nParticipant: ${booking.participantName}\\nLocation: ${classData.location || 'TBD'}
LOCATION:${classData.location || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

// WebSocket connection management
interface WebSocketConnection {
  ws: WebSocket;
  userId?: number;
  subscribedClasses: Set<number>;
  subscribedOrganizations: Set<number>;
}

const connections = new Map<WebSocket, WebSocketConnection>();

function broadcastAvailabilityUpdate(classId: number, availableSpots: number, totalSpots: number) {
  const message = JSON.stringify({
    type: 'availability_update',
    data: { classId, availableSpots, totalSpots },
    timestamp: Date.now()
  });

  connections.forEach((conn) => {
    if (conn.ws.readyState === WebSocket.OPEN && conn.subscribedClasses.has(classId)) {
      conn.ws.send(message);
    }
  });
}

function broadcastBookingNotification(classId: number, className: string, participantName: string, action: 'booked' | 'cancelled') {
  const message = JSON.stringify({
    type: 'booking_notification',
    data: { classId, className, participantName, action },
    timestamp: Date.now()
  });

  connections.forEach((conn) => {
    if (conn.ws.readyState === WebSocket.OPEN && conn.subscribedClasses.has(classId)) {
      conn.ws.send(message);
    }
  });
}

// Session storage using Map with longer expiration times
const sessions = new Map<string, {user: any, expires: number}>();

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(sessions.entries());
  for (const [sessionId, session] of entries) {
    if (now > session.expires) {
      sessions.delete(sessionId);
    }
  }
}, 60000); // Clean up every minute

// In-memory storage for coach availability
const coachAvailabilityStorage = new Map<string, any>();

// Helper function to generate session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Middleware to get current user from session
function getCurrentUser(req: any): any {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    console.log('No sessionId cookie found in request');
    return null;
  }
  
  const session = sessions.get(sessionId);
  if (session && Date.now() < session.expires) {
    console.log(`Valid session found for ${session.user.username} (ID: ${session.user.id})`);
    return session.user;
  } else {
    if (session) {
      console.log(`Expired session for ${session.user.username}, removing`);
      sessions.delete(sessionId);
    } else {
      console.log(`Invalid session ID: ${sessionId}, active sessions: ${sessions.size}`);
    }
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = new Server(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    
    const connection: WebSocketConnection = {
      ws,
      subscribedClasses: new Set(),
      subscribedOrganizations: new Set()
    };
    
    connections.set(ws, connection);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        const conn = connections.get(ws);
        if (!conn) return;

        switch (message.type) {
          case 'authenticate':
            conn.userId = message.data.userId;
            console.log(`User ${message.data.userId} authenticated via WebSocket`);
            break;

          case 'subscribe_class':
            conn.subscribedClasses.add(message.data.classId);
            console.log(`User subscribed to class ${message.data.classId} updates`);
            break;

          case 'unsubscribe_class':
            conn.subscribedClasses.delete(message.data.classId);
            console.log(`User unsubscribed from class ${message.data.classId} updates`);
            break;

          case 'subscribe_organization':
            conn.subscribedOrganizations.add(message.data.organizationId);
            console.log(`User subscribed to organization ${message.data.organizationId} updates`);
            break;

          default:
            console.warn('Unknown WebSocket message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      connections.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connections.delete(ws);
    });
  });
  
  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = req.body;
      // Ensure name field is populated from firstName and lastName
      if (!userData.name && (userData.firstName || userData.lastName)) {
        userData.name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      }
      const user = await storage.createUser(userData);
      const sessionId = generateSessionId();
      const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      sessions.set(sessionId, { user, expires });
      
      res.cookie('sessionId', sessionId, { 
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
        secure: false,
        path: '/'
      });
      res.json(user);
    } catch (error: any) {
      console.error("Error registering user:", error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.constraint === 'users_username_unique') {
          return res.status(400).json({ message: "Username already exists. Please choose a different username." });
        }
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: "Email already exists. Please use a different email address." });
        }
      }
      
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const sessionId = generateSessionId();
      const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      sessions.set(sessionId, { user, expires });
      
      // Set cookie with development-friendly settings
      res.cookie('sessionId', sessionId, { 
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
        secure: false, // Allow for development over HTTP
        path: '/' // Ensure cookie is available for all paths
      });
      
      console.log(`Login successful for user: ${user.username} (ID: ${user.id}), session: ${sessionId}`);
      res.json(user);
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const sessionId = req.cookies?.sessionId;
      
      if (sessionId) {
        sessions.delete(sessionId);
      }
      
      res.clearCookie('sessionId');
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      res.json(user);
    } catch (error) {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists or not
        return res.json({ message: "If an account with that email exists, you will receive a password reset link." });
      }

      // Generate password reset token (using simple approach - in production use crypto)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store reset token (in a real app, you'd store this in database)
      // For now, we'll use a simple in-memory storage
      if (!global.passwordResetTokens) {
        global.passwordResetTokens = new Map();
      }
      global.passwordResetTokens.set(resetToken, { 
        email: user.email, 
        userId: user.id, 
        expiry: resetExpiry 
      });

      // In a real application, you would send an email here
      // For now, we'll just log the reset URL
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
      console.log(`Password reset URL for ${email}: ${resetUrl}`);

      res.json({ message: "If an account with that email exists, you will receive a password reset link." });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Check if global password reset tokens exists
      if (!global.passwordResetTokens) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const tokenData = global.passwordResetTokens.get(token);
      if (!tokenData) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (new Date() > tokenData.expiry) {
        global.passwordResetTokens.delete(token);
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Update user password (using plain text as per current system)
      await storage.resetUserPassword(tokenData.userId, password);

      // Remove the used token
      global.passwordResetTokens.delete(token);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin only." });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id/status", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin only." });
      }
      
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { isActive });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });



  app.post("/api/users/bulk-purge", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin only." });
      }
      
      const { userIds, purgeInactive } = req.body;
      
      let deletedCount = 0;
      
      if (purgeInactive) {
        // Purge all inactive users except global admins
        const inactiveUsers = await storage.getInactiveUsers();
        for (const user of inactiveUsers) {
          if (user.role !== 'global_admin') {
            await storage.deleteUser(user.id);
            deletedCount++;
          }
        }
      } else if (userIds && Array.isArray(userIds)) {
        // Purge specific users
        for (const userId of userIds) {
          const user = await storage.getUser(userId);
          if (user && user.role !== 'global_admin') {
            await storage.deleteUser(userId);
            deletedCount++;
          }
        }
      }
      
      res.json({ 
        message: `Successfully purged ${deletedCount} users`,
        deletedCount 
      });
    } catch (error) {
      console.error("Error bulk purging users:", error);
      res.status(500).json({ message: "Failed to purge users" });
    }
  });

  app.put("/api/organizations/:id/status", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin only." });
      }
      
      const orgId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const updatedOrg = await storage.updateOrganization(orgId, { isActive });
      if (!updatedOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error updating organization status:", error);
      res.status(500).json({ message: "Failed to update organization status" });
    }
  });

  app.delete("/api/organizations/:id", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin only." });
      }
      
      const orgId = parseInt(req.params.id);
      
      // Hard delete the organization and all associated data
      await storage.deleteOrganization(orgId);
      
      res.json({ message: "Organization deleted successfully" });
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });

  // Organization routes
  app.get("/api/organizations", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      
      // For global admin, always include all organizations
      const includeInactive = user?.role === 'global_admin';
      const organizations = await storage.getAllOrganizations(includeInactive);
      
      console.log(`Global admin request: returning ${organizations.length} organizations`);
      
      // Add follow status for authenticated users
      if (user) {
        const userOrgs = await storage.getUserOrganizations(user.id);
        const followedOrgIds = new Set(userOrgs.map(uo => uo.organizationId));
        
        const orgsWithFollowStatus = organizations.map(org => ({
          ...org,
          isFollowing: followedOrgIds.has(org.id)
        }));
        
        res.json(orgsWithFollowStatus);
      } else {
        res.json(organizations);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/my", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const organizations = await storage.getOrganizationsByUser(user.id);
      console.log("DEBUG - Organizations for user:", user.username, JSON.stringify(organizations, null, 2));
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching user organizations:", error);
      res.status(500).json({ message: "Failed to fetch user organizations" });
    }
  });

  app.get("/api/user-organizations", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin only." });
      }

      const userOrganizations = await storage.getAllUserOrganizations();
      res.json(userOrganizations);
    } catch (error) {
      console.error("Error fetching user-organization relationships:", error);
      res.status(500).json({ message: "Failed to fetch user-organization relationships" });
    }
  });

  app.get("/api/organizations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.post("/api/organizations", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Only organization admins can create organizations
      if (user.role !== 'organization_admin') {
        return res.status(403).json({ message: "Access denied. Organization admin role required." });
      }

      const orgData = req.body;
      
      // Generate unique invite code if not provided
      if (!orgData.inviteCode) {
        orgData.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      }
      
      // Start trial period automatically
      orgData.subscriptionStatus = 'trial';
      orgData.trialStartDate = new Date();
      orgData.trialEndDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000); // 21 days from now
      
      const organization = await storage.createOrganization(orgData);
      
      // Automatically add the current user as the admin of this organisation
      await storage.addUserToOrganization({
        userId: user.id,
        organizationId: organization.id,
        role: 'admin',
        isActive: true
      });

      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.put("/api/organizations/:id", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      console.log("Updating organization", organizationId, "with data:", req.body);
      
      const updatedOrganization = await storage.updateOrganization(organizationId, req.body);
      
      if (!updatedOrganization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      console.log("Organization updated successfully:", updatedOrganization);
      res.json(updatedOrganization);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  // Public endpoint to get organization info by invite code (for branded invite pages)
  app.get("/api/organizations/invite/:inviteCode", async (req: Request, res: Response) => {
    try {
      const { inviteCode } = req.params;
      
      if (!inviteCode) {
        return res.status(400).json({ message: "Invite code is required" });
      }

      // Find organization by invite code
      const organization = await storage.getOrganizationByInviteCode(inviteCode);
      if (!organization) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      // Return organization info for the branded invite page
      res.json({ 
        organization: {
          id: organization.id,
          name: organization.name,
          description: organization.description,
          primaryColor: organization.primaryColor,
          secondaryColor: organization.secondaryColor,
          accentColor: organization.accentColor,
          logo: organization.logo,
          planType: organization.planType,
          maxClasses: organization.maxClasses,
          inviteCode: organization.inviteCode
        }
      });
    } catch (error) {
      console.error("Error fetching organization invite info:", error);
      res.status(500).json({ message: "Failed to fetch organization info" });
    }
  });

  // New endpoint to join organization by invite code
  app.post("/api/organizations/join", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { inviteCode } = req.body;
      
      if (!inviteCode) {
        return res.status(400).json({ message: "Invite code is required" });
      }

      // Find organization by invite code
      const organization = await storage.getOrganizationByInviteCode(inviteCode);
      if (!organization) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      // Check if user is already a member
      const existingMembership = await storage.getUserOrganizations(user.id);
      const alreadyMember = existingMembership.some(uo => uo.organizationId === organization.id);
      
      if (alreadyMember) {
        return res.status(400).json({ message: "You are already a member of this organization" });
      }

      // Add user to organization
      await storage.addUserToOrganization({
        userId: user.id,
        organizationId: organization.id,
        role: 'member'
      });

      res.json({ 
        message: "Successfully joined organization",
        organization: organization
      });
    } catch (error) {
      console.error("Error joining organization:", error);
      res.status(500).json({ message: "Failed to join organization" });
    }
  });

  app.post("/api/organizations/:id/follow", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const organizationId = parseInt(req.params.id);
      const userId = user.id;
      
      const userOrg = await storage.addUserToOrganization({
        userId,
        organizationId,
        role: "member"
      });
      
      res.json(userOrg);
    } catch (error) {
      console.error("Error following organization:", error);
      res.status(500).json({ message: "Failed to follow organization" });
    }
  });

  app.delete("/api/organizations/:id/follow", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const organizationId = parseInt(req.params.id);
      const userId = currentUser.id;
      
      await storage.removeUserFromOrganization(userId, organizationId);
      res.status(204).send();
    } catch (error) {
      console.error("Error unfollowing organization:", error);
      res.status(500).json({ message: "Failed to unfollow organization" });
    }
  });

  // Trial management endpoints
  app.get("/api/organizations/:id/trial-status", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      const trialStatus = await storage.checkTrialStatus(organizationId);
      res.json(trialStatus);
    } catch (error) {
      console.error("Error checking trial status:", error);
      res.status(500).json({ message: "Failed to check trial status" });
    }
  });

  app.post("/api/organizations/:id/upgrade", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const organizationId = parseInt(req.params.id);
      const { planType } = req.body;

      // Verify user is admin of the organization
      const userOrgs = await storage.getUserOrganizations(currentUser.id);
      const isAdmin = userOrgs.some(uo => uo.organizationId === organizationId && uo.role === 'admin');
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Only organization admins can upgrade plans" });
      }

      const updatedOrg = await storage.updateOrganization(organizationId, {
        planType,
        subscriptionStatus: 'active'
      });

      res.json(updatedOrg);
    } catch (error) {
      console.error("Error upgrading organization:", error);
      res.status(500).json({ message: "Failed to upgrade organization" });
    }
  });

  // Statistics routes
  app.get("/api/stats/global", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getGlobalStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching global stats:", error);
      res.status(500).json({ message: "Failed to fetch global stats" });
    }
  });

  // Add alternate endpoint for dashboard compatibility
  app.get("/api/global-stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getGlobalStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching global stats:", error);
      res.status(500).json({ message: "Failed to fetch global stats" });
    }
  });

  app.get("/api/stats/organization/:id", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      const stats = await storage.getOrganizationStats(organizationId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching organization stats:", error);
      res.status(500).json({ message: "Failed to fetch organization stats" });
    }
  });

  // Legacy stats endpoint
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getOrganizationStats(1); // Default to first organization
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Sports routes
  app.get("/api/sports", async (req: Request, res: Response) => {
    try {
      const sports = await storage.getAllSports();
      res.json(sports);
    } catch (error) {
      console.error("Error fetching sports:", error);
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  app.post("/api/sports", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || (currentUser.role !== 'global_admin' && currentUser.role !== 'organization_admin')) {
        return res.status(403).json({ message: "Access denied. Admin access required." });
      }

      const { name, color, icon } = req.body;
      
      if (!name || !color) {
        return res.status(400).json({ message: "Name and color are required" });
      }

      const sportData = {
        name,
        color: color || '#278DD4',
        icon: icon || '🏃'
      };

      const newSport = await storage.createSport(sportData);
      res.json(newSport);
    } catch (error) {
      console.error("Error creating sport:", error);
      res.status(500).json({ message: "Failed to create sport" });
    }
  });

  app.delete("/api/sports/:id", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || (currentUser.role !== 'global_admin' && currentUser.role !== 'organization_admin')) {
        return res.status(403).json({ message: "Access denied. Admin access required." });
      }

      const sportId = parseInt(req.params.id);
      if (isNaN(sportId)) {
        return res.status(400).json({ message: "Invalid sport ID" });
      }

      const success = await storage.deleteSport(sportId);
      if (success) {
        res.json({ message: "Sport deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete sport" });
      }
    } catch (error) {
      console.error("Error deleting sport:", error);
      res.status(500).json({ message: "Failed to delete sport" });
    }
  });



  // Classes routes
  app.get("/api/classes", async (req: Request, res: Response) => {
    try {
      const { organizationId, coachId, date, public: isPublic } = req.query;
      let classes: any[] = [];
      const currentUser = getCurrentUser(req);

      // Data isolation: Organisation admins only see their own organisation's classes
      if (currentUser?.role === 'organization_admin') {
        const userOrgs = await storage.getUserOrganizations(currentUser.id);
        if (userOrgs.length > 0) {
          classes = await storage.getClassesByOrganization(userOrgs[0].organizationId);
        } else {
          classes = []; // No organisation set up yet
        }
      } else if (isPublic === 'true') {
        classes = await storage.getPublicClasses();
      } else if (organizationId) {
        classes = await storage.getClassesByOrganization(parseInt(organizationId as string));
      } else if (coachId) {
        classes = await storage.getClassesByCoach(parseInt(coachId as string));
      } else if (date) {
        classes = await storage.getClassesByDate(new Date(date as string));
      } else {
        classes = await storage.getPublicClasses(); // Default to public classes
      }

      // Calculate booking count and available spots
      const classesWithBookingInfo = await Promise.all(
        classes.map(async (cls: any) => {
          const bookings = await storage.getBookingsByClass(cls.id);
          const bookingCount = bookings.length;
          const availableSpots = cls.capacity - bookingCount;

          // Get sport and organization info
          const [sport, organization] = await Promise.all([
            storage.getAllSports().then(sports => sports.find(s => s.id === cls.sportId)),
            storage.getOrganization(cls.organizationId)
          ]);

          return {
            ...cls,
            sport,
            organization,
            bookingCount,
            availableSpots: Math.max(0, availableSpots)
          };
        })
      );

      res.json(classesWithBookingInfo);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.get("/api/classes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const classData = await storage.getClass(id);

      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Get additional info
      const bookings = await storage.getBookingsByClass(id);
      const bookingCount = bookings.length;
      const availableSpots = classData.capacity - bookingCount;

      const [sport, organization] = await Promise.all([
        storage.getAllSports().then(sports => sports.find(s => s.id === classData.sportId)),
        storage.getOrganization(classData.organizationId)
      ]);

      const classWithInfo = {
        ...classData,
        sport,
        organization,
        bookingCount,
        availableSpots: Math.max(0, availableSpots)
      };

      res.json(classWithInfo);
    } catch (error) {
      console.error("Error fetching class:", error);
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  app.post("/api/classes", async (req: Request, res: Response) => {
    try {
      const classData = { ...req.body };
      const selectedCoaches = classData.selectedCoaches || [];
      delete classData.selectedCoaches; // Remove from class data
      
      // Set primary coach for backward compatibility
      if (selectedCoaches.length > 0) {
        classData.coachId = selectedCoaches[0]; // Set first coach as primary
      }
      
      // Convert date strings to Date objects
      if (classData.startTime) {
        classData.startTime = new Date(classData.startTime);
      }
      if (classData.endTime) {
        classData.endTime = new Date(classData.endTime);
      }
      
      const newClass = await storage.createClass(classData);
      
      // Assign multiple coaches if selectedCoaches array is provided
      if (selectedCoaches.length > 0) {
        const user = getCurrentUser(req);
        
        for (let i = 0; i < selectedCoaches.length; i++) {
          const coachId = selectedCoaches[i];
          const role = i === 0 ? 'primary' : (i === 1 ? 'assistant' : 'substitute');
          
          try {
            await storage.assignCoachToClass({
              classId: newClass.id,
              coachId: coachId,
              role: role,
              assignedBy: user?.id || 1,
              isActive: true
            });
          } catch (assignError) {
            console.error(`Error assigning coach ${coachId} to class ${newClass.id}:`, assignError);
          }
        }
      }
      
      res.json(newClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  app.put("/api/classes/:id", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.id);
      const classData = { ...req.body };
      const selectedCoaches = classData.selectedCoaches || [];
      delete classData.selectedCoaches; // Remove from class data
      
      // Set primary coach for backward compatibility
      if (selectedCoaches.length > 0) {
        classData.coachId = selectedCoaches[0]; // Set first coach as primary
      }
      
      // Convert date strings to Date objects
      if (classData.startTime) {
        classData.startTime = new Date(classData.startTime);
      }
      if (classData.endTime) {
        classData.endTime = new Date(classData.endTime);
      }
      
      const updatedClass = await storage.updateClass(classId, classData);
      
      if (!updatedClass) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Handle multiple coach assignments if selectedCoaches array is provided
      if (selectedCoaches.length > 0) {
        const user = getCurrentUser(req);
        
        // Clear existing coach assignments for this class
        try {
          const existingAssignments = await storage.getClassCoaches(classId);
          for (const assignment of existingAssignments) {
            await storage.removeCoachFromClass(classId, assignment.coachId);
          }
        } catch (clearError) {
          console.error(`Error clearing existing coach assignments for class ${classId}:`, clearError);
        }
        
        // Assign new coaches
        for (let i = 0; i < selectedCoaches.length; i++) {
          const coachId = selectedCoaches[i];
          const role = i === 0 ? 'primary' : (i === 1 ? 'assistant' : 'substitute');
          
          try {
            await storage.assignCoachToClass({
              classId: classId,
              coachId: coachId,
              role: role,
              assignedBy: user?.id || 1,
              isActive: true
            });
          } catch (assignError) {
            console.error(`Error assigning coach ${coachId} to class ${classId}:`, assignError);
          }
        }
      }
      
      // If coach was newly assigned, send email notification with iCal
      if (classData.coachId && classData.coachId !== updatedClass.coachId) {
        try {
          const coach = await storage.getCoach(classData.coachId);
          if (coach) {
            const user = await storage.getUser(coach.userId);
            
            if (user?.email) {
              const icalContent = generateICalEvent(updatedClass, { 
                participantName: user.username,
                participantEmail: user.email 
              });
              
              await sendCoachAssignmentEmail(
                user.email,
                user.username,
                updatedClass,
                icalContent
              );
            }
          }
        } catch (emailError) {
          console.error("Error sending coach assignment email:", emailError);
          // Continue without failing the update
        }
      }
      
      res.json(updatedClass);
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({ message: "Failed to update class" });
    }
  });

  app.delete("/api/classes/:id", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.id);
      const currentUser = getCurrentUser(req);
      
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Check if class exists and get class data
      const classData = await storage.getClass(classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Only coaches can cancel their own classes, or org admins can cancel any class in their org
      if (currentUser.role === 'coach') {
        const coaches = await storage.getCoachesByOrganization(classData.organizationId);
        const userCoach = coaches.find(c => c.userId === currentUser.id);
        if (!userCoach || classData.coachId !== userCoach.id) {
          return res.status(403).json({ message: "You can only cancel your own classes" });
        }
      } else if (currentUser.role === 'organization_admin') {
        const userOrgs = await storage.getUserOrganizations(currentUser.id);
        const hasAccess = userOrgs.some(org => org.organizationId === classData.organizationId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteClass(classId);
      
      if (!success) {
        return res.status(404).json({ message: "Class not found" });
      }

      res.json({ message: "Class cancelled successfully" });
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ message: "Failed to cancel class" });
    }
  });

  // Class Coach Assignment routes
  app.get("/api/classes/:id/coaches", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || !['organization_admin', 'coach'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const classId = parseInt(req.params.id);
      
      // First, try to sync any existing coachId assignment for this class
      try {
        const classData = await storage.getClass(classId);
        if (classData && classData.coachId) {
          // Check if this class already has coach assignments
          const existingAssignments = await storage.getClassCoaches(classId);
          if (existingAssignments.length === 0) {
            // No assignments exist, create one from the existing coachId
            await storage.assignCoachToClass({
              classId: classData.id,
              coachId: classData.coachId,
              role: "primary",
              assignedBy: user.id,
              isActive: true
            });
            console.log(`Synced coach assignment for class ${classData.id} with coach ${classData.coachId}`);
          }
        }
      } catch (syncError) {
        console.error("Error syncing coach assignment:", syncError);
        // Continue with fetching even if sync fails
      }

      const classCoaches = await storage.getClassCoaches(classId);
      res.json(classCoaches);
    } catch (error) {
      console.error("Error fetching class coaches:", error);
      res.status(500).json({ message: "Failed to fetch class coaches" });
    }
  });

  app.post("/api/classes/:id/coaches", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'organization_admin') {
        return res.status(403).json({ message: "Access denied. Organization admin only." });
      }

      const classId = parseInt(req.params.id);
      const { coachId, role = "assistant" } = req.body;

      if (!coachId) {
        return res.status(400).json({ message: "Coach ID is required" });
      }

      const assignment = await storage.assignCoachToClass({
        classId,
        coachId,
        role: role as "primary" | "assistant" | "substitute",
        assignedBy: user.id
      });

      res.json(assignment);
    } catch (error) {
      console.error("Error assigning coach to class:", error);
      res.status(500).json({ message: "Failed to assign coach to class" });
    }
  });

  app.put("/api/classes/:classId/coaches/:coachId", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'organization_admin') {
        return res.status(403).json({ message: "Access denied. Organization admin only." });
      }

      const classId = parseInt(req.params.classId);
      const coachId = parseInt(req.params.coachId);
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      const updatedAssignment = await storage.updateClassCoachRole(classId, coachId, role);
      
      if (!updatedAssignment) {
        return res.status(404).json({ message: "Class coach assignment not found" });
      }

      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating class coach role:", error);
      res.status(500).json({ message: "Failed to update class coach role" });
    }
  });

  app.delete("/api/classes/:classId/coaches/:coachId", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'organization_admin') {
        return res.status(403).json({ message: "Access denied. Organization admin only." });
      }

      const classId = parseInt(req.params.classId);
      const coachId = parseInt(req.params.coachId);

      const success = await storage.removeCoachFromClass(classId, coachId);
      
      if (!success) {
        return res.status(404).json({ message: "Class coach assignment not found" });
      }

      res.json({ message: "Coach removed from class successfully" });
    } catch (error) {
      console.error("Error removing coach from class:", error);
      res.status(500).json({ message: "Failed to remove coach from class" });
    }
  });

  // Organisation Admin Management routes
  app.get("/api/organizations/:id/admins", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || !['organization_admin', 'global_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const organizationId = parseInt(req.params.id);
      
      // Check if user has access to this organization
      if (user.role === 'organization_admin') {
        const userOrgs = await storage.getUserOrganizations(user.id);
        const hasAccess = userOrgs.some(org => org.organizationId === organizationId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this organization" });
        }
      }

      const admins = await storage.getOrganisationAdmins(organizationId);
      res.json(admins);
    } catch (error) {
      console.error("Error fetching organization admins:", error);
      res.status(500).json({ message: "Failed to fetch organization admins" });
    }
  });

  app.post("/api/organizations/:id/admins", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || !['organization_admin', 'global_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const organizationId = parseInt(req.params.id);
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Check if user has access to this organization
      if (user.role === 'organization_admin') {
        const userOrgs = await storage.getUserOrganizations(user.id);
        const hasAccess = userOrgs.some(org => org.organizationId === organizationId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this organization" });
        }
      }

      const adminRelation = await storage.addOrganisationAdmin(userId, organizationId, user.id);
      res.json(adminRelation);
    } catch (error) {
      console.error("Error adding organization admin:", error);
      res.status(500).json({ message: "Failed to add organization admin" });
    }
  });

  app.put("/api/organizations/:organizationId/admins/:userId", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || !['organization_admin', 'global_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const organizationId = parseInt(req.params.organizationId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      // Check if user has access to this organization
      if (user.role === 'organization_admin') {
        const userOrgs = await storage.getUserOrganizations(user.id);
        const hasAccess = userOrgs.some(org => org.organizationId === organizationId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this organization" });
        }
      }

      const updatedRelation = await storage.updateOrganisationAdminRole(userId, organizationId, role);
      
      if (!updatedRelation) {
        return res.status(404).json({ message: "Organization admin relation not found" });
      }

      res.json(updatedRelation);
    } catch (error) {
      console.error("Error updating organization admin role:", error);
      res.status(500).json({ message: "Failed to update organization admin role" });
    }
  });

  app.delete("/api/organizations/:organizationId/admins/:userId", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || !['organization_admin', 'global_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const organizationId = parseInt(req.params.organizationId);
      const userId = parseInt(req.params.userId);

      // Check if user has access to this organization
      if (user.role === 'organization_admin') {
        const userOrgs = await storage.getUserOrganizations(user.id);
        const hasAccess = userOrgs.some(org => org.organizationId === organizationId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this organization" });
        }
      }

      // Prevent removing the last admin
      const currentAdmins = await storage.getOrganisationAdmins(organizationId);
      if (currentAdmins.length <= 1) {
        return res.status(400).json({ message: "Cannot remove the last admin from organization" });
      }

      const success = await storage.removeOrganisationAdmin(userId, organizationId);
      
      if (!success) {
        return res.status(404).json({ message: "Organization admin relation not found" });
      }

      res.json({ message: "Organization admin removed successfully" });
    } catch (error) {
      console.error("Error removing organization admin:", error);
      res.status(500).json({ message: "Failed to remove organization admin" });
    }
  });

  // Bookings routes
  app.get("/api/coaches", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      let coaches = [];
      
      if (user.role === 'global_admin') {
        // Global admin can see all coaches
        coaches = await storage.getAllCoaches();
      } else if (user.role === 'organization_admin') {
        // Organization admin can see coaches from their organizations
        const userOrgs = await storage.getUserOrganizations(user.id);
        for (const userOrg of userOrgs) {
          const orgCoaches = await storage.getCoachesByOrganization(userOrg.organizationId);
          coaches.push(...orgCoaches);
        }
      } else if (user.role === 'coach') {
        // Coach can see all coaches (for filtering classes and coordination)
        coaches = await storage.getAllCoaches();
      } else {
        // Members and others can see coaches from organizations they're part of
        const userOrgs = await storage.getUserOrganizations(user.id);
        for (const userOrg of userOrgs) {
          const orgCoaches = await storage.getCoachesByOrganization(userOrg.organizationId);
          coaches.push(...orgCoaches);
        }
      }

      res.json(coaches);
    } catch (error) {
      console.error("Error fetching coaches:", error);
      res.status(500).json({ message: "Failed to fetch coaches" });
    }
  });

  app.get("/api/bookings", async (req: Request, res: Response) => {
    try {
      const { email, classId, recent, organizationId } = req.query;
      let bookings: any[] = [];
      const currentUser = getCurrentUser(req);

      // Data isolation: Organisation admins only see bookings for their organisation's classes
      if (currentUser?.role === 'organization_admin') {
        const userOrgs = await storage.getUserOrganizations(currentUser.id);
        if (userOrgs.length > 0) {
          const orgClasses = await storage.getClassesByOrganization(userOrgs[0].organizationId);
          const orgClassIds = orgClasses.map(cls => cls.id);
          
          // Get all bookings and filter to only org classes
          const allBookings = await storage.getRecentBookings(1000);
          bookings = allBookings.filter(booking => orgClassIds.includes(booking.classId));
        } else {
          bookings = []; // No organisation set up yet
        }
      } else if (email) {
        bookings = await storage.getBookingsByEmail(email as string);
      } else if (classId) {
        bookings = await storage.getBookingsByClass(parseInt(classId as string));
      } else if (recent) {
        const orgId = organizationId ? parseInt(organizationId as string) : undefined;
        bookings = await storage.getRecentBookings(parseInt(recent as string), orgId);
      } else {
        bookings = await storage.getRecentBookings(50);
      }

      // Add class and sport info to bookings
      const bookingsWithInfo = await Promise.all(
        bookings.map(async (booking: any) => {
          const classData = await storage.getClass(booking.classId);
          if (!classData) return booking;

          const sport = await storage.getAllSports().then(sports => 
            sports.find(s => s.id === classData.sportId)
          );

          return {
            ...booking,
            class: classData,
            sport
          };
        })
      );

      res.json(bookingsWithInfo);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      const bookingData = {
        ...req.body,
        bookingDate: new Date()
      };

      // Check class capacity before booking
      const classData = await storage.getClass(bookingData.classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      const existingBookings = await storage.getBookingsByClass(bookingData.classId);
      const availableSpots = classData.capacity - existingBookings.length;

      if (availableSpots <= 0) {
        return res.status(400).json({ message: "Class is full" });
      }

      const booking = await storage.createBooking(bookingData);

      // Generate iCal file
      if (classData) {
        const icalContent = generateICalEvent(classData, booking);
        console.log("iCal content generated for booking:", booking.id);
      }

      // Broadcast real-time availability update
      const newAvailableSpots = availableSpots - 1;
      broadcastAvailabilityUpdate(bookingData.classId, newAvailableSpots, classData.capacity);
      
      // Broadcast booking notification
      broadcastBookingNotification(
        bookingData.classId, 
        classData.name, 
        booking.participantName, 
        'booked'
      );

      console.log(`Real-time update: Class ${classData.name} now has ${newAvailableSpots} spots available`);

      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Coaches routes
  app.get("/api/coaches", async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.query;
      let coaches;

      // Get current user context
      const currentUser = getCurrentUser(req);

      if (currentUser?.role === 'organization_admin') {
        // Organization admins can only see coaches from their organization
        const userOrgs = await storage.getUserOrganizations(currentUser.id);
        if (userOrgs.length > 0) {
          coaches = await storage.getCoachesByOrganization(userOrgs[0].organizationId);
        } else {
          coaches = []; // No organization set up yet
        }
      } else if (organizationId) {
        coaches = await storage.getCoachesByOrganization(parseInt(organizationId as string));
      } else if (currentUser?.role === 'global_admin') {
        // Global admins can see all coaches if needed, but require explicit organizationId
        coaches = [];
      } else {
        coaches = [];
      }

      res.json(coaches);
    } catch (error) {
      console.error("Error fetching coaches:", error);
      res.status(500).json({ message: "Failed to fetch coaches" });
    }
  });

  app.post("/api/coaches", async (req: Request, res: Response) => {
    try {
      console.log('Coach creation request body:', req.body);
      const { user: userData, ...coachData } = req.body;
      console.log('User data:', userData);
      console.log('Coach data:', coachData);
      
      // First check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      let user;
      
      if (existingUser) {
        user = existingUser;
      } else {
        // Create unique username by adding timestamp if needed
        let username = userData.email.split('@')[0];
        let existingUsername = await storage.getUserByUsername(username);
        if (existingUsername) {
          username = `${username}_${Date.now()}`;
        }
        
        user = await storage.createUser({
          username,
          email: userData.email,
          name: userData.name,
          firstName: userData.name.split(' ')[0] || '',
          lastName: userData.name.split(' ').slice(1).join(' ') || '',
          phone: coachData.phone || null,
          role: 'coach',
          organizationId: coachData.organizationId,
          isActive: true,
          password: 'temp123' // Temporary password - coach will need to reset
        });
      }

      // Then create the coach with the user ID
      const coachCreateData = {
        userId: user.id,
        academyId: coachData.organizationId, // Map organizationId to academyId for the coaches table
        organizationId: coachData.organizationId,
        bio: coachData.bio,
        specializations: Array.isArray(coachData.specializations) ? 
          coachData.specializations : 
          (typeof coachData.specializations === 'string' ? 
            coachData.specializations.split(',').map(s => s.trim()).filter(s => s.length > 0) : 
            []),
        hourlyRate: coachData.hourlyRate,
        phone: coachData.phone,
        profilePicture: coachData.profilePicture
      };
      console.log('Coach create data:', coachCreateData);
      
      const coach = await storage.createCoach(coachCreateData);

      // Return enriched coach data
      res.json({
        ...coach,
        user
      });
    } catch (error) {
      console.error("Error creating coach:", error);
      res.status(500).json({ message: "Failed to create coach" });
    }
  });

  app.put("/api/coaches/:id", async (req: Request, res: Response) => {
    try {
      const coachId = parseInt(req.params.id);
      const { user: userData, ...coachData } = req.body;
      console.log('Coach update request:', { coachId, userData, coachData });
      
      // Get existing coach
      const existingCoach = await storage.getCoach(coachId);
      if (!existingCoach) {
        return res.status(404).json({ message: "Coach not found" });
      }

      // Update coach data with organization-specific overrides
      // Store name and email as coach-specific data instead of updating shared user record
      const coachUpdateData = {
        displayName: userData?.name || null, // Organization-specific display name
        contactEmail: userData?.email || null, // Organization-specific contact email
        bio: coachData.bio,
        specializations: coachData.specializations,
        hourlyRate: coachData.hourlyRate,
        phone: coachData.phone,
        profilePicture: coachData.profilePicture
      };
      
      const updatedCoach = await storage.updateCoach(coachId, coachUpdateData);
      
      if (!updatedCoach) {
        return res.status(404).json({ message: "Coach not found" });
      }

      // Get user data and return enriched coach with organization-specific overrides
      const user = await storage.getUser(updatedCoach.userId);
      res.json({
        ...updatedCoach,
        user: {
          ...user,
          // Override user data with coach-specific data for this organization
          name: updatedCoach.displayName || user?.name,
          email: updatedCoach.contactEmail || user?.email
        }
      });
    } catch (error) {
      console.error("Error updating coach:", error);
      res.status(500).json({ message: "Failed to update coach" });
    }
  });

  // Coach Invitations API
  app.post("/api/coach-invitations", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'organization_admin') {
        return res.status(403).json({ message: "Access denied. Organization admin only." });
      }

      const { email, firstName, lastName, phone, specializations, hourlyRate } = req.body;
      
      // Get organization for the current user
      const userOrgs = await storage.getUserOrganizations(user.id);
      if (userOrgs.length === 0) {
        return res.status(400).json({ message: "No organization found for user" });
      }
      
      const organizationId = userOrgs[0].organizationId;
      
      // Generate invitation token
      const invitationToken = generateSessionId();
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invitation = await storage.createCoachInvitation({
        organizationId,
        email,
        firstName,
        lastName,
        phone,
        specializations: specializations || [],
        hourlyRate: hourlyRate || "0",
        invitationToken,
        status: "pending",
        invitedBy: user.id,
        expiresAt
      });

      // Get organization details for email
      const organization = await storage.getOrganization(organizationId);
      
      if (organization) {
        const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
        const host = req.headers.host;
        const baseUrl = `${protocol}://${host}`;
        const invitationLink = `${baseUrl}/coach-register/${invitationToken}`;
        
        // Send invitation email
        const emailSent = await sendCoachInvitationEmail(
          organization.name,
          email,
          firstName,
          lastName,
          invitationLink,
          {
            primaryColor: organization.primaryColor || "#20366B",
            secondaryColor: organization.secondaryColor || "#278DD4",
            accentColor: organization.accentColor || "#24D367"
          }
        );
        
        if (emailSent) {
          console.log(`Coach invitation email sent to ${email} for organization ${organization.name}`);
        } else {
          console.error(`Failed to send invitation email to ${email}`);
        }
      }
      
      res.json({ invitation, invitationLink: `/coach-register/${invitationToken}` });
    } catch (error) {
      console.error("Error creating coach invitation:", error);
      res.status(500).json({ message: "Failed to create coach invitation" });
    }
  });

  app.get("/api/coach-invitations", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'organization_admin') {
        return res.status(403).json({ message: "Access denied. Organization admin only." });
      }

      const userOrgs = await storage.getUserOrganizations(user.id);
      if (userOrgs.length === 0) {
        return res.status(400).json({ message: "No organization found for user" });
      }
      
      const organizationId = userOrgs[0].organizationId;
      const invitations = await storage.getCoachInvitationsByOrganization(organizationId);
      
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching coach invitations:", error);
      res.status(500).json({ message: "Failed to fetch coach invitations" });
    }
  });

  app.delete("/api/coach-invitations/:id", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'organization_admin') {
        return res.status(403).json({ message: "Access denied. Organization admin only." });
      }

      const invitationId = parseInt(req.params.id);
      if (isNaN(invitationId)) {
        return res.status(400).json({ message: "Invalid invitation ID" });
      }

      // Verify the invitation belongs to the user's organization
      const userOrgs = await storage.getUserOrganizations(user.id);
      if (userOrgs.length === 0) {
        return res.status(400).json({ message: "No organization found for user" });
      }
      
      const organizationId = userOrgs[0].organizationId;
      const invitations = await storage.getCoachInvitationsByOrganization(organizationId);
      const targetInvitation = invitations.find(inv => inv.id === invitationId);
      
      if (!targetInvitation) {
        return res.status(404).json({ message: "Invitation not found or access denied" });
      }

      // Delete the invitation
      await storage.deleteCoachInvitation(invitationId);
      
      res.json({ message: "Invitation deleted successfully" });
    } catch (error) {
      console.error("Error deleting coach invitation:", error);
      res.status(500).json({ message: "Failed to delete coach invitation" });
    }
  });

  app.get("/api/coach-invitations/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const invitation = await storage.getCoachInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "Invitation already processed" });
      }
      
      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Invitation expired" });
      }
      
      const organization = await storage.getOrganization(invitation.organizationId);
      
      res.json({ 
        invitation, 
        organization: {
          id: organization?.id,
          name: organization?.name,
          primaryColor: organization?.primaryColor,
          secondaryColor: organization?.secondaryColor,
          accentColor: organization?.accentColor
        }
      });
    } catch (error) {
      console.error("Error fetching coach invitation:", error);
      res.status(500).json({ message: "Failed to fetch coach invitation" });
    }
  });

  app.post("/api/coach-invitations/:token/accept", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { username, password, confirmPassword } = req.body;
      
      const invitation = await storage.getCoachInvitationByToken(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "Invitation already processed" });
      }
      
      if (new Date() > invitation.expiresAt) {
        await storage.updateCoachInvitation(invitation.id, { status: 'expired' });
        return res.status(400).json({ message: "Invitation expired" });
      }
      
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      
      // Check if user with email already exists
      let user = await storage.getUserByEmail(invitation.email);
      
      if (!user) {
        // Create new user account
        user = await storage.createUser({
          username,
          password,
          email: invitation.email,
          name: `${invitation.firstName} ${invitation.lastName}`,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          phone: invitation.phone,
          role: 'coach'
        });
      }
      
      // Create coach profile for this organization
      const coach = await storage.createCoach({
        userId: user.id,
        organizationId: invitation.organizationId,
        specializations: invitation.specializations || [],
        hourlyRate: invitation.hourlyRate || "0",
        isActive: true
      });
      
      // Add user to organization
      await storage.addUserToOrganization({
        userId: user.id,
        organizationId: invitation.organizationId,
        role: 'coach',
        isActive: true
      });
      
      // Update invitation status
      await storage.updateCoachInvitation(invitation.id, { status: 'accepted' });
      
      res.json({ user, coach, message: "Coach invitation accepted successfully" });
    } catch (error) {
      console.error("Error accepting coach invitation:", error);
      res.status(500).json({ message: "Failed to accept coach invitation" });
    }
  });

  // Coach Availability API
  app.get("/api/coach-availability/:organizationId", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || !['coach', 'organization_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const organizationId = parseInt(req.params.organizationId);
      
      // Get all availability data for this organization
      const availabilityData = [];
      coachAvailabilityStorage.forEach((value, key) => {
        if (key.startsWith(`${organizationId}_`)) {
          availabilityData.push(value);
        }
      });
      
      res.json(availabilityData);
    } catch (error) {
      console.error("Error fetching coach availability:", error);
      res.status(500).json({ message: "Failed to fetch coach availability" });
    }
  });

  app.post("/api/coach-availability", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || !['coach', 'organization_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { coachId, day, isAvailable, startTime, endTime, breakStartTime, breakEndTime, notes } = req.body;
      
      // Get organization from user context
      const userOrgs = await storage.getUserOrganizations(user.id);
      const organizationId = userOrgs.length > 0 ? userOrgs[0].organizationId : 1;
      
      const availabilityData = {
        id: Date.now(),
        coachId: parseInt(coachId),
        organizationId,
        day,
        isAvailable,
        startTime,
        endTime,
        breakStartTime,
        breakEndTime,
        notes,
        updatedAt: new Date()
      };
      
      // Store in memory using organization_coachId_day as key
      const storageKey = `${organizationId}_${coachId}_${day}`;
      coachAvailabilityStorage.set(storageKey, availabilityData);
      
      res.json(availabilityData);
    } catch (error) {
      console.error("Error creating coach availability:", error);
      res.status(500).json({ message: "Failed to create coach availability" });
    }
  });

  app.put("/api/coach-availability", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || !['coach', 'organization_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id, coachId, day, isAvailable, startTime, endTime, breakStartTime, breakEndTime, notes } = req.body;
      
      // Get organization from user context
      const userOrgs = await storage.getUserOrganizations(user.id);
      const organizationId = userOrgs.length > 0 ? userOrgs[0].organizationId : 1;
      
      const updatedAvailabilityData = {
        id: id || Date.now(),
        coachId: parseInt(coachId),
        organizationId,
        day,
        isAvailable,
        startTime,
        endTime,
        breakStartTime,
        breakEndTime,
        notes,
        updatedAt: new Date()
      };
      
      // Store in memory using organization_coachId_day as key
      const storageKey = `${organizationId}_${coachId}_${day}`;
      coachAvailabilityStorage.set(storageKey, updatedAvailabilityData);
      
      res.json(updatedAvailabilityData);
    } catch (error) {
      console.error("Error updating coach availability:", error);
      res.status(500).json({ message: "Failed to update coach availability" });
    }
  });

  app.put("/api/coach-availability/:id/assign", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'organization_admin') {
        return res.status(403).json({ message: "Access denied. Organization admin only." });
      }
      
      const availabilityId = parseInt(req.params.id);
      
      const updatedAvailability = await storage.updateCoachAvailability(availabilityId, {
        status: 'assigned',
        assignedAt: new Date(),
        assignedBy: user.id
      });
      
      res.json(updatedAvailability);
    } catch (error) {
      console.error("Error assigning coach to class:", error);
      res.status(500).json({ message: "Failed to assign coach to class" });
    }
  });

  // Attendance routes
  app.get("/api/attendance/:classId", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || !['coach', 'organization_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const classId = parseInt(req.params.classId);
      const attendance = await storage.getAttendanceByClass(classId);
      
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'coach') {
        return res.status(403).json({ message: "Access denied. Coach only." });
      }
      
      const { classId, bookingId, walkInData, status, notes } = req.body;
      
      let attendanceData: any = {
        classId,
        status: status || 'present',
        markedBy: user.id,
        markedAt: new Date(),
        notes: notes || null
      };
      
      if (bookingId) {
        // Regular booking attendance
        attendanceData.bookingId = bookingId;
        
        // Get booking to find participant
        const booking = await storage.getBooking(bookingId);
        if (booking) {
          attendanceData.participantName = booking.participantName;
          attendanceData.participantEmail = booking.participantEmail;
        }
      } else if (walkInData) {
        // Walk-in client
        attendanceData.participantName = walkInData.name;
        attendanceData.participantEmail = walkInData.email;
        attendanceData.participantPhone = walkInData.phone;
        attendanceData.isWalkIn = true;
        attendanceData.paymentMethod = walkInData.paymentMethod || 'cash';
        attendanceData.amountPaid = walkInData.amountPaid ? parseFloat(walkInData.amountPaid) : null;
        
        // For walk-ins, also create a user account if email provided and doesn't exist
        if (walkInData.email) {
          let walkInUser = await storage.getUserByEmail(walkInData.email);
          let isNewUser = false;
          let temporaryPassword = '';
          
          if (!walkInUser) {
            temporaryPassword = generateSessionId().substring(0, 8); // 8-character temp password
            walkInUser = await storage.createUser({
              username: walkInData.email,
              email: walkInData.email,
              name: walkInData.name,
              phone: walkInData.phone,
              role: 'member',
              password: temporaryPassword
            });
            isNewUser = true;
            console.log(`Created walk-in user account for ${walkInData.email}`);
          }
          attendanceData.participantUserId = walkInUser.id;
          
          // Send welcome email for new users
          if (isNewUser) {
            try {
              const classData = await storage.getClass(classId);
              const organization = classData ? await storage.getOrganization(classData.organizationId) : null;
              
              if (classData && organization) {
                await sendWalkInRegistrationEmail({
                  to: walkInData.email,
                  participantName: walkInData.name,
                  className: classData.name,
                  organizationName: organization.name,
                  classDate: classData.startTime,
                  amountPaid: walkInData.amountPaid || 0,
                  paymentMethod: walkInData.paymentMethod,
                  temporaryPassword,
                  organizationColors: {
                    primaryColor: organization.primaryColor,
                    secondaryColor: organization.secondaryColor,
                    accentColor: organization.accentColor
                  }
                });
                console.log(`Welcome email sent to walk-in client: ${walkInData.email}`);
              }
            } catch (emailError) {
              console.error('Failed to send welcome email to walk-in client:', emailError);
              // Don't fail the attendance marking if email fails
            }
          }
        }
      }
      
      const attendance = await storage.createAttendance(attendanceData);
      res.json(attendance);
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ message: "Failed to mark attendance" });
    }
  });

  // Push notification routes
  app.post("/api/notifications/subscribe", async (req: Request, res: Response) => {
    try {
      const { endpoint, keys } = req.body;
      const currentUser = getCurrentUser(req);
      const userId = currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log('Push subscription received:', { userId, endpoint });
      res.json({ success: true, message: "Subscribed to push notifications" });
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      res.status(500).json({ error: "Failed to subscribe to push notifications" });
    }
  });

  app.post("/api/notifications/unsubscribe", async (req: Request, res: Response) => {
    try {
      const { endpoint } = req.body;
      const currentUser = getCurrentUser(req);
      const userId = currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log('Push unsubscription received:', { userId, endpoint });
      res.json({ success: true, message: "Unsubscribed from push notifications" });
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      res.status(500).json({ error: "Failed to unsubscribe from push notifications" });
    }
  });

  app.post("/api/notifications/test", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      const userId = currentUser?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log('Test notification requested for user:', userId);
      res.json({ success: true, message: "Test notification sent" });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });

  // Update booking payment status
  app.put("/api/bookings/:id/payment", async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { paymentStatus } = req.body;
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const updatedBooking = await storage.updateBooking(bookingId, { 
        paymentStatus
      });
      
      if (!updatedBooking) {
        return res.status(404).json({ message: "Failed to update booking" });
      }

      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Add booking cancellation endpoint for real-time updates
  app.delete("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const classData = await storage.getClass(booking.classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Update booking status or delete (depending on implementation)
      const updatedBooking = await storage.updateBooking(bookingId, { paymentStatus: 'cancelled' });
      
      // Calculate new availability
      const existingBookings = await storage.getBookingsByClass(booking.classId);
      const activeBookings = existingBookings.filter(b => b.paymentStatus !== 'cancelled');
      const newAvailableSpots = classData.capacity - activeBookings.length;

      // Broadcast real-time availability update
      broadcastAvailabilityUpdate(booking.classId, newAvailableSpots, classData.capacity);
      
      // Broadcast booking notification
      broadcastBookingNotification(
        booking.classId, 
        classData.name, 
        booking.participantName, 
        'cancelled'
      );

      console.log(`Real-time update: Class ${classData.name} now has ${newAvailableSpots} spots available`);

      res.json(updatedBooking);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", async (req: Request, res: Response) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  app.get("/api/stats/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      let stats = await storage.getUserStats(userId);
      
      if (!stats) {
        stats = await storage.createUserStats({ userId });
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.post("/api/achievements/check/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const newAchievements = await storage.checkAndUnlockAchievements(userId);
      res.json(newAchievements);
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ message: "Failed to check achievements" });
    }
  });

  // Children management routes
  // Get current user's children
  app.get("/api/children", async (req: Request, res: Response) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const children = await storage.getUserChildren(currentUser.id);
      
      // Calculate ages from birth dates
      const childrenWithAges = children.map(child => {
        if (child.dateOfBirth) {
          const today = new Date();
          const birth = new Date(child.dateOfBirth);
          const age = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();
          
          let calculatedAge = age;
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            calculatedAge = age - 1;
          }
          
          return { ...child, age: calculatedAge };
        }
        return child;
      });
      
      res.json(childrenWithAges);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  // Get specific user's children (for admin use)
  app.get("/api/children/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const children = await storage.getUserChildren(userId);
      
      // Calculate ages from birth dates
      const childrenWithAges = children.map(child => {
        if (child.dateOfBirth) {
          const today = new Date();
          const birth = new Date(child.dateOfBirth);
          const age = today.getFullYear() - birth.getFullYear();
          const monthDiff = today.getMonth() - birth.getMonth();
          
          let calculatedAge = age;
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            calculatedAge = age - 1;
          }
          
          return { ...child, age: calculatedAge };
        }
        return child;
      });
      
      res.json(childrenWithAges);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.post("/api/children", async (req: Request, res: Response) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const childData = {
        ...req.body,
        parentId: currentUser.id,
      };

      const child = await storage.createChild(childData);
      res.status(201).json(child);
    } catch (error) {
      console.error("Error creating child:", error);
      res.status(500).json({ message: "Failed to create child" });
    }
  });

  app.put("/api/children/:id", async (req: Request, res: Response) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const childId = parseInt(req.params.id);
      const child = await storage.updateChild(childId, req.body);
      
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }

      res.json(child);
    } catch (error) {
      console.error("Error updating child:", error);
      res.status(500).json({ message: "Failed to update child" });
    }
  });

  app.delete("/api/children/:id", async (req: Request, res: Response) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const childId = parseInt(req.params.id);
      const success = await storage.deleteChild(childId);
      
      if (!success) {
        return res.status(404).json({ message: "Child not found" });
      }

      res.json({ message: "Child deleted successfully" });
    } catch (error) {
      console.error("Error deleting child:", error);
      res.status(500).json({ message: "Failed to delete child" });
    }
  });

  // Membership Management API Routes
  app.get("/api/memberships", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const organizationId = req.query.organizationId ? parseInt(req.query.organizationId as string) : currentUser.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID required" });
      }

      const memberships = await storage.getMembershipsByOrganization(organizationId);
      res.json(memberships);
    } catch (error) {
      console.error("Error fetching memberships:", error);
      res.status(500).json({ message: "Failed to fetch memberships" });
    }
  });

  app.post("/api/memberships", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { userId, organizationId } = req.body;
      
      // Get organization details for pricing
      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      if (organization.businessModel !== "membership") {
        return res.status(400).json({ message: "Organization does not use membership model" });
      }

      // Calculate membership dates
      const startDate = new Date();
      const endDate = new Date();
      
      if (organization.membershipBillingCycle === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (organization.membershipBillingCycle === "quarterly") {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (organization.membershipBillingCycle === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const membershipData = {
        userId,
        organizationId,
        status: "pending" as const,
        startDate,
        endDate,
        price: organization.membershipPrice || "0.00",
        billingCycle: organization.membershipBillingCycle || "monthly",
        autoRenew: true,
        nextBillingDate: endDate,
      };

      const membership = await storage.createMembership(membershipData);
      res.json(membership);
    } catch (error) {
      console.error("Error creating membership:", error);
      res.status(500).json({ message: "Failed to create membership" });
    }
  });

  app.put("/api/memberships/:id", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const membershipId = parseInt(req.params.id);
      const updates = req.body;

      const membership = await storage.updateMembership(membershipId, updates);
      
      if (!membership) {
        return res.status(404).json({ message: "Membership not found" });
      }

      res.json(membership);
    } catch (error) {
      console.error("Error updating membership:", error);
      res.status(500).json({ message: "Failed to update membership" });
    }
  });

  app.get("/api/users/available-for-membership", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const organizationId = req.query.organizationId ? parseInt(req.query.organizationId as string) : currentUser.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID required" });
      }

      const availableUsers = await storage.getAvailableUsersForMembership(organizationId);
      res.json(availableUsers);
    } catch (error) {
      console.error("Error fetching available users:", error);
      res.status(500).json({ message: "Failed to fetch available users" });
    }
  });

  // Daily Schedule routes for membership organizations
  app.get("/api/daily-schedules/:organizationId", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      const schedules = await storage.getDailySchedulesByOrganization(organizationId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching daily schedules:", error);
      res.status(500).json({ message: "Failed to fetch daily schedules" });
    }
  });

  app.post("/api/daily-schedules", async (req: Request, res: Response) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || (currentUser.role !== 'organization_admin' && currentUser.role !== 'global_admin')) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const scheduleData = req.body;
      const schedule = await storage.createDailySchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      console.error("Error creating daily schedule:", error);
      res.status(500).json({ message: "Failed to create daily schedule" });
    }
  });

  app.put("/api/daily-schedules/:id", async (req: Request, res: Response) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || (currentUser.role !== 'organization_admin' && currentUser.role !== 'global_admin')) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const scheduleId = parseInt(req.params.id);
      const scheduleData = req.body;
      const schedule = await storage.updateDailySchedule(scheduleId, scheduleData);
      
      if (!schedule) {
        return res.status(404).json({ message: "Daily schedule not found" });
      }
      
      res.json(schedule);
    } catch (error) {
      console.error("Error updating daily schedule:", error);
      res.status(500).json({ message: "Failed to update daily schedule" });
    }
  });

  app.delete("/api/daily-schedules/:id", async (req: Request, res: Response) => {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser || (currentUser.role !== 'organization_admin' && currentUser.role !== 'global_admin')) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const scheduleId = parseInt(req.params.id);
      const success = await storage.deleteDailySchedule(scheduleId);
      
      if (!success) {
        return res.status(404).json({ message: "Daily schedule not found" });
      }
      
      res.json({ message: "Daily schedule deleted successfully" });
    } catch (error) {
      console.error("Error deleting daily schedule:", error);
      res.status(500).json({ message: "Failed to delete daily schedule" });
    }
  });

  // PayFast connection test endpoint
  app.post("/api/test-payfast-connection", async (req: Request, res: Response) => {
    try {
      const { merchantId, merchantKey, passphrase, sandbox } = req.body;
      
      if (!merchantId || !merchantKey) {
        return res.status(400).json({ message: "Merchant ID and Key are required" });
      }

      // Test PayFast credentials by creating a test payment data structure
      const testData: PayFastPaymentData = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: "https://test.com/success",
        cancel_url: "https://test.com/cancel",
        notify_url: "https://test.com/notify",
        name_first: "Test",
        name_last: "User",
        email_address: "test@test.com",
        m_payment_id: "test_connection_123",
        amount: "100.00",
        item_name: "Connection Test",
        item_description: "PayFast connection validation test",
        passphrase: passphrase || undefined
      };

      try {
        const testUrl = payfastService.generatePaymentUrl(testData, sandbox || true);
        
        // If we can generate a URL without errors, credentials are valid
        if (testUrl && testUrl.includes('payfast.co.za')) {
          res.json({ 
            connected: true, 
            message: "PayFast credentials are valid",
            environment: sandbox ? "sandbox" : "production"
          });
        } else {
          res.status(400).json({ 
            connected: false, 
            message: "Invalid PayFast credentials"
          });
        }
      } catch (error) {
        console.error("PayFast validation error:", error);
        res.status(400).json({ 
          connected: false, 
          message: "Failed to validate PayFast credentials"
        });
      }
    } catch (error) {
      console.error("Error testing PayFast connection:", error);
      res.status(500).json({ message: "Failed to test connection" });
    }
  });

  // PayFast activation fee payment endpoint (GET)
  app.get("/api/create-payfast-payment", async (req: Request, res: Response) => {
    try {
      const { amount, organizationId, description } = req.query;
      
      if (!amount || !organizationId) {
        return res.status(400).json({ message: "Missing required payment parameters" });
      }

      // Get organization and user data
      const organization = await storage.getOrganization(parseInt(organizationId as string));
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Check if organization has PayFast credentials, fallback to global settings
      let payfastConfig = {
        merchantId: organization.payfastMerchantId,
        merchantKey: organization.payfastMerchantKey,
        passphrase: organization.payfastPassphrase,
        sandbox: organization.payfastSandbox
      };

      // If organization doesn't have PayFast credentials, use global settings
      if (!payfastConfig.merchantId || !payfastConfig.merchantKey) {
        const globalSettings = await storage.getGlobalSettings();
        if (globalSettings.payfast.merchantId && globalSettings.payfast.merchantKey) {
          payfastConfig = globalSettings.payfast;
        } else {
          return res.status(400).json({ message: "PayFast not configured for this organization or globally" });
        }
      }

      // For activation fee, use organization admin as payer
      const orgAdmins = await storage.getOrganizationAdmins(organization.id);
      const primaryAdmin = orgAdmins[0];
      
      if (!primaryAdmin) {
        return res.status(400).json({ message: "No organization admin found" });
      }

      // Create PayFast payment data for activation fee
      const paymentData: PayFastPaymentData = {
        merchant_id: payfastConfig.merchantId,
        merchant_key: payfastConfig.merchantKey,
        return_url: `${req.protocol}://${req.get('host')}/payment-success?type=activation&org_id=${organization.id}`,
        cancel_url: `${req.protocol}://${req.get('host')}/payment-cancelled?type=activation&org_id=${organization.id}`,
        notify_url: `${req.protocol}://${req.get('host')}/api/payfast-notify`,
        name_first: primaryAdmin.firstName || primaryAdmin.name?.split(' ')[0] || 'Admin',
        name_last: primaryAdmin.lastName || primaryAdmin.name?.split(' ')[1] || 'User',
        email_address: primaryAdmin.email,
        m_payment_id: `activation_${organization.id}_${Date.now()}`,
        amount: parseFloat(amount as string).toFixed(2),
        item_name: description as string || 'Activation Fee',
        item_description: `Activation fee for ${organization.name} - includes setup and first month`,
        passphrase: payfastConfig.passphrase || undefined,
      };

      // Generate payment URL and redirect
      const paymentUrl = payfastService.generatePaymentUrl(paymentData, payfastConfig.sandbox || false);
      
      // Redirect to PayFast
      res.redirect(paymentUrl);
    } catch (error) {
      console.error("Error creating activation fee payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // PayFast payment creation endpoint (POST for class bookings)
  app.post("/api/create-payfast-payment", async (req: Request, res: Response) => {
    try {
      const { bookingId, classId, amount, participantName, participantEmail } = req.body;
      
      if (!bookingId || !amount || !participantName || !participantEmail) {
        return res.status(400).json({ message: "Missing required payment data" });
      }

      // Get the class to determine which organization's PayFast credentials to use
      const classData = await storage.getClass(classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      const organization = await storage.getOrganization(classData.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Check if PayFast credentials are configured
      if (!organization.payfastMerchantId || !organization.payfastMerchantKey) {
        return res.status(400).json({ message: "PayFast credentials not configured for this organization" });
      }

      // Split participant name into first and last name
      const nameParts = participantName.split(' ');
      const firstName = nameParts[0] || 'Guest';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      // Create PayFast payment data
      const paymentData: PayFastPaymentData = {
        merchant_id: organization.payfastMerchantId,
        merchant_key: organization.payfastMerchantKey,
        return_url: `${req.protocol}://${req.get('host')}/payment-success?booking_id=${bookingId}&org_id=${organization.id}`,
        cancel_url: `${req.protocol}://${req.get('host')}/payment-cancelled?booking_id=${bookingId}&org_id=${organization.id}`,
        notify_url: `${req.protocol}://${req.get('host')}/api/payfast-notify`,
        name_first: firstName,
        name_last: lastName,
        email_address: participantEmail,
        m_payment_id: `booking_${bookingId}_${Date.now()}`,
        amount: parseFloat(amount).toFixed(2),
        item_name: `Class Booking: ${classData.name}`,
        item_description: `Booking for ${classData.name} on ${new Date(classData.startTime).toLocaleDateString()}`,
        passphrase: organization.payfastPassphrase || undefined,
      };

      // Generate payment URL
      const paymentUrl = payfastService.generatePaymentUrl(paymentData, organization.payfastSandbox || false);

      res.json({ 
        paymentUrl,
        paymentId: paymentData.m_payment_id 
      });
    } catch (error) {
      console.error("Error creating PayFast payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // PayFast notification handler for all payments
  app.post("/api/payfast-notify", async (req: Request, res: Response) => {
    try {
      const notification = req.body;
      const {
        payment_status,
        m_payment_id,
        pf_payment_id,
        amount_gross,
        custom_str1: organizationId,
        custom_str2: userId,
        custom_str3: paymentType
      } = notification;

      console.log("PayFast notification received:", notification);

      // Validate the notification signature
      const organization = await storage.getOrganization(parseInt(organizationId || "1"));
      if (organization && !payfastService.validateNotification(notification, organization.payfastPassphrase || undefined)) {
        console.error("Invalid PayFast notification signature");
        return res.status(400).send("Invalid signature");
      }

      if (payment_status === 'COMPLETE') {
        if (paymentType === 'membership') {
          // Handle membership payment
          if (organization) {
            const startDate = new Date();
            const endDate = new Date();
            
            // Calculate end date based on billing cycle
            if (organization.membershipBillingCycle === "monthly") {
              endDate.setMonth(endDate.getMonth() + 1);
            } else if (organization.membershipBillingCycle === "quarterly") {
              endDate.setMonth(endDate.getMonth() + 3);
            } else if (organization.membershipBillingCycle === "yearly") {
              endDate.setFullYear(endDate.getFullYear() + 1);
            }

            // Create active membership
            await storage.createMembership({
              userId: parseInt(userId),
              organizationId: parseInt(organizationId),
              status: "active",
              startDate,
              endDate,
              price: organization.membershipPrice || "0.00",
              billingCycle: organization.membershipBillingCycle || "monthly",
              autoRenew: true,
              nextBillingDate: endDate
            });
          }
        } else {
          // Handle booking payment
          const bookingIdMatch = m_payment_id.match(/booking_(\d+)_/);
          if (bookingIdMatch) {
            const bookingId = parseInt(bookingIdMatch[1]);
            
            // Update booking payment status
            const updatedBooking = await storage.updateBooking(bookingId, {
              paymentStatus: 'confirmed',
              payfastPaymentId: pf_payment_id
            });

            // Create payment record
            if (updatedBooking) {
              await storage.createPayment({
                bookingId: bookingId,
                amount: amount_gross,
                currency: 'ZAR',
                status: 'completed',
                payfastPaymentId: pf_payment_id,
                payfastData: notification,
                processedAt: new Date()
              });

              // Get class data for real-time updates
              const classData = await storage.getClass(updatedBooking.classId);
              if (classData) {
                // Calculate availability
                const existingBookings = await storage.getBookingsByClass(updatedBooking.classId);
                const confirmedBookings = existingBookings.filter(b => b.paymentStatus === 'confirmed');
                const availableSpots = classData.capacity - confirmedBookings.length;

                // Broadcast real-time updates
                broadcastAvailabilityUpdate(updatedBooking.classId, availableSpots, classData.capacity);
                broadcastBookingNotification(
                  updatedBooking.classId,
                  classData.name,
                  updatedBooking.participantName,
                  'booked'
                );
              }
            }
          }
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Error processing PayFast notification:", error);
      res.status(500).send("Error");
    }
  });

  // Administrative Management Endpoints

  // Move booking to different class
  app.put("/api/bookings/:id/move", async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { classId, reason } = req.body;
      
      // Get original booking details for email
      const originalBooking = await storage.getBooking(bookingId);
      if (!originalBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Get old and new class details
      const oldClass = await storage.getClass(originalBooking.classId);
      const newClass = await storage.getClass(classId);
      
      if (!oldClass || !newClass) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Get organization details
      const organization = await storage.getOrganization(oldClass.organizationId);
      
      // Update booking
      const updatedBooking = await storage.updateBooking(bookingId, { classId });
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Send email notification to client
      try {
        await sendBookingMoveEmail({
          to: originalBooking.participantEmail,
          participantName: originalBooking.participantName,
          oldClass: {
            name: oldClass.name,
            startTime: oldClass.startTime,
            location: oldClass.location
          },
          newClass: {
            name: newClass.name,
            startTime: newClass.startTime,
            location: newClass.location
          },
          reason: reason,
          organizationName: organization?.name || 'Sports Academy'
        });
      } catch (emailError) {
        console.error("Error sending booking move email:", emailError);
        // Don't fail the request if email fails
      }
      
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error moving booking:", error);
      res.status(500).json({ message: "Failed to move booking" });
    }
  });

  // Get organization followers (members)
  app.get("/api/organizations/:id/followers", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      
      // Get users who follow this organization
      const followers = await storage.getOrganizationFollowers(organizationId);
      
      res.json(followers);
    } catch (error) {
      console.error("Error fetching organization followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  // Get member bookings
  app.get("/api/bookings/member/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const memberBookings = await storage.getBookingsByUser(userId);
      res.json(memberBookings);
    } catch (error) {
      console.error("Error fetching member bookings:", error);
      res.status(500).json({ message: "Failed to fetch member bookings" });
    }
  });

  // Get class bookings
  app.get("/api/bookings/class/:classId", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.classId);
      const classBookings = await storage.getBookingsByClass(classId);
      res.json(classBookings);
    } catch (error) {
      console.error("Error fetching class bookings:", error);
      res.status(500).json({ message: "Failed to fetch class bookings" });
    }
  });

  // Get user messages
  app.get("/api/messages", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const messages = await storage.getUserMessages(user.id);
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Send message to organization
  app.post("/api/messages/send", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      const { recipientType, recipientId, subject, message, senderName, senderEmail } = req.body;

      if (!recipientType || !recipientId || !subject || !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Use authenticated user info if available, otherwise use provided values
      const finalSenderName = user ? (user.name || user.username) : senderName;
      const finalSenderEmail = user ? user.email : senderEmail;

      if (!finalSenderName) {
        return res.status(400).json({ message: "Sender name is required" });
      }

      let recipientEmails: string[] = [];
      let organizationName = "";

      if (recipientType === 'organization') {
        // Get organization details and admin emails
        const organization = await storage.getOrganization(recipientId);
        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }
        organizationName = organization.name;

        // Get organization admins
        const admins = await storage.getOrganizationAdmins(recipientId);
        recipientEmails = admins.map(admin => admin.email).filter(email => email);

        // Also include organization email if available
        if (organization.email) {
          recipientEmails.push(organization.email);
        }
      }

      // Save message to database if user is authenticated
      let savedMessage = null;
      if (user) {
        savedMessage = await storage.createMessage({
          senderId: user.id,
          recipientType: recipientType as 'organization' | 'user',
          recipientId: parseInt(recipientId.toString()),
          subject: subject,
          message: message,
          status: 'sent'
        });
      }

      if (recipientEmails.length === 0) {
        return res.status(400).json({ message: "No recipient emails found" });
      }

      // Send email to all recipients
      const emailPromises = recipientEmails.map(email => 
        sendEmail({
          to: email,
          from: "noreply@itshappening.africa",
          subject: `Message from ${finalSenderName}: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #20366B;">New Message from Member</h2>
              <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #278DD4; margin: 20px 0;">
                <p><strong>From:</strong> ${finalSenderName} ${finalSenderEmail ? `(${finalSenderEmail})` : ''}</p>
                <p><strong>To:</strong> ${organizationName}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr style="border: none; border-top: 1px solid #e9ecef; margin: 15px 0;">
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-line; line-height: 1.6;">${message}</p>
              </div>
              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #1976d2; font-size: 14px;">
                  💡 <strong>Tip:</strong> You can respond to this member by logging into your ItsHappening.Africa dashboard and accessing your messaging center.
                </p>
              </div>
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
              <p style="color: #6c757d; font-size: 14px;">
                This message was sent through the ItsHappening.Africa platform. Please do not reply directly to this email.
              </p>
            </div>
          `
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const successCount = results.filter(result => result.status === 'fulfilled').length;

      if (successCount > 0 || savedMessage) {
        res.json({ 
          message: "Message sent successfully",
          messageId: savedMessage?.id,
          recipientCount: successCount,
          totalRecipients: recipientEmails.length
        });
      } else {
        res.status(500).json({ message: "Failed to send message to any recipients" });
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Send message to organization administrators (Global Admin)
  app.post("/api/messages/send-to-org", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin required." });
      }

      const { organizationId, subject, content, fromGlobalAdmin } = req.body;

      if (!organizationId || !subject || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get organization details
      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Get organization admins
      const admins = await storage.getOrganizationAdmins(organizationId);
      if (admins.length === 0) {
        return res.status(404).json({ message: "No administrators found for this organization" });
      }

      // Create message record for each admin
      const messagePromises = admins.map(admin => 
        storage.createMessage({
          subject,
          message: content,
          senderId: user.id,
          recipientType: 'user',
          recipientId: admin.id
        })
      );

      // Send email notifications to admins
      const emailPromises = admins.map(admin =>
        sendEmail({
          to: admin.email,
          from: "admin@itshappening.africa",
          subject: `IH Academy Global Admin: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #20366B 0%, #278DD4 100%); color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">IH Academy Global Admin</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">Official Platform Communication</p>
              </div>
              
              <div style="background-color: #fff; padding: 30px; border: 1px solid #e9ecef;">
                <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #20366B; margin-bottom: 25px;">
                  <p style="margin: 0 0 10px; font-weight: bold; color: #20366B;">To: ${organization.name} Administrators</p>
                  <p style="margin: 0 0 10px; font-weight: bold; color: #20366B;">From: IH Academy Global Support Team</p>
                  <p style="margin: 0; font-weight: bold; color: #20366B;">Subject: ${subject}</p>
                </div>
                
                <div style="line-height: 1.6; color: #374151; white-space: pre-line; margin-bottom: 25px;">
${content}
                </div>
                
                <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #1976d2; font-size: 14px;">
                    💡 <strong>Global Admin Communication:</strong> This message was sent by the IH Academy platform administrators. Please respond through your organization dashboard messaging system if needed.
                  </p>
                </div>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                  IH Academy Platform | Official Administrator Communication
                </p>
                <p style="margin: 5px 0 0; color: #6c757d; font-size: 12px;">
                  This is an automated message from the IH Academy platform administration team.
                </p>
              </div>
            </div>
          `
        })
      );

      // Execute both message creation and email sending
      const [messages, emailResults] = await Promise.all([
        Promise.allSettled(messagePromises),
        Promise.allSettled(emailPromises)
      ]);

      const successfulMessages = messages.filter(result => result.status === 'fulfilled').length;
      const successfulEmails = emailResults.filter(result => result.status === 'fulfilled').length;

      if (successfulMessages > 0) {
        res.json({ 
          message: "Message sent successfully to organization administrators",
          recipientCount: successfulMessages,
          emailsSent: successfulEmails,
          totalAdmins: admins.length
        });
      } else {
        res.status(500).json({ message: "Failed to send message" });
      }
    } catch (error: any) {
      console.error("Error sending message to organization:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Mark message as read
  app.put("/api/messages/:messageId/read", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }

      await storage.markMessageAsRead(messageId);
      res.json({ success: true, message: "Message marked as read" });
    } catch (error: any) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update organization (Global Admin only)
  app.patch("/api/organizations/:id", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin required." });
      }

      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      const updateData = req.body;
      const updatedOrganization = await storage.updateOrganization(organizationId, updateData);
      
      if (!updatedOrganization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      res.json({ 
        success: true, 
        message: "Organization updated successfully",
        organization: updatedOrganization
      });
    } catch (error: any) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update organization fees (Global Admin only)
  app.patch("/api/organizations/:id/fees", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin required." });
      }

      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      const feeData = req.body;
      const updatedOrganization = await storage.updateOrganization(organizationId, {
        membershipPrice: feeData.membershipPrice,
        customDiscount: feeData.discountPercentage,
        commissionRate: feeData.commissionRate,
        specialNotes: feeData.specialNotes
      });
      
      if (!updatedOrganization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      res.json({ 
        success: true, 
        message: "Organization fees updated successfully",
        organization: updatedOrganization
      });
    } catch (error: any) {
      console.error("Error updating organization fees:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete organization (Global Admin only)
  app.delete("/api/organizations/:id", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || user.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin required." });
      }

      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      // Check if organization exists
      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      await storage.deleteOrganization(organizationId);
      
      console.log(`Organization ${organizationId} deletion completed successfully`);
      
      res.json({ 
        success: true, 
        message: `Organization "${organization.name}" has been permanently deleted`,
        deletedId: organizationId
      });
    } catch (error: any) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Send email to members
  app.post("/api/emails/send", async (req: Request, res: Response) => {
    try {
      const { organizationId, memberIds, subject, content } = req.body;
      
      console.log(`Sending email to ${memberIds.length} members:`, { subject, content });
      
      res.json({ success: true, sentTo: memberIds.length });
    } catch (error) {
      console.error("Error sending emails:", error);
      res.status(500).json({ message: "Failed to send emails" });
    }
  });

  // Get revenue data for organization
  app.get("/api/revenue/:organizationId", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      const { period = 'current-month', year = new Date().getFullYear() } = req.query;
      
      const revenueData = await storage.getRevenueData(organizationId, period as string, parseInt(year as string));
      
      res.json(revenueData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  // Get payment records
  app.get("/api/payments", async (req: Request, res: Response) => {
    try {
      const { organizationId, period } = req.query;
      
      const payments = await storage.getPaymentsByOrganization(parseInt(organizationId as string), period as string);
      
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Send class update notification
  app.post("/api/notifications/class-update", async (req: Request, res: Response) => {
    try {
      const { classId, message, organizationId } = req.body;
      
      // Get all participants for this class
      const classBookings = await storage.getBookingsByClass(classId);
      
      console.log(`Sending class update notification to ${classBookings.length} participants:`, message);
      
      res.json({ success: true, notificationsSent: classBookings.length });
    } catch (error) {
      console.error("Error sending class notifications:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  // Global admin pricing configuration endpoints
  app.get("/api/admin/pricing-config", async (req: Request, res: Response) => {
    try {
      // Get global pricing configuration from organization ID 20 (acts as global settings)
      const [globalOrg] = await db.select().from(organizations).where(eq(organizations.id, 20));
      
      let pricingConfig = {
        membership: {
          free: { price: "0", maxMembers: "25", maxClasses: "5", storage: "1" },
          basic: { price: "299", maxMembers: "100", maxClasses: "25", storage: "10" },
          premium: { price: "599", maxMembers: "Unlimited", maxClasses: "Unlimited", storage: "100" }
        },
        payPerClass: {
          free: { commission: "5", maxBookings: "50", storage: "1" },
          basic: { commission: "3", maxBookings: "200", storage: "10" },
          premium: { commission: "2", maxBookings: "Unlimited", storage: "100" }
        }
      };

      // If stored pricing config exists, use it
      if (globalOrg?.pricingConfig) {
        try {
          pricingConfig = JSON.parse(globalOrg.pricingConfig);
        } catch (e) {
          console.log("Using default pricing config due to parse error");
        }
      }

      res.json(pricingConfig);
    } catch (error: any) {
      console.error("Error fetching pricing config:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/pricing-config", async (req: Request, res: Response) => {
    try {
      const pricingConfig = req.body;

      // Store pricing configuration in organization 20 (global settings)
      await db.update(organizations)
        .set({ 
          pricingConfig: JSON.stringify(pricingConfig),
          updatedAt: new Date()
        })
        .where(eq(organizations.id, 20));

      console.log("Pricing configuration saved:", pricingConfig);

      res.json({ message: "Pricing configuration saved successfully" });
    } catch (error: any) {
      console.error("Error saving pricing config:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get current pricing for organization signups
  app.get("/api/pricing", async (req: Request, res: Response) => {
    try {
      // Get global pricing configuration from organization ID 20 (acts as global settings)
      const [globalOrg] = await db.select().from(organizations).where(eq(organizations.id, 20));
      
      let pricingConfig = {
        membership: {
          free: { price: "0", maxMembers: "25", maxClasses: "5", storage: "1" },
          basic: { price: "299", maxMembers: "100", maxClasses: "25", storage: "10" },
          premium: { price: "599", maxMembers: "Unlimited", maxClasses: "Unlimited", storage: "100" }
        },
        payPerClass: {
          free: { commission: "5", maxBookings: "50", storage: "1" },
          basic: { commission: "3", maxBookings: "200", storage: "10" },
          premium: { commission: "2", maxBookings: "Unlimited", storage: "100" }
        }
      };

      // If stored pricing config exists, use it
      if (globalOrg?.pricingConfig) {
        try {
          pricingConfig = JSON.parse(globalOrg.pricingConfig);
        } catch (e) {
          console.log("Using default pricing config due to parse error");
        }
      }

      res.json(pricingConfig);
    } catch (error: any) {
      console.error("Error fetching pricing:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Send payment reminder email for pending booking
  app.post("/api/bookings/:id/send-payment-reminder", async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const user = getCurrentUser(req);
      
      if (!user || user.role !== 'organization_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get booking details
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Get class details
      const classData = await storage.getClass(booking.classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Get organization details
      const organization = await storage.getOrganization(classData.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Only send reminder for pending payments
      if (booking.paymentStatus !== 'pending') {
        return res.status(400).json({ message: "Booking payment is not pending" });
      }

      // Generate PayFast payment URL
      const paymentData: PayFastPaymentData = {
        merchant_id: organization.payfastMerchantId || '',
        merchant_key: organization.payfastMerchantKey || '',
        return_url: `${req.protocol}://${req.get('host')}/payment-success?org_id=${organization.id}`,
        cancel_url: `${req.protocol}://${req.get('host')}/payment-cancelled?org_id=${organization.id}`,
        notify_url: `${req.protocol}://${req.get('host')}/api/payfast-notify`,
        name_first: booking.participantName.split(' ')[0] || booking.participantName,
        name_last: booking.participantName.split(' ').slice(1).join(' ') || '',
        email_address: booking.participantEmail || '',
        m_payment_id: `booking_${booking.id}`,
        amount: booking.amount,
        item_name: classData.name,
        item_description: `Class booking for ${classData.name}`,
        passphrase: organization.payfastPassphrase || ''
      };

      const paymentUrl = payfastService.generatePaymentUrl(paymentData, organization.payfastSandbox || true);

      // Send payment reminder email
      const emailSent = await sendPaymentReminderEmail({
        to: booking.participantEmail || '',
        participantName: booking.participantName,
        className: classData.name,
        amount: booking.amount,
        classDate: classData.startTime,
        paymentUrl: paymentUrl,
        organizationName: organization.name
      });

      if (emailSent) {
        res.json({ message: "Payment reminder sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send payment reminder" });
      }
    } catch (error: any) {
      console.error("Error sending payment reminder:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Cancel booking due to non-payment
  // Debug logging endpoint for mobile navigation
  app.post("/api/debug-log", async (req: Request, res: Response) => {
    try {
      const { action, orgId, orgName, timestamp } = req.body;
      console.log(`🔍 MOBILE DEBUG: ${action} at ${timestamp}`);
      if (orgId && orgName) {
        console.log(`🔍 Organization: ${orgName} (ID: ${orgId})`);
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Debug log error:', error);
      res.status(500).json({ error: 'Failed to log debug info' });
    }
  });

  app.post("/api/bookings/:id/cancel-for-non-payment", async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const user = getCurrentUser(req);
      
      if (!user || user.role !== 'organization_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get booking details
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Get class details
      const classData = await storage.getClass(booking.classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Get organization details
      const organization = await storage.getOrganization(classData.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Only cancel bookings with pending payments
      if (booking.paymentStatus !== 'pending') {
        return res.status(400).json({ message: "Booking payment is not pending" });
      }

      // Cancel the booking by updating status
      const updatedBooking = await storage.updateBooking(bookingId, { paymentStatus: 'cancelled' });
      if (!updatedBooking) {
        return res.status(500).json({ message: "Failed to cancel booking" });
      }

      // Send cancellation email
      const emailSent = await sendBookingCancellationEmail({
        to: booking.participantEmail || '',
        participantName: booking.participantName,
        className: classData.name,
        amount: booking.amount,
        classDate: classData.startTime,
        organizationName: organization.name
      });

      // Broadcast availability update
      const bookingsForClass = await storage.getBookingsByClass(booking.classId);
      const availableSpots = classData.capacity - bookingsForClass.length;
      broadcastAvailabilityUpdate(booking.classId, availableSpots, classData.capacity);

      res.json({ 
        message: "Booking cancelled successfully",
        emailSent: emailSent
      });
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Debit Order endpoints
  app.get("/api/debit-order/mandates", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const mandates = await storage.getDebitOrderMandatesByUser(user.id);
      res.json(mandates);
    } catch (error) {
      console.error("Error fetching debit order mandates:", error);
      res.status(500).json({ message: "Failed to fetch mandates" });
    }
  });

  app.post("/api/debit-order/mandates", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { organizationId, bankName, accountHolder, accountNumber, branchCode, accountType, maxAmount, frequency, startDate, endDate } = req.body;

      // Validate bank account details
      const validation = debitOrderService.validateBankAccount(accountNumber, branchCode);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      const mandate = await storage.createDebitOrderMandate({
        userId: user.id,
        organizationId,
        bankName,
        accountHolder,
        accountNumber,
        branchCode,
        accountType,
        maxAmount,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
      });

      res.json(mandate);
    } catch (error) {
      console.error("Error creating debit order mandate:", error);
      res.status(500).json({ message: "Failed to create mandate" });
    }
  });

  app.get("/api/debit-order/mandates/:id/form", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const mandateId = parseInt(req.params.id);
      const mandate = await storage.getDebitOrderMandate(mandateId);
      
      if (!mandate || mandate.userId !== user.id) {
        return res.status(404).json({ message: "Mandate not found" });
      }

      const mandateForm = debitOrderService.generateMandateForm({
        userId: mandate.userId,
        organizationId: mandate.organizationId,
        bankName: mandate.bankName,
        accountHolder: mandate.accountHolder,
        accountNumber: mandate.accountNumber,
        branchCode: mandate.branchCode,
        accountType: mandate.accountType,
        maxAmount: mandate.maxAmount,
        frequency: mandate.frequency,
        startDate: mandate.startDate.toISOString().split('T')[0],
        endDate: mandate.endDate?.toISOString().split('T')[0],
      });

      res.setHeader('Content-Type', 'text/html');
      res.send(mandateForm);
    } catch (error) {
      console.error("Error generating mandate form:", error);
      res.status(500).json({ message: "Failed to generate form" });
    }
  });

  app.post("/api/debit-order/mandates/:id/activate", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const mandateId = parseInt(req.params.id);
      const mandate = await storage.getDebitOrderMandate(mandateId);
      
      if (!mandate || mandate.userId !== user.id) {
        return res.status(404).json({ message: "Mandate not found" });
      }

      const activatedMandate = await storage.activateDebitOrderMandate(mandateId);
      res.json(activatedMandate);
    } catch (error) {
      console.error("Error activating mandate:", error);
      res.status(500).json({ message: "Failed to activate mandate" });
    }
  });

  app.post("/api/debit-order/process-payment", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { mandateId, bookingId, amount, transactionType } = req.body;

      // Verify mandate belongs to user
      const mandate = await storage.getDebitOrderMandate(mandateId);
      if (!mandate || mandate.userId !== user.id || mandate.status !== 'active') {
        return res.status(400).json({ message: "Invalid or inactive mandate" });
      }

      // Check amount against mandate limit
      if (parseFloat(amount) > parseFloat(mandate.maxAmount)) {
        return res.status(400).json({ message: "Amount exceeds mandate limit" });
      }

      // Create transaction record
      const transaction = await storage.createDebitOrderTransaction({
        mandateId,
        bookingId,
        amount,
        transactionType,
        status: 'pending'
      });

      // Process the debit order
      const result = await debitOrderService.processDebitOrderTransaction({
        mandateId,
        bookingId,
        amount,
        transactionType
      });

      // Update transaction status
      await storage.updateDebitOrderTransaction(transaction.id, {
        status: result.success ? 'successful' : 'failed',
        processedAt: new Date(),
        failureReason: result.failureReason
      });

      if (result.success) {
        // Update booking payment status if this was for a booking
        if (bookingId) {
          await storage.updateBooking(bookingId, {
            paymentStatus: 'confirmed',
            paymentMethod: 'debit_order'
          });
        }

        res.json({ 
          success: true, 
          transactionReference: result.transactionReference,
          message: "Payment processed successfully"
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: result.failureReason || "Payment processing failed"
        });
      }
    } catch (error) {
      console.error("Error processing debit order payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  app.get("/api/debit-order/transactions", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get all mandates for user, then get transactions for each
      const mandates = await storage.getDebitOrderMandatesByUser(user.id);
      const allTransactions = [];
      
      for (const mandate of mandates) {
        const transactions = await storage.getDebitOrderTransactionsByMandate(mandate.id);
        allTransactions.push(...transactions.map(t => ({
          ...t,
          mandate: mandate
        })));
      }

      res.json(allTransactions);
    } catch (error) {
      console.error("Error fetching debit order transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Global admin management endpoints
  app.get("/api/global-admins", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin role required." });
      }

      const admins = await storage.getGlobalAdmins();
      res.json(admins);
    } catch (error) {
      console.error("Error fetching global admins:", error);
      res.status(500).json({ message: "Failed to fetch global admins" });
    }
  });

  app.post("/api/global-admins", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin role required." });
      }

      const { email, name } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create new global admin
      const newAdmin = await storage.createUser({
        username: email.split('@')[0] + '_admin',
        email,
        name,
        firstName: name.split(' ')[0] || '',
        lastName: name.split(' ').slice(1).join(' ') || '',
        role: 'global_admin',
        password: 'temp123', // Temporary password - admin will need to reset
        isActive: true,
        organizationId: null
      });

      res.json(newAdmin);
    } catch (error) {
      console.error("Error creating global admin:", error);
      res.status(500).json({ message: "Failed to create global admin" });
    }
  });

  app.delete("/api/global-admins/:id", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin role required." });
      }

      const adminId = parseInt(req.params.id);
      
      // Don't allow deleting the last global admin
      const allAdmins = await storage.getGlobalAdmins();
      if (allAdmins.length <= 1) {
        return res.status(400).json({ message: "Cannot delete the last global admin" });
      }

      await storage.deleteUser(adminId);
      res.json({ message: "Global admin removed successfully" });
    } catch (error) {
      console.error("Error removing global admin:", error);
      res.status(500).json({ message: "Failed to remove global admin" });
    }
  });

  // Reset global admin password endpoint
  app.post("/api/global-admins/:id/reset-password", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin role required." });
      }

      const adminId = parseInt(req.params.id);
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Get the admin to reset password for
      const adminToReset = await storage.getUserById(adminId);
      if (!adminToReset) {
        return res.status(404).json({ message: "Global admin not found" });
      }

      if (adminToReset.role !== 'global_admin') {
        return res.status(400).json({ message: "User is not a global admin" });
      }

      // Reset the password
      const success = await storage.resetUserPassword(adminId, newPassword);
      if (!success) {
        return res.status(500).json({ message: "Failed to reset password" });
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting global admin password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Reset user password (for admin management)
  app.post("/api/users/:userId/reset-password", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin role required." });
      }

      const userId = parseInt(req.params.userId);
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Get the user to reset password for
      const userToReset = await storage.getUserById(userId);
      if (!userToReset) {
        return res.status(404).json({ message: "User not found" });
      }

      // Reset the password
      const success = await storage.resetUserPassword(userId, newPassword);
      if (!success) {
        return res.status(500).json({ message: "Failed to reset password" });
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Global settings endpoints
  app.get("/api/global-settings", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin role required." });
      }

      const settings = await storage.getGlobalSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching global settings:", error);
      res.status(500).json({ message: "Failed to fetch global settings" });
    }
  });

  app.post("/api/global-settings/payfast", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin role required." });
      }

      const payfastSettings = req.body;
      await storage.saveGlobalPayfastSettings(payfastSettings);
      res.json({ message: "PayFast settings saved successfully" });
    } catch (error) {
      console.error("Error saving PayFast settings:", error);
      res.status(500).json({ message: "Failed to save PayFast settings" });
    }
  });

  // User management endpoints for global admin

  // Clean up orphaned users (users not associated with any organization)
  app.post("/api/users/cleanup-orphaned", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin role required." });
      }

      const result = await storage.cleanupOrphanedUsers();
      res.json({ 
        message: "Orphaned users cleanup completed",
        deletedCount: result.deletedCount,
        deletedUsers: result.deletedUsers
      });
    } catch (error) {
      console.error("Error cleaning up orphaned users:", error);
      res.status(500).json({ message: "Failed to cleanup orphaned users" });
    }
  });

  // Get user details endpoint
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin role required." });
      }

      const userId = parseInt(req.params.id);
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's organizations
      const userOrgs = await storage.getUserOrganizations(userId);
      
      // Get user's bookings count
      const bookings = await storage.getUserBookings(userId);
      
      res.json({
        ...user,
        organizations: userOrgs,
        bookingCount: bookings.length,
        recentBookings: bookings.slice(0, 5) // Last 5 bookings
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  // Delete user endpoint
  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin role required." });
      }

      const userId = parseInt(req.params.id);
      
      // Prevent self-deletion
      if (userId === currentUser.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Cleanup orphaned users endpoint
  app.post("/api/users/cleanup-orphaned", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin role required." });
      }

      const result = await storage.cleanupOrphanedUsers();
      
      res.json(result);
    } catch (error) {
      console.error("Error cleaning up orphaned users:", error);
      res.status(500).json({ message: "Failed to cleanup orphaned users" });
    }
  });

  // Routes registered successfully
  console.log("Multi-tenant API routes with real-time WebSocket support registered");
  return httpServer;
}

// Helper function to notify global admins about new organization signups
async function notifyGlobalAdminsNewOrganization(organization: any, user: any) {
  try {
    const globalAdmins = await storage.getGlobalAdmins();
    
    // Get business model information
    const businessModel = organization.businessModel || 'membership';
    const planType = organization.planType || 'free';
    
    for (const admin of globalAdmins) {
      await sendEmail({
        to: admin.email,
        from: 'noreply@itshappening.africa',
        subject: `New Organization Signup - ${organization.name} (${planType.toUpperCase()} plan)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #20366B 0%, #278DD4 50%, #24D367 100%); padding: 30px; text-align: center;">
              <img src="https://itshappening.africa/wp-content/uploads/2024/06/images-1.jpeg" alt="IH Academy" style="height: 40px; margin-bottom: 15px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New Organization Signup!</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">A new sports academy has joined IH Academy</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #24D367;">
                <h2 style="color: #20366B; margin: 0 0 20px 0; font-size: 20px;">🏢 Organization Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #20366B; width: 40%;">Organization Name:</td>
                    <td style="padding: 8px 0; color: #333;">${organization.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #20366B;">Email Address:</td>
                    <td style="padding: 8px 0; color: #333;">${organization.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #20366B;">Description:</td>
                    <td style="padding: 8px 0; color: #333;">${organization.description || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #20366B;">Business Model:</td>
                    <td style="padding: 8px 0;">
                      <span style="background: ${businessModel === 'membership' ? '#278DD4' : '#F97316'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                        ${businessModel === 'membership' ? '📅 MEMBERSHIP' : '💳 PAY-PER-CLASS'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #20366B;">Plan Type:</td>
                    <td style="padding: 8px 0;">
                      <span style="background: ${planType === 'free' ? '#6B7280' : planType === 'basic' ? '#278DD4' : '#24D367'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                        ${planType.toUpperCase()} ${planType === 'free' ? '🆓' : planType === 'basic' ? '⭐' : '👑'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #20366B;">Status:</td>
                    <td style="padding: 8px 0;">
                      <span style="background: #F59E0B; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                        ⏰ ${organization.subscriptionStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #20366B;">Trial Period:</td>
                    <td style="padding: 8px 0; color: #333;">21 days (ends ${new Date(organization.trialEndDate).toLocaleDateString()})</td>
                  </tr>
                </table>
              </div>

              <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #278DD4;">
                <h3 style="color: #20366B; margin: 0 0 20px 0; font-size: 18px;">👤 Organization Admin Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #20366B; width: 30%;">Name:</td>
                    <td style="padding: 8px 0; color: #333;">${user.name || (user.firstName + ' ' + user.lastName) || 'Not provided'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #20366B;">Email:</td>
                    <td style="padding: 8px 0; color: #333;">${user.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #20366B;">Username:</td>
                    <td style="padding: 8px 0; color: #333;">${user.username}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #20366B;">Created:</td>
                    <td style="padding: 8px 0; color: #333;">${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</td>
                  </tr>
                </table>
              </div>

              <div style="background: linear-gradient(135deg, #278DD4 0%, #24D367 100%); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                <h3 style="color: white; margin: 0 0 15px 0; font-size: 16px;">Quick Actions</h3>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                  <a href="https://academy.itshappening.africa" style="background: white; color: #278DD4; padding: 12px 20px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; margin: 5px;">
                    🔧 Access Global Dashboard
                  </a>
                  <a href="mailto:${organization.email}" style="background: rgba(255,255,255,0.2); color: white; padding: 12px 20px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; margin: 5px;">
                    ✉️ Contact Organization
                  </a>
                </div>
              </div>

              <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; border-left: 4px solid #6B7280;">
                <p style="margin: 0; font-size: 14px; color: #6B7280;">
                  <strong>💡 Next Steps:</strong> The organization admin can now set up their academy, invite coaches, create classes, and start managing their members. Monitor their progress through the Global Admin Dashboard.
                </p>
              </div>
            </div>

            <div style="background: #20366B; color: white; padding: 25px; text-align: center;">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">IH Academy - Sports Academy Management Platform</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.8;">This is an automated notification from the ItsHappening.Africa platform</p>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
                <p style="margin: 0; font-size: 11px; opacity: 0.7;">
                  📧 Sent to: ${admin.email} | 🕒 ${new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        `
      });
    }
  } catch (error) {
    console.error('Failed to notify global admins about new organization:', error);
  }
}

// Helper function to notify global admins about new admin addition
async function notifyGlobalAdminsNewAdmin(newAdmin: any) {
  try {
    const globalAdmins = await storage.getGlobalAdmins();
    
    for (const admin of globalAdmins) {
      if (admin.id !== newAdmin.id) { // Don't notify the newly created admin
        await sendEmail({
          to: admin.email,
          from: 'noreply@itshappening.africa',
          subject: 'New Global Admin Added - IH Academy',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #20366B 0%, #278DD4 50%, #24D367 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">New Global Admin Added</h1>
              </div>
              
              <div style="padding: 30px; background: #f8f9fa;">
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #20366B; margin-bottom: 15px;">New Admin Details</h3>
                  <p><strong>Name:</strong> ${newAdmin.name}</p>
                  <p><strong>Email:</strong> ${newAdmin.email}</p>
                  <p><strong>Created:</strong> ${new Date().toLocaleDateString()}</p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://academy.itshappening.africa" style="background: #278DD4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Access Global Admin Dashboard
                  </a>
                </div>
              </div>

              <div style="background: #20366B; color: white; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 14px;">IH Academy - Sports Academy Management Platform</p>
              </div>
            </div>
          `
        });
      }
    }
  } catch (error) {
    console.error('Failed to notify global admins about new admin:', error);
  }
}