import {
  users, academies, sports, coaches, classes, bookings, attendance, payments,
  type User, type InsertUser,
  type Academy, type InsertAcademy,
  type Sport, type InsertSport,
  type Coach, type InsertCoach,
  type Class, type InsertClass,
  type Booking, type InsertBooking,
  type Attendance, type InsertAttendance,
  type Payment, type InsertPayment
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Academies
  getAcademy(id: number): Promise<Academy | undefined>;
  getAllAcademies(): Promise<Academy[]>;
  createAcademy(academy: InsertAcademy): Promise<Academy>;
  updateAcademy(id: number, academy: Partial<InsertAcademy>): Promise<Academy | undefined>;

  // Sports
  getAllSports(): Promise<Sport[]>;
  createSport(sport: InsertSport): Promise<Sport>;

  // Coaches
  getCoach(id: number): Promise<Coach | undefined>;
  getCoachesByAcademy(academyId: number): Promise<Coach[]>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  updateCoach(id: number, coach: Partial<InsertCoach>): Promise<Coach | undefined>;

  // Classes
  getClass(id: number): Promise<Class | undefined>;
  getClassesByAcademy(academyId: number): Promise<Class[]>;
  getClassesByCoach(coachId: number): Promise<Class[]>;
  getClassesByDate(date: Date): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;

  // Bookings
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByClass(classId: number): Promise<Booking[]>;
  getBookingsByEmail(email: string): Promise<Booking[]>;
  getRecentBookings(limit?: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;

  // Attendance
  getAttendanceByClass(classId: number): Promise<Attendance[]>;
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;

  // Payments
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByBooking(bookingId: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined>;

  // Statistics
  getStats(academyId?: number): Promise<{
    totalBookings: number;
    activeClasses: number;
    totalRevenue: number;
    totalCoaches: number;
    activeCoaches: number;
    upcomingClasses: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  private async seedData() {
    try {
      // Check if data already exists
      const existingAcademies = await db.select().from(academies);
      if (existingAcademies.length > 0) return;

      // Create default academy
      const [academy] = await db.insert(academies).values({
        name: "Elite Sports Academy",
        description: "Premier sports training facility",
        address: "123 Sports Boulevard, Cape Town",
        phone: "+27 21 123 4567",
        email: "info@elitesports.co.za",
        logo: null,
      }).returning();

      // Create default sports
      const sportsData = [
        { name: "Basketball", color: "#278DD4", icon: "fas fa-basketball-ball" },
        { name: "Soccer", color: "#24D367", icon: "fas fa-futbol" },
        { name: "Tennis", color: "#D3BF24", icon: "fas fa-table-tennis" },
        { name: "Swimming", color: "#278DD4", icon: "fas fa-swimmer" },
      ];

      await db.insert(sports).values(sportsData);

      // Create default admin user
      await db.insert(users).values({
        username: "admin",
        password: "admin123",
        email: "admin@elitesports.co.za",
        name: "Sarah Johnson",
        role: "admin",
        academyId: academy.id,
      });
    } catch (error) {
      console.error('Failed to seed data:', error);
    }
  }

  constructor() {
    this.seedData();
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  // Academies
  async getAcademy(id: number): Promise<Academy | undefined> {
    const [academy] = await db.select().from(academies).where(eq(academies.id, id));
    return academy || undefined;
  }

  async getAllAcademies(): Promise<Academy[]> {
    return await db.select().from(academies);
  }

  async createAcademy(academy: InsertAcademy): Promise<Academy> {
    const [newAcademy] = await db
      .insert(academies)
      .values(academy)
      .returning();
    return newAcademy;
  }

  async updateAcademy(id: number, academy: Partial<InsertAcademy>): Promise<Academy | undefined> {
    const [updated] = await db
      .update(academies)
      .set(academy)
      .where(eq(academies.id, id))
      .returning();
    return updated || undefined;
  }

  // Sports
  async getAllSports(): Promise<Sport[]> {
    return Array.from(this.sports.values());
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    const newSport: Sport = { ...sport, id: this.currentIds.sports++ };
    this.sports.set(newSport.id, newSport);
    return newSport;
  }

  // Coaches
  async getCoach(id: number): Promise<Coach | undefined> {
    return this.coaches.get(id);
  }

  async getCoachesByAcademy(academyId: number): Promise<Coach[]> {
    return Array.from(this.coaches.values()).filter(coach => coach.academyId === academyId);
  }

  async createCoach(coach: InsertCoach): Promise<Coach> {
    const newCoach: Coach = { 
      ...coach, 
      id: this.currentIds.coaches++,
      specializations: coach.specializations || null,
      bio: coach.bio || null,
      hourlyRate: coach.hourlyRate || null
    };
    this.coaches.set(newCoach.id, newCoach);
    return newCoach;
  }

  async updateCoach(id: number, coach: Partial<InsertCoach>): Promise<Coach | undefined> {
    const existing = this.coaches.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...coach };
    this.coaches.set(id, updated);
    return updated;
  }

  // Classes
  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getClassesByAcademy(academyId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(cls => cls.academyId === academyId);
  }

  async getClassesByCoach(coachId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(cls => cls.coachId === coachId);
  }

  async getClassesByDate(date: Date): Promise<Class[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Array.from(this.classes.values()).filter(cls => {
      const classDate = new Date(cls.startTime);
      return classDate >= startOfDay && classDate <= endOfDay;
    });
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const newClass: Class = { 
      ...classData, 
      id: this.currentIds.classes++,
      description: classData.description || null,
      isRecurring: classData.isRecurring || false,
      recurrencePattern: classData.recurrencePattern || null,
      location: classData.location || null,
      requirements: classData.requirements || null
    };
    this.classes.set(newClass.id, newClass);
    return newClass;
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const existing = this.classes.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...classData };
    this.classes.set(id, updated);
    return updated;
  }

  async deleteClass(id: number): Promise<boolean> {
    return this.classes.delete(id);
  }

  // Bookings
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByClass(classId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.classId === classId);
  }

  async getBookingsByEmail(email: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.participantEmail === email);
  }

  async getRecentBookings(limit = 10): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
      .slice(0, limit);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const newBooking: Booking = { 
      ...booking, 
      id: this.currentIds.bookings++,
      participantPhone: booking.participantPhone || null,
      participantAge: booking.participantAge || null,
      paymentStatus: booking.paymentStatus || "pending",
      paymentMethod: booking.paymentMethod || null,
      payfastPaymentId: booking.payfastPaymentId || null,
      notes: booking.notes || null
    };
    this.bookings.set(newBooking.id, newBooking);
    return newBooking;
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existing = this.bookings.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...booking };
    this.bookings.set(id, updated);
    return updated;
  }

  // Attendance
  async getAttendanceByClass(classId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(att => att.classId === classId);
  }

  async markAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const newAttendance: Attendance = { 
      ...attendance, 
      id: this.currentIds.attendance++,
      status: attendance.status || "pending",
      markedAt: attendance.markedAt || null,
      markedBy: attendance.markedBy || null
    };
    this.attendance.set(newAttendance.id, newAttendance);
    return newAttendance;
  }

  async updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const existing = this.attendance.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...attendance };
    this.attendance.set(id, updated);
    return updated;
  }

  // Payments
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentByBooking(bookingId: number): Promise<Payment | undefined> {
    return Array.from(this.payments.values()).find(payment => payment.bookingId === bookingId);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const newPayment: Payment = { 
      ...payment, 
      id: this.currentIds.payments++,
      status: payment.status || "pending",
      payfastPaymentId: payment.payfastPaymentId || null,
      currency: payment.currency || "ZAR",
      payfastData: payment.payfastData || null,
      processedAt: payment.processedAt || null
    };
    this.payments.set(newPayment.id, newPayment);
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const existing = this.payments.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...payment };
    this.payments.set(id, updated);
    return updated;
  }

  // Statistics
  async getStats(academyId?: number): Promise<{
    totalBookings: number;
    activeClasses: number;
    totalRevenue: number;
    totalCoaches: number;
    activeCoaches: number;
    upcomingClasses: number;
  }> {
    const allBookings = Array.from(this.bookings.values());
    const allClasses = Array.from(this.classes.values()).filter(cls => 
      !academyId || cls.academyId === academyId
    );
    const allCoaches = Array.from(this.coaches.values()).filter(coach => 
      !academyId || coach.academyId === academyId
    );

    const now = new Date();
    const upcomingClasses = allClasses.filter(cls => new Date(cls.startTime) > now);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayClasses = allClasses.filter(cls => {
      const classDate = new Date(cls.startTime);
      return classDate >= todayStart && classDate <= todayEnd;
    });
    
    const activeCoaches = new Set(todayClasses.map(cls => cls.coachId)).size;

    const totalRevenue = allBookings
      .filter(booking => booking.paymentStatus === 'confirmed')
      .reduce((sum, booking) => sum + parseFloat(booking.amount.toString()), 0);

    return {
      totalBookings: allBookings.length,
      activeClasses: allClasses.length,
      totalRevenue,
      totalCoaches: allCoaches.length,
      activeCoaches,
      upcomingClasses: upcomingClasses.length,
    };
  }
}

export const storage = new MemStorage();
