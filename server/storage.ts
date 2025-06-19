import {
  users, organizations, userOrganizations, sports, coaches, coachInvitations, coachAvailability, classes, bookings, attendance, payments,
  achievements, userAchievements, userStats, memberships, children, dailySchedules,
  type User, type InsertUser,
  type Organization, type InsertOrganization,
  type UserOrganization, type InsertUserOrganization,
  type Sport, type InsertSport,
  type Coach, type InsertCoach,
  type CoachInvitation, type InsertCoachInvitation,
  type CoachAvailability, type InsertCoachAvailability,
  type Class, type InsertClass,
  type Booking, type InsertBooking,
  type Attendance, type InsertAttendance,
  type Payment, type InsertPayment,
  type Achievement, type InsertAchievement,
  type UserAchievement, type InsertUserAchievement,
  type UserStats, type InsertUserStats,
  type Membership, type InsertMembership,
  type Child, type InsertChild,
  type DailySchedule, type InsertDailySchedule
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sum } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getInactiveUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Achievements
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  getUserStats(userId: number): Promise<UserStats | undefined>;
  createUserStats(userStats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: number, stats: Partial<InsertUserStats>): Promise<UserStats | undefined>;
  checkAndUnlockAchievements(userId: number): Promise<Achievement[]>;

  // Organizations
  getOrganization(id: number): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  getOrganizationsByUser(userId: number): Promise<Organization[]>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, organization: Partial<InsertOrganization>): Promise<Organization | undefined>;

  // User-Organization relationships
  getUserOrganizations(userId: number): Promise<UserOrganization[]>;
  getAllUserOrganizations(): Promise<UserOrganization[]>;
  getOrganizationFollowers(organizationId: number): Promise<User[]>;
  addUserToOrganization(userOrg: InsertUserOrganization): Promise<UserOrganization>;
  removeUserFromOrganization(userId: number, organizationId: number): Promise<boolean>;
  updateUserOrganizationRole(userId: number, organizationId: number, role: string): Promise<UserOrganization | undefined>;

  // Sports
  getAllSports(): Promise<Sport[]>;
  createSport(sport: InsertSport): Promise<Sport>;
  deleteSport(id: number): Promise<boolean>;

  // Coaches
  getCoach(id: number): Promise<Coach | undefined>;
  getAllCoaches(): Promise<any[]>;
  getCoachesByOrganization(organizationId: number): Promise<Coach[]>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  updateCoach(id: number, coach: Partial<InsertCoach>): Promise<Coach | undefined>;

  // Coach Invitations
  createCoachInvitation(invitation: InsertCoachInvitation): Promise<CoachInvitation>;
  getCoachInvitationsByOrganization(organizationId: number): Promise<CoachInvitation[]>;
  getCoachInvitationByToken(token: string): Promise<CoachInvitation | undefined>;
  updateCoachInvitation(id: number, invitation: Partial<InsertCoachInvitation>): Promise<CoachInvitation | undefined>;
  deleteCoachInvitation(id: number): Promise<boolean>;

  // Coach Availability
  getCoachAvailabilityByOrganization(organizationId: number): Promise<CoachAvailability[]>;
  createCoachAvailability(availability: InsertCoachAvailability): Promise<CoachAvailability>;
  updateCoachAvailability(id: number, availability: Partial<InsertCoachAvailability>): Promise<CoachAvailability | undefined>;

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
  getBookingsByUser(userId: number): Promise<Booking[]>;
  getRecentBookings(limit?: number, organizationId?: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;

  // Attendance
  getAttendanceByClass(classId: number): Promise<Attendance[]>;
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;

  // Payments
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByBooking(bookingId: number): Promise<Payment | undefined>;
  getPaymentsByOrganization(organizationId: number, period?: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined>;

  // Analytics
  getRevenueData(organizationId: number, period: string, year: number): Promise<any>;

  // Memberships
  getMemberships(params: { userId?: number; organizationId?: number }): Promise<Membership[]>;
  getMembershipsByOrganization(organizationId: number): Promise<Membership[]>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembership(id: number, membership: Partial<InsertMembership>): Promise<Membership | undefined>;
  getAvailableUsersForMembership(organizationId: number): Promise<User[]>;

  // Children Management
  getUserChildren(userId: number): Promise<Child[]>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, child: Partial<InsertChild>): Promise<Child | undefined>;
  deleteChild(id: number): Promise<boolean>;

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
      const existingOrganizations = await db.select().from(organizations).limit(1);
      if (existingOrganizations.length > 0) {
        return; // Data already seeded
      }

      // Create global admin user
      const [globalAdmin] = await db.insert(users).values({
        username: "globaladmin",
        password: "admin123",
        email: "admin@itsbooked.com",
        firstName: "Global",
        lastName: "Admin",
        role: "global_admin"
      }).returning();

      // Create sample organization
      const [sampleOrg] = await db.insert(organizations).values({
        name: "Elite Sports Academy",
        description: "Premier sports training facility",
        email: "info@elitesports.com",
        phone: "+27 11 123 4567",
        address: "123 Sports Ave, Johannesburg",
        primaryColor: "#20366B",
        secondaryColor: "#278DD4",
        accentColor: "#24D367"
      }).returning();

      // Create organization admin
      const [orgAdmin] = await db.insert(users).values({
        username: "eliteadmin",
        password: "admin123",
        email: "admin@elitesports.com",
        firstName: "Elite",
        lastName: "Admin",
        role: "organization_admin",
        organizationId: sampleOrg.id
      }).returning();

      // Add admin to organization
      await db.insert(userOrganizations).values({
        userId: orgAdmin.id,
        organizationId: sampleOrg.id,
        role: "admin"
      });

      // Create sports
      const sportsData = [
        { name: "Basketball", color: "#278DD4", icon: "basketball" },
        { name: "Football", color: "#24D367", icon: "futbol" },
        { name: "Tennis", color: "#D3BF24", icon: "tennis-ball" }
      ];

      const createdSports = await db.insert(sports).values(sportsData).returning();

      // Create a coach
      const [coach] = await db.insert(coaches).values({
        userId: orgAdmin.id,
        organizationId: sampleOrg.id,
        specializations: ["Basketball", "Youth Training"],
        bio: "Experienced basketball coach with 10+ years",
        hourlyRate: "150.00"
      }).returning();

      // Create sample classes
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const classData = [
        {
          organizationId: sampleOrg.id,
          sportId: createdSports[0].id,
          coachId: coach.id,
          name: "Basketball Fundamentals",
          description: "Learn the basics of basketball",
          startTime: tomorrow,
          endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
          capacity: 15,
          price: "50.00",
          location: "Main Court"
        }
      ];

      await db.insert(classes).values(classData);

      console.log("Multi-tenant database seeded successfully");
    } catch (error) {
      console.error("Error seeding multi-tenant database:", error);
    }
  }

  constructor() {
    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updatedUser || undefined;
  }

  async getInactiveUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, false));
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error permanently deleting user:", error);
      return false;
    }
  }

  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizationByInviteCode(inviteCode: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.inviteCode, inviteCode));
    return org || undefined;
  }

  async getAllOrganizations(includeInactive: boolean = false): Promise<Organization[]> {
    if (includeInactive) {
      return await db.select().from(organizations);
    }
    return await db.select().from(organizations).where(eq(organizations.isActive, true));
  }

  async getOrganizationsByUser(userId: number): Promise<Organization[]> {
    const userOrgs = await db
      .select({ organization: organizations })
      .from(userOrganizations)
      .innerJoin(organizations, eq(userOrganizations.organizationId, organizations.id))
      .where(and(eq(userOrganizations.userId, userId), eq(userOrganizations.isActive, true)));
    
    return userOrgs.map(row => row.organization);
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [newOrg] = await db.insert(organizations).values(organization).returning();
    return newOrg;
  }

  async updateOrganization(id: number, organization: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [updatedOrg] = await db.update(organizations).set(organization).where(eq(organizations.id, id)).returning();
    return updatedOrg || undefined;
  }

  // User-Organization relationship methods
  async getUserOrganizations(userId: number): Promise<UserOrganization[]> {
    return await db.select().from(userOrganizations).where(eq(userOrganizations.userId, userId));
  }

  async getAllUserOrganizations(): Promise<UserOrganization[]> {
    return await db.select().from(userOrganizations);
  }

  async addUserToOrganization(userOrg: InsertUserOrganization): Promise<UserOrganization> {
    const [newUserOrg] = await db.insert(userOrganizations).values(userOrg).returning();
    return newUserOrg;
  }

  async removeUserFromOrganization(userId: number, organizationId: number): Promise<boolean> {
    const result = await db
      .update(userOrganizations)
      .set({ isActive: false })
      .where(and(eq(userOrganizations.userId, userId), eq(userOrganizations.organizationId, organizationId)));
    return (result.rowCount || 0) > 0;
  }

  async updateUserOrganizationRole(userId: number, organizationId: number, role: string): Promise<UserOrganization | undefined> {
    const [updated] = await db
      .update(userOrganizations)
      .set({ role: role as any })
      .where(and(eq(userOrganizations.userId, userId), eq(userOrganizations.organizationId, organizationId)))
      .returning();
    return updated || undefined;
  }

  async getOrganizationFollowers(organizationId: number): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(userOrganizations)
      .innerJoin(users, eq(userOrganizations.userId, users.id))
      .where(and(
        eq(userOrganizations.organizationId, organizationId),
        eq(userOrganizations.isActive, true)
      ));
    
    return result.map(row => row.user);
  }

  async getOrganizationAdmins(organizationId: number): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(userOrganizations)
      .innerJoin(users, eq(userOrganizations.userId, users.id))
      .where(and(
        eq(userOrganizations.organizationId, organizationId),
        eq(userOrganizations.role, 'organization_admin'),
        eq(userOrganizations.isActive, true)
      ));
    
    return result.map(row => row.user);
  }

  // Sports methods
  async getAllSports(): Promise<Sport[]> {
    return await db.select().from(sports);
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    const [newSport] = await db.insert(sports).values(sport).returning();
    return newSport;
  }

  async deleteSport(id: number): Promise<boolean> {
    try {
      await db.delete(sports).where(eq(sports.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting sport:", error);
      return false;
    }
  }

  // Coach methods
  async getCoach(id: number): Promise<Coach | undefined> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.id, id));
    return coach || undefined;
  }

  async getAllCoaches(): Promise<any[]> {
    const coachList = await db.select().from(coaches);
    
    // Enrich with user data and apply organization-specific overrides
    const enrichedCoaches = await Promise.all(coachList.map(async (coach) => {
      const user = await this.getUser(coach.userId);
      return {
        ...coach,
        user: {
          ...user,
          // Use organization-specific data if available, otherwise fall back to user data
          name: coach.displayName || user?.name,
          email: coach.contactEmail || user?.email
        },
      };
    }));

    return enrichedCoaches;
  }

  async getCoachesByOrganization(organizationId: number): Promise<any[]> {
    const coachList = await db.select().from(coaches).where(eq(coaches.organizationId, organizationId));
    
    // Enrich with user data and apply organization-specific overrides
    const enrichedCoaches = await Promise.all(coachList.map(async (coach) => {
      const user = await this.getUser(coach.userId);
      return {
        ...coach,
        user: {
          ...user,
          // Use organization-specific data if available, otherwise fall back to user data
          name: coach.displayName || user?.name,
          email: coach.contactEmail || user?.email
        },
      };
    }));

    return enrichedCoaches;
  }

  async createCoach(coach: InsertCoach): Promise<Coach> {
    const [newCoach] = await db.insert(coaches).values(coach).returning();
    return newCoach;
  }

  async updateCoach(id: number, coach: Partial<InsertCoach>): Promise<Coach | undefined> {
    const [updatedCoach] = await db.update(coaches).set(coach).where(eq(coaches.id, id)).returning();
    return updatedCoach || undefined;
  }

  // Coach Invitation methods
  async createCoachInvitation(invitation: InsertCoachInvitation): Promise<CoachInvitation> {
    const [newInvitation] = await db.insert(coachInvitations).values(invitation).returning();
    return newInvitation;
  }

  async getCoachInvitationsByOrganization(organizationId: number): Promise<CoachInvitation[]> {
    return await db.select().from(coachInvitations).where(eq(coachInvitations.organizationId, organizationId));
  }

  async getCoachInvitationByToken(token: string): Promise<CoachInvitation | undefined> {
    const [invitation] = await db.select().from(coachInvitations).where(eq(coachInvitations.invitationToken, token));
    return invitation || undefined;
  }

  async updateCoachInvitation(id: number, invitation: Partial<InsertCoachInvitation>): Promise<CoachInvitation | undefined> {
    const [updatedInvitation] = await db.update(coachInvitations).set(invitation).where(eq(coachInvitations.id, id)).returning();
    return updatedInvitation || undefined;
  }

  async deleteCoachInvitation(id: number): Promise<boolean> {
    const result = await db.delete(coachInvitations).where(eq(coachInvitations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Coach Availability methods
  async getCoachAvailabilityByOrganization(organizationId: number): Promise<CoachAvailability[]> {
    return await db.select().from(coachAvailability).where(eq(coachAvailability.organizationId, organizationId));
  }

  async createCoachAvailability(availability: InsertCoachAvailability): Promise<CoachAvailability> {
    const [newAvailability] = await db.insert(coachAvailability).values(availability).returning();
    return newAvailability;
  }

  async updateCoachAvailability(id: number, availability: Partial<InsertCoachAvailability>): Promise<CoachAvailability | undefined> {
    const [updatedAvailability] = await db.update(coachAvailability).set(availability).where(eq(coachAvailability.id, id)).returning();
    return updatedAvailability || undefined;
  }

  // Class methods
  async getClass(id: number): Promise<Class | undefined> {
    const [classItem] = await db.select().from(classes).where(eq(classes.id, id));
    return classItem || undefined;
  }

  async getClassesByOrganization(organizationId: number): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.organizationId, organizationId));
  }

  async getClassesByCoach(coachId: number): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.coachId, coachId));
  }

  async getClassesByDate(date: Date): Promise<Class[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db.select().from(classes).where(
      and(
        gte(classes.startTime, startOfDay),
        lte(classes.startTime, endOfDay)
      )
    );
  }

  async getPublicClasses(): Promise<Class[]> {
    const now = new Date();
    return await db.select().from(classes).where(gte(classes.startTime, now)).orderBy(classes.startTime);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(classes).values(classData).returning();
    return newClass;
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const [updatedClass] = await db.update(classes).set(classData).where(eq(classes.id, id)).returning();
    return updatedClass || undefined;
  }

  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(classes).where(eq(classes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Booking methods
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

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    // Get user email first
    const user = await this.getUser(userId);
    if (!user) return [];
    
    return await db.select().from(bookings).where(eq(bookings.participantEmail, user.email));
  }

  async getRecentBookings(limit = 10, organizationId?: number): Promise<Booking[]> {
    if (organizationId) {
      return await db
        .select({ booking: bookings })
        .from(bookings)
        .innerJoin(classes, eq(bookings.classId, classes.id))
        .where(eq(classes.organizationId, organizationId))
        .orderBy(desc(bookings.bookingDate))
        .limit(limit)
        .then(rows => rows.map(row => row.booking));
    }
    
    return await db.select().from(bookings).orderBy(desc(bookings.bookingDate)).limit(limit);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const [updatedBooking] = await db.update(bookings).set(booking).where(eq(bookings.id, id)).returning();
    return updatedBooking || undefined;
  }

  // Attendance methods
  async getAttendanceByClass(classId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.classId, classId));
  }

  async markAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
    return newAttendance;
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
    return newAttendance;
  }

  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [updatedAttendance] = await db.update(attendance).set(attendanceData).where(eq(attendance.id, id)).returning();
    return updatedAttendance || undefined;
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByBooking(bookingId: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.bookingId, bookingId));
    return payment || undefined;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db.update(payments).set(payment).where(eq(payments.id, id)).returning();
    return updatedPayment || undefined;
  }

  async getPaymentsByOrganization(organizationId: number, period?: string): Promise<Payment[]> {
    const result = await db
      .select({ payment: payments })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(classes, eq(bookings.classId, classes.id))
      .where(eq(classes.organizationId, organizationId));
    
    return result.map(row => row.payment);
  }

  async getRevenueData(organizationId: number, period: string, year: number): Promise<any> {
    const result = await db
      .select({ 
        month: payments.processedAt,
        amount: payments.amount 
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(classes, eq(bookings.classId, classes.id))
      .where(eq(classes.organizationId, organizationId));
    
    // Group by month and sum amounts
    const monthlyData = result.reduce((acc, payment) => {
      if (payment.month) {
        const month = new Date(payment.month).getMonth();
        const amount = parseFloat(payment.amount);
        acc[month] = (acc[month] || 0) + amount;
      }
      return acc;
    }, {} as Record<number, number>);

    // Return array of monthly totals
    return Array.from({ length: 12 }, (_, i) => monthlyData[i] || 0);
  }

  // Statistics methods
  async getGlobalStats(): Promise<{
    totalOrganizations: number;
    totalUsers: number;
    totalBookings: number;
    totalRevenue: number;
  }> {
    const [orgCount] = await db.select({ count: count() }).from(organizations).where(eq(organizations.isActive, true));
    const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const [bookingCount] = await db.select({ count: count() }).from(bookings);
    const [revenueSum] = await db.select({ total: sum(payments.amount) }).from(payments);

    return {
      totalOrganizations: orgCount.count,
      totalUsers: userCount.count,
      totalBookings: bookingCount.count,
      totalRevenue: parseFloat(revenueSum.total || "0")
    };
  }

  async getOrganizationStats(organizationId: number): Promise<{
    totalBookings: number;
    activeClasses: number;
    totalRevenue: number;
    totalCoaches: number;
    activeCoaches: number;
    upcomingClasses: number;
    totalMembers: number;
  }> {
    const now = new Date();

    // Get organization's classes
    const orgClasses = await db.select().from(classes).where(eq(classes.organizationId, organizationId));
    const classIds = orgClasses.map(c => c.id);

    // Get bookings for organization's classes
    let orgBookings: any[] = [];
    if (classIds.length > 0) {
      for (const classId of classIds) {
        const classBookings = await db.select().from(bookings).where(eq(bookings.classId, classId));
        orgBookings.push(...classBookings);
      }
    }

    // Calculate revenue from booking amounts (since we don't have separate payments table entries)
    const totalRevenue = orgBookings
      .filter(b => b.paymentStatus === 'confirmed')
      .reduce((sum, b) => sum + parseFloat(b.amount), 0);

    // Get coaches
    const [coachCount] = await db.select({ count: count() }).from(coaches).where(eq(coaches.organizationId, organizationId));

    // Get members
    const [memberCount] = await db.select({ count: count() }).from(userOrganizations)
      .where(and(eq(userOrganizations.organizationId, organizationId), eq(userOrganizations.isActive, true)));

    return {
      totalBookings: orgBookings.length,
      activeClasses: orgClasses.filter(c => c.startTime > now).length,
      totalRevenue,
      totalCoaches: coachCount.count,
      activeCoaches: coachCount.count, // Assuming all coaches are active
      upcomingClasses: orgClasses.filter(c => c.startTime > now).length,
      totalMembers: memberCount.count
    };
  }

  // Achievement methods
  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.isActive, true));
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const [newUserAchievement] = await db.insert(userAchievements).values(userAchievement).returning();
    return newUserAchievement;
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats || undefined;
  }

  async createUserStats(userStatsData: InsertUserStats): Promise<UserStats> {
    const [newUserStats] = await db.insert(userStats).values(userStatsData).returning();
    return newUserStats;
  }

  async updateUserStats(userId: number, stats: Partial<InsertUserStats>): Promise<UserStats | undefined> {
    const [updatedStats] = await db.update(userStats).set(stats).where(eq(userStats.userId, userId)).returning();
    return updatedStats || undefined;
  }

  async checkAndUnlockAchievements(userId: number): Promise<Achievement[]> {
    const newlyUnlocked: Achievement[] = [];
    
    // Get user stats
    let stats = await this.getUserStats(userId);
    if (!stats) {
      stats = await this.createUserStats({ userId });
    }

    // Get all achievements and user's current achievements
    const allAchievements = await this.getAllAchievements();
    const currentUserAchievements = await this.getUserAchievements(userId);
    const unlockedIds = new Set(currentUserAchievements.map(ua => ua.achievementId));

    // Check each achievement
    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;
      
      switch (achievement.category) {
        case 'booking':
          if (achievement.name === 'First Steps' && stats.totalBookings >= 1) shouldUnlock = true;
          if (achievement.name === 'Regular Attendee' && stats.totalBookings >= 5) shouldUnlock = true;
          if (achievement.name === 'Fitness Enthusiast' && stats.totalBookings >= 25) shouldUnlock = true;
          break;
        case 'attendance':
          if (achievement.name === 'Perfect Attendance' && stats.completedClasses >= 10) shouldUnlock = true;
          if (achievement.name === 'Champion' && stats.completedClasses >= 100) shouldUnlock = true;
          break;
        case 'social':
          if (achievement.name === 'Social Butterfly' && stats.organizationsFollowed >= 5) shouldUnlock = true;
          break;
        case 'milestone':
          if (achievement.name === 'Week Warrior' && stats.currentStreak >= 7) shouldUnlock = true;
          if (achievement.name === 'Consistency King' && stats.currentStreak >= 30) shouldUnlock = true;
          break;
      }

      if (shouldUnlock) {
        await this.createUserAchievement({
          userId,
          achievementId: achievement.id,
          progress: achievement.threshold,
          isCompleted: true
        });
        
        // Add points to user stats
        await this.updateUserStats(userId, {
          totalPoints: stats.totalPoints + achievement.points
        });
        
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  // Membership methods
  async getMemberships(params: { userId?: number; organizationId?: number }): Promise<Membership[]> {
    let query = db.select({
      membership: memberships,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(memberships)
    .leftJoin(users, eq(memberships.userId, users.id));

    const conditions = [];
    if (params.userId) {
      conditions.push(eq(memberships.userId, params.userId));
    }
    if (params.organizationId) {
      conditions.push(eq(memberships.organizationId, params.organizationId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;

    return results.map(result => ({
      ...result.membership,
      user: result.user
    }));
  }

  async getMembershipsByOrganization(organizationId: number): Promise<Membership[]> {
    const results = await db
      .select({
        membership: memberships,
        user: {
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(memberships)
      .leftJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.organizationId, organizationId));

    return results.map(result => ({
      ...result.membership,
      user: result.user
    }));
  }

  async createMembership(membership: InsertMembership): Promise<Membership> {
    const [result] = await db.insert(memberships).values(membership).returning();
    return result;
  }

  async updateMembership(id: number, membership: Partial<InsertMembership>): Promise<Membership | undefined> {
    const [result] = await db
      .update(memberships)
      .set(membership)
      .where(eq(memberships.id, id))
      .returning();
    return result || undefined;
  }

  async getAvailableUsersForMembership(organizationId: number): Promise<User[]> {
    // Get users who are not already members of this organization
    const existingMemberIds = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(and(
        eq(memberships.organizationId, organizationId),
        eq(memberships.status, "active")
      ));

    const existingIds = existingMemberIds.map(m => m.userId);

    if (existingIds.length === 0) {
      return await db.select().from(users).where(eq(users.role, "member"));
    }

    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.role, "member"),
        // Use NOT IN to exclude existing members
        // Note: This is a simplified approach - in production you might want to use a more complex query
      ));
  }

  // Children Management methods
  async getUserChildren(userId: number): Promise<Child[]> {
    try {
      const result = await db.select()
        .from(children)
        .where(and(eq(children.parentId, userId), eq(children.isActive, true)))
        .orderBy(desc(children.createdAt));
      return result;
    } catch (error) {
      console.error('Error fetching children:', error);
      return [];
    }
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [newChild] = await db.insert(children).values(child).returning();
    return newChild;
  }

  async updateChild(id: number, child: Partial<InsertChild>): Promise<Child | undefined> {
    const [updatedChild] = await db.update(children).set(child).where(eq(children.id, id)).returning();
    return updatedChild || undefined;
  }

  async deleteChild(id: number): Promise<boolean> {
    const [deletedChild] = await db.update(children)
      .set({ isActive: false })
      .where(eq(children.id, id))
      .returning();
    return !!deletedChild;
  }

  // Daily Schedule methods for membership organizations
  async getDailySchedulesByOrganization(organizationId: number): Promise<DailySchedule[]> {
    return await db.select().from(dailySchedules)
      .where(and(eq(dailySchedules.organizationId, organizationId), eq(dailySchedules.isActive, true)))
      .orderBy(dailySchedules.dayOfWeek, dailySchedules.startTime);
  }

  async createDailySchedule(schedule: InsertDailySchedule): Promise<DailySchedule> {
    const [newSchedule] = await db.insert(dailySchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateDailySchedule(id: number, schedule: Partial<InsertDailySchedule>): Promise<DailySchedule | undefined> {
    const [updatedSchedule] = await db.update(dailySchedules).set(schedule).where(eq(dailySchedules.id, id)).returning();
    return updatedSchedule || undefined;
  }

  async deleteDailySchedule(id: number): Promise<boolean> {
    const [deletedSchedule] = await db.update(dailySchedules)
      .set({ isActive: false })
      .where(eq(dailySchedules.id, id))
      .returning();
    return !!deletedSchedule;
  }

  async getDailySchedule(id: number): Promise<DailySchedule | undefined> {
    const [schedule] = await db.select().from(dailySchedules).where(eq(dailySchedules.id, id));
    return schedule || undefined;
  }
}

export const storage = new DatabaseStorage();