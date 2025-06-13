import type { Express, Request, Response } from "express";
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { payfastService, type PayFastPaymentData } from "./payfast";

// Helper function to generate iCal events
function generateICalEvent(classData: any, booking: any): string {
  const startDate = new Date(classData.startTime);
  const endDate = new Date(classData.endTime);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ItsBooked//Sports Booking System//EN
BEGIN:VEVENT
UID:booking-${booking.id}@itsbooked.com
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

// Session storage using Map for better persistence
const sessions = new Map<string, any>();

// Helper function to generate session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Middleware to get current user from session
function getCurrentUser(req: any): any {
  const sessionId = req.cookies?.sessionId;
  
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }
  return null;
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
      sessions.set(sessionId, user);
      res.cookie('sessionId', sessionId, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 24 hours
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
      sessions.set(sessionId, user);
      res.cookie('sessionId', sessionId, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 24 hours
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

  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser || currentUser.role !== 'global_admin') {
        return res.status(403).json({ message: "Access denied. Global admin only." });
      }
      
      const userId = parseInt(req.params.id);
      const targetUser = await storage.getUser(userId);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (targetUser.role === 'global_admin') {
        return res.status(400).json({ message: "Cannot delete global admin user" });
      }
      
      // Soft delete by setting isActive to false
      const updatedUser = await storage.updateUser(userId, { isActive: false });
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
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
      
      // Soft delete by setting isActive to false
      const updatedOrg = await storage.updateOrganization(orgId, { isActive: false });
      if (!updatedOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
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
      const includeInactive = req.query.includeInactive === 'true' && user?.role === 'global_admin';
      const organizations = await storage.getAllOrganizations(includeInactive);
      
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
      const organization = await storage.createOrganization(orgData);
      
      // Update the current user's organizationId
      await storage.updateUser(user.id, { organizationId: organization.id });
      
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
      
      // Convert date strings to Date objects
      if (classData.startTime) {
        classData.startTime = new Date(classData.startTime);
      }
      if (classData.endTime) {
        classData.endTime = new Date(classData.endTime);
      }
      
      const newClass = await storage.createClass(classData);
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
      
      res.json(updatedClass);
    } catch (error) {
      console.error("Error updating class:", error);
      res.status(500).json({ message: "Failed to update class" });
    }
  });

  // Bookings routes
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
        specializations: coachData.specializations,
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

      // Update user data if provided
      if (userData && existingCoach.userId) {
        await storage.updateUser(existingCoach.userId, {
          name: userData.name,
          email: userData.email,
        });
      }

      // Update coach data
      const coachUpdateData = {
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

      // Get updated user data and return enriched coach
      const user = await storage.getUser(updatedCoach.userId);
      res.json({
        ...updatedCoach,
        user
      });
    } catch (error) {
      console.error("Error updating coach:", error);
      res.status(500).json({ message: "Failed to update coach" });
    }
  });

  // Attendance routes
  app.get("/api/attendance/:classId", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.classId);
      const attendance = await storage.getAttendanceByClass(classId);
      
      // Get booking info for each attendance record
      const attendanceWithBookings = await Promise.all(
        attendance.map(async (record: any) => {
          const booking = await storage.getBooking(record.bookingId);
          return {
            booking,
            attendance: {
              id: record.id,
              status: record.status,
              markedAt: record.markedAt,
              markedBy: record.markedBy
            }
          };
        })
      );

      res.json(attendanceWithBookings);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req: Request, res: Response) => {
    try {
      const attendanceData = req.body;
      const attendance = await storage.markAttendance(attendanceData);
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
      res.json(children);
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
      res.json(children);
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

  // PayFast payment creation endpoint
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
        return_url: `${req.protocol}://${req.get('host')}/payment-success?booking=${bookingId}`,
        cancel_url: `${req.protocol}://${req.get('host')}/payment-cancelled?booking=${bookingId}`,
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
      const paymentUrl = payfastService.generatePaymentUrl(paymentData, organization.payfastSandbox);

      res.json({ 
        paymentUrl,
        paymentId: paymentData.m_payment_id 
      });
    } catch (error) {
      console.error("Error creating PayFast payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // PayFast notification handler for membership payments
  app.post("/api/payfast-notify", async (req: Request, res: Response) => {
    try {
      const {
        payment_status,
        custom_str1: organizationId,
        custom_str2: userId,
        custom_str3: paymentType
      } = req.body;

      if (payment_status === 'COMPLETE' && paymentType === 'membership') {
        // Get organization details for membership duration
        const organization = await storage.getOrganization(parseInt(organizationId));
        
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
      const { classId } = req.body;
      
      const updatedBooking = await storage.updateBooking(bookingId, { classId });
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
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

  // Send message to members
  app.post("/api/messages/send", async (req: Request, res: Response) => {
    try {
      const { organizationId, memberIds, message, type } = req.body;
      
      // Send push notifications to selected members
      for (const memberId of memberIds) {
        console.log(`Sending notification to member ${memberId}:`, message);
      }
      
      res.json({ success: true, sentTo: memberIds.length });
    } catch (error) {
      console.error("Error sending messages:", error);
      res.status(500).json({ message: "Failed to send messages" });
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

  // Routes registered successfully
  console.log("Multi-tenant API routes with real-time WebSocket support registered");
  return httpServer;
}