import {
  users, organizations, userOrganizations, sports, coaches, classes, bookings, attendance, payments,
  type User, type InsertUser,
  type Organization, type InsertOrganization,
  type UserOrganization, type InsertUserOrganization,
  type Sport, type InsertSport,
  type Coach, type InsertCoach,
  type Class, type InsertClass,
  type Booking, type InsertBooking,
  type Attendance, type InsertAttendance,
  type Payment, type InsertPayment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Organizations
  getOrganization(id: number): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  getOrganizationsByUser(userId: number): Promise<Organization[]>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, organization: Partial<InsertOrganization>): Promise<Organization | undefined>;

  // User-Organization relationships
  getUserOrganizations(userId: number): Promise<UserOrganization[]>;
  addUserToOrganization(userOrg: InsertUserOrganization): Promise<UserOrganization>;
  removeUserFromOrganization(userId: number, organizationId: number): Promise<boolean>;
  updateUserOrganizationRole(userId: number, organizationId: number, role: string): Promise<UserOrganization | undefined>;

  // Sports
  getAllSports(): Promise<Sport[]>;
  createSport(sport: InsertSport): Promise<Sport>;

  // Coaches
  getCoach(id: number): Promise<Coach | undefined>;
  getCoachesByOrganization(organizationId: number): Promise<Coach[]>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  updateCoach(id: number, coach: Partial<InsertCoach>): Promise<Coach | undefined>;

  // Classes
  getClass(id: number): Promise<Class | undefined>;
  getClassesByOrganization(organizationId: number): Promise<Class[]>;
  getClassesByCoach(coachId: number): Promise<Class[]>;
  getClassesByDate(date: Date): Promise<Class[]>;
  getPublicClasses(): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;

  // Bookings
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByClass(classId: number): Promise<Booking[]>;
  getBookingsByEmail(email: string): Promise<Booking[]>;
  getRecentBookings(limit?: number, organizationId?: number): Promise<Booking[]>;
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
  getGlobalStats(): Promise<{
    totalOrganizations: number;
    totalUsers: number;
    totalBookings: number;
    totalRevenue: number;
  }>;
  getOrganizationStats(organizationId: number): Promise<{
    totalBookings: number;
    activeClasses: number;
    totalRevenue: number;
    totalCoaches: number;
    activeCoaches: number;
    upcomingClasses: number;
    totalMembers: number;
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
    return await db.select().from(sports);
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    const [newSport] = await db
      .insert(sports)
      .values(sport)
      .returning();
    return newSport;
  }

  // Coaches
  async getCoach(id: number): Promise<Coach | undefined> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.id, id));
    return coach || undefined;
  }

  async getCoachesByAcademy(academyId: number): Promise<Coach[]> {
    return await db.select().from(coaches).where(eq(coaches.academyId, academyId));
  }

  async createCoach(coach: InsertCoach): Promise<Coach> {
    const [newCoach] = await db
      .insert(coaches)
      .values(coach)
      .returning();
    return newCoach;
  }

  async updateCoach(id: number, coach: Partial<InsertCoach>): Promise<Coach | undefined> {
    const [updated] = await db
      .update(coaches)
      .set(coach)
      .where(eq(coaches.id, id))
      .returning();
    return updated || undefined;
  }

  // Classes
  async getClass(id: number): Promise<Class | undefined> {
    const [classItem] = await db.select().from(classes).where(eq(classes.id, id));
    return classItem || undefined;
  }

  async getClassesByAcademy(academyId: number): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.academyId, academyId));
  }

  async getClassesByCoach(coachId: number): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.coachId, coachId));
  }

  async getClassesByDate(date: Date): Promise<Class[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db.select().from(classes)
      .where(and(
        gte(classes.startTime, startOfDay),
        lte(classes.startTime, endOfDay)
      ));
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db
      .insert(classes)
      .values(classData)
      .returning();
    return newClass;
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const [updated] = await db
      .update(classes)
      .set(classData)
      .where(eq(classes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(classes).where(eq(classes.id, id));
    return result.rowCount > 0;
  }

  // Bookings
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingsByClass(classId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.classId, classId));
  }

  async getBookingsByEmail(email: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.participantEmail, email));
  }

  async getRecentBookings(limit = 10): Promise<Booking[]> {
    return await db.select().from(bookings)
      .orderBy(desc(bookings.bookingDate))
      .limit(limit);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values(booking)
      .returning();
    return newBooking;
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set(booking)
      .where(eq(bookings.id, id))
      .returning();
    return updated || undefined;
  }

  // Attendance
  async getAttendanceByClass(classId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.classId, classId));
  }

  async markAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db
      .insert(attendance)
      .values(attendanceData)
      .returning();
    return newAttendance;
  }

  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [updated] = await db
      .update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return updated || undefined;
  }

  // Payments
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByBooking(bookingId: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.bookingId, bookingId));
    return payment || undefined;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db
      .update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return updated || undefined;
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
    const now = new Date();
    
    // Get basic counts
    const allBookings = await db.select().from(bookings);
    const allClasses = await db.select().from(classes);
    const allCoaches = await db.select().from(coaches);
    
    // Filter by academy if specified
    const filteredBookings = academyId ? 
      allBookings.filter(booking => {
        const classForBooking = allClasses.find(cls => cls.id === booking.classId);
        return classForBooking?.academyId === academyId;
      }) : allBookings;
    
    const filteredClasses = academyId ? 
      allClasses.filter(cls => cls.academyId === academyId) : allClasses;
    
    const filteredCoaches = academyId ? 
      allCoaches.filter(coach => coach.academyId === academyId) : allCoaches;

    // Calculate stats
    const totalBookings = filteredBookings.length;
    const activeClasses = filteredClasses.filter(cls => cls.endTime > now).length;
    const upcomingClasses = filteredClasses.filter(cls => cls.startTime > now).length;
    const totalRevenue = filteredBookings
      .filter(booking => booking.paymentStatus === 'confirmed')
      .reduce((sum, booking) => sum + parseFloat(booking.amount), 0);
    
    const totalCoaches = filteredCoaches.length;
    const activeCoaches = filteredCoaches.length; // All coaches are considered active for now

    return {
      totalBookings,
      activeClasses,
      totalRevenue,
      totalCoaches,
      activeCoaches,
      upcomingClasses,
    };
  }
}

export const storage = new DatabaseStorage();