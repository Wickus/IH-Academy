import type { Express, Request, Response } from "express";
import { Server } from "http";
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

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      // For now, return a mock user - in production this would use session/JWT
      const user = await storage.getUser(1);
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
      const classData = req.body;
      const newClass = await storage.createClass(classData);
      res.json(newClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class" });
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

      const booking = await storage.createBooking(bookingData);

      // Generate iCal file
      const classData = await storage.getClass(booking.classId);
      if (classData) {
        const icalContent = generateICalEvent(classData, booking);
        
        // In a real implementation, you would send this via email
        console.log("iCal content generated for booking:", booking.id);
      }

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
      const coachData = req.body;
      const coach = await storage.createCoach(coachData);
      res.json(coach);
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

  return new Promise((resolve) => {
    const server = app.listen(5001, () => {
      console.log("Multi-tenant API server running on port 5001");
      resolve(server);
    });
  });
}