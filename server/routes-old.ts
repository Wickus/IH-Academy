import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertClassSchema, insertAttendanceSchema } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// iCal utility functions
function generateICalEvent(classData: any, booking: any): string {
  const startDate = new Date(classData.startTime);
  const endDate = new Date(classData.endTime);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ItsBooked//EN
BEGIN:VEVENT
UID:${booking.id}@itsbooked.co.za
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${classData.name}
DESCRIPTION:Sports class booking for ${booking.participantName}\\n\\nLocation: ${classData.location || 'TBA'}\\nRequirements: ${classData.requirements || 'None'}
LOCATION:${classData.location || 'TBA'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Sports
  app.get("/api/sports", async (req, res) => {
    try {
      const sports = await storage.getAllSports();
      res.json(sports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  // Classes
  app.get("/api/classes", async (req, res) => {
    try {
      const { academyId, coachId, date } = req.query;
      let classes;

      if (academyId) {
        classes = await storage.getClassesByAcademy(parseInt(academyId as string));
      } else if (coachId) {
        classes = await storage.getClassesByCoach(parseInt(coachId as string));
      } else if (date) {
        classes = await storage.getClassesByDate(new Date(date as string));
      } else {
        classes = await storage.getClassesByAcademy(1); // Default to first academy
      }

      // Enrich with sport and coach data
      const enrichedClasses = await Promise.all(classes.map(async (cls) => {
        const [sport, coach] = await Promise.all([
          storage.getAllSports().then(sports => sports.find(s => s.id === cls.sportId)),
          storage.getCoach(cls.coachId)
        ]);

        const bookings = await storage.getBookingsByClass(cls.id);
        const confirmedBookings = bookings.filter(b => b.paymentStatus === 'confirmed');

        return {
          ...cls,
          sport,
          coach,
          bookingCount: confirmedBookings.length,
          availableSpots: cls.capacity - confirmedBookings.length,
        };
      }));

      res.json(enrichedClasses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", async (req, res) => {
    try {
      const classData = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid class data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create class" });
      }
    }
  });

  app.get("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const classData = await storage.getClass(id);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      res.json(classData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });

  // Bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const { email, classId, recent } = req.query;
      let bookings;

      if (email) {
        bookings = await storage.getBookingsByEmail(email as string);
      } else if (classId) {
        bookings = await storage.getBookingsByClass(parseInt(classId as string));
      } else if (recent) {
        bookings = await storage.getRecentBookings(parseInt(recent as string) || 10);
      } else {
        bookings = await storage.getRecentBookings();
      }

      // Enrich with class data
      const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
        const classData = await storage.getClass(booking.classId);
        const sport = classData ? await storage.getAllSports().then(sports => 
          sports.find(s => s.id === classData.sportId)
        ) : null;

        return {
          ...booking,
          class: classData,
          sport,
        };
      }));

      res.json(enrichedBookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        bookingDate: new Date(),
      });

      // Check class capacity
      const classData = await storage.getClass(bookingData.classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      const existingBookings = await storage.getBookingsByClass(bookingData.classId);
      const confirmedBookings = existingBookings.filter(b => b.paymentStatus === 'confirmed');

      if (confirmedBookings.length >= classData.capacity) {
        return res.status(400).json({ message: "Class is full" });
      }

      const newBooking = await storage.createBooking(bookingData);

      // Send confirmation email with iCal attachment
      if (process.env.SMTP_USER) {
        const iCalContent = generateICalEvent(classData, newBooking);
        
        try {
          await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: newBooking.participantEmail,
            subject: `Booking Confirmation - ${classData.name}`,
            html: `
              <h2>Booking Confirmation</h2>
              <p>Dear ${newBooking.participantName},</p>
              <p>Your booking has been confirmed for:</p>
              <ul>
                <li><strong>Class:</strong> ${classData.name}</li>
                <li><strong>Date:</strong> ${new Date(classData.startTime).toLocaleDateString()}</li>
                <li><strong>Time:</strong> ${new Date(classData.startTime).toLocaleTimeString()} - ${new Date(classData.endTime).toLocaleTimeString()}</li>
                <li><strong>Location:</strong> ${classData.location || 'TBA'}</li>
                <li><strong>Amount:</strong> R${newBooking.amount}</li>
              </ul>
              <p>Please find the calendar event attached.</p>
              <p>Thank you for choosing Elite Sports Academy!</p>
            `,
            attachments: [
              {
                filename: 'class-booking.ics',
                content: iCalContent,
                contentType: 'text/calendar',
              },
            ],
          });
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
        }
      }

      res.status(201).json(newBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create booking" });
      }
    }
  });

  // Download iCal for booking
  app.get("/api/bookings/:id/ical", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const classData = await storage.getClass(booking.classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      const iCalContent = generateICalEvent(classData, booking);
      
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="class-booking-${booking.id}.ics"`);
      res.send(iCalContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate iCal file" });
    }
  });

  // Attendance
  app.get("/api/attendance/:classId", async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      const attendance = await storage.getAttendanceByClass(classId);
      const bookings = await storage.getBookingsByClass(classId);

      // Merge attendance with booking data
      const attendanceWithBookings = bookings.map(booking => {
        const attendanceRecord = attendance.find(att => att.bookingId === booking.id);
        return {
          booking,
          attendance: attendanceRecord || { status: 'pending' },
        };
      });

      res.json(attendanceWithBookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        markedAt: new Date(),
      });

      const newAttendance = await storage.markAttendance(attendanceData);
      res.status(201).json(newAttendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to mark attendance" });
      }
    }
  });

  app.put("/api/attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const attendanceData = req.body;
      
      const updatedAttendance = await storage.updateAttendance(id, {
        ...attendanceData,
        markedAt: new Date(),
      });

      if (!updatedAttendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }

      res.json(updatedAttendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attendance" });
    }
  });

  // Payfast webhook (simplified for demo)
  app.post("/api/payfast/webhook", async (req, res) => {
    try {
      const { payment_status, m_payment_id, item_name, amount_gross } = req.body;
      
      // In a real implementation, you would verify the Payfast signature
      // and validate the payment data
      
      if (payment_status === 'COMPLETE') {
        // Find booking by Payfast payment ID and update status
        const bookings = await storage.getRecentBookings(1000); // Get all recent bookings
        const booking = bookings.find(b => b.payfastPaymentId === m_payment_id);
        
        if (booking) {
          await storage.updateBooking(booking.id, { paymentStatus: 'confirmed' });
        }
      }

      res.status(200).send('OK');
    } catch (error) {
      res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  // Coaches
  app.get("/api/coaches", async (req, res) => {
    try {
      const { academyId } = req.query;
      let coaches;

      if (academyId) {
        coaches = await storage.getCoachesByAcademy(parseInt(academyId as string));
      } else {
        coaches = await storage.getCoachesByAcademy(1); // Default academy
      }

      // Enrich with user data
      const enrichedCoaches = await Promise.all(coaches.map(async (coach) => {
        const user = await storage.getUser(coach.userId);
        return {
          ...coach,
          user,
        };
      }));

      res.json(enrichedCoaches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coaches" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
