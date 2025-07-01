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
      
      // Get existing class to preserve organizationId
      const existingClass = await storage.getClass(classId);
      if (!existingClass) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Preserve organizationId - never allow it to be changed during updates
      classData.organizationId = existingClass.organizationId;
      
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
              
              // await sendCoachAssignmentEmail(
              //   user.email,
              //   user.username,
              //   updatedClass,
              //   icalContent
              // );
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

  // Invite organization admin by email
  app.post("/api/organizations/:id/invite-admin", async (req: Request, res: Response) => {
    try {
      const user = getCurrentUser(req);
      if (!user || !['organization_admin', 'global_admin'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const organizationId = parseInt(req.params.id);
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Valid email address is required" });
      }

      // Check if user has access to this organization
      if (user.role === 'organization_admin') {
        const userOrgs = await storage.getUserOrganizations(user.id);
        const hasAccess = userOrgs.some(org => org.organizationId === organizationId);
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied to this organization" });
        }
      }

      // Get organization details for email
      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Check if user already exists
      let invitedUser = await storage.getUserByEmail(email);
      
      if (!invitedUser) {
        // Create new user account with temporary password
        const tempPassword = Math.random().toString(36).slice(-12);
        const emailPrefix = email.split('@')[0];
        invitedUser = await storage.createUser({
          name: emailPrefix,
          username: emailPrefix, // Add username field
