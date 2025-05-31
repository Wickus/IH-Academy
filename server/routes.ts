import type { Express, Request, Response } from "express";
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

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
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error registering user:", error);
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
      
      res.json(user);
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      // Return organization admin for testing navigation
      const user = {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "organization_admin" as const,
        organizationId: 1,
        isActive: true
      };
      res.json(user);
    } catch (error) {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Organization routes
  app.get("/api/organizations", async (req: Request, res: Response) => {
    try {
      const organizations = await storage.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
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
      const orgData = req.body;
      const organization = await storage.createOrganization(orgData);
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.post("/api/organizations/:id/follow", async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      const userId = 1; // In production, get from session/JWT
      
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
      const organizationId = parseInt(req.params.id);
      const userId = 1; // In production, get from session/JWT
      
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
      const sportData = req.body;
      const sport = await storage.createSport(sportData);
      res.json(sport);
    } catch (error) {
      console.error("Error creating sport:", error);
      res.status(500).json({ message: "Failed to create sport" });
    }
  });

  // Classes routes
  app.get("/api/classes", async (req: Request, res: Response) => {
    try {
      const { organizationId, coachId, date, public: isPublic } = req.query;
      let classes;

      if (isPublic === 'true') {
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
      let bookings;

      if (email) {
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

      if (organizationId) {
        coaches = await storage.getCoachesByOrganization(parseInt(organizationId as string));
      } else {
        // Return all coaches from all organizations (for global admin)
        coaches = await storage.getCoachesByOrganization(1); // Default to first org
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
      const userId = req.user?.id;
      
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
      const userId = req.user?.id;
      
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
      const userId = req.user?.id;
      
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

  // Routes registered successfully
  console.log("Multi-tenant API routes with real-time WebSocket support registered");
  return httpServer;
}