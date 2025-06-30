import {
  users, organizations, userOrganizations, sports, coaches, coachInvitations, coachAvailability, classes, bookings, attendance, payments,
  achievements, userAchievements, userStats, memberships, children, dailySchedules, messages, messageReplies,
  debitOrderMandates, debitOrderTransactions,
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
  type DailySchedule, type InsertDailySchedule,
  type Message, type InsertMessage,
  type MessageReply, type InsertMessageReply,
  type DebitOrderMandate, type InsertDebitOrderMandate,
  type DebitOrderTransaction, type InsertDebitOrderTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sum, sql, like, asc, ne, inArray, isNull, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getInactiveUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUserBookings(userId: number): Promise<any[]>;
  cleanupOrphanedUsers(): Promise<{ deletedCount: number; deletedUsers: string[] }>;

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
  startTrialPeriod(organizationId: number): Promise<Organization | undefined>;
  checkTrialStatus(organizationId: number): Promise<{ isExpired: boolean; daysRemaining: number; subscriptionStatus: string }>;
  getExpiredTrialOrganizations(): Promise<Organization[]>;

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

  // Messages
  getUserMessages(userId: number): Promise<any[]>;
  getMessageWithReplies(messageId: number): Promise<any>;
  createMessage(message: InsertMessage): Promise<Message>;
  createMessageReply(reply: InsertMessageReply): Promise<MessageReply>;
  markMessageAsRead(messageId: number): Promise<void>;
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
        email: "admin@ihacademy.africa",
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

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
      // Get the user details first
      const user = await this.getUser(id);
      if (!user) {
        console.log(`User with ID ${id} not found`);
        return false;
      }

      console.log(`Starting cascading deletion for user: ${user.email} (ID: ${id})`);

      // Delete user's bookings by email (since bookings table uses participantEmail)
      await db.delete(bookings).where(eq(bookings.participantEmail, user.email));
      console.log(`Deleted bookings for user ${user.email}`);
      
      // Delete user's coach records (if any)
      await db.delete(coaches).where(eq(coaches.userId, user.id));
      console.log(`Deleted coach records for user ${user.email}`);
      
      // Delete user's attendance records as coach (if any)
      await db.delete(attendance).where(eq(attendance.markedBy, user.id));
      console.log(`Deleted attendance records marked by user ${user.email}`);
      
      // Delete user's attendance records as participant by email (if any)
      await db.delete(attendance).where(eq(attendance.participantEmail, user.email));
      console.log(`Deleted attendance records for participant ${user.email}`);
      
      // Delete user's memberships (if any)
      await db.delete(memberships).where(eq(memberships.userId, user.id));
      console.log(`Deleted memberships for user ${user.email}`);
      
      // Delete user's debit order mandates (if any)
      await db.delete(debitOrderMandates).where(eq(debitOrderMandates.userId, user.id));
      console.log(`Deleted debit order mandates for user ${user.email}`);
      
      // Delete user's messages (if any)
      await db.delete(messages).where(eq(messages.senderId, user.id));
      await db.delete(messageReplies).where(eq(messageReplies.senderId, user.id));
      console.log(`Deleted messages for user ${user.email}`);
      
      // Delete user's user achievements (if any)
      await db.delete(userAchievements).where(eq(userAchievements.userId, user.id));
      console.log(`Deleted achievements for user ${user.email}`);
      
      // Delete user's user stats (if any)
      await db.delete(userStats).where(eq(userStats.userId, user.id));
      console.log(`Deleted stats for user ${user.email}`);
      
      // Delete user's children (if any)
      await db.delete(children).where(eq(children.parentId, user.id));
      console.log(`Deleted children records for user ${user.email}`);
      
      // Delete user organization relationships
      await db.delete(userOrganizations).where(eq(userOrganizations.userId, user.id));
      console.log(`Deleted organization relationships for user ${user.email}`);
      
      // Finally, delete the user
      await db.delete(users).where(eq(users.id, id));
      console.log(`Successfully deleted user: ${user.email} (ID: ${id})`);
      
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
    const allOrgs = await db.select().from(organizations);
    console.log(`Found ${allOrgs.length} total organizations in database`);
    
    // For global admin or when explicitly requested, return all organizations
    if (includeInactive) {
      console.log(`Returning all ${allOrgs.length} organizations (includeInactive=true)`);
      return allOrgs;
    }
    
    // For regular users, filter by isActive
    const activeOrgs = allOrgs.filter(org => org.isActive === true || org.isActive === null);
    console.log(`Returning ${activeOrgs.length} active organizations`);
    return activeOrgs;
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

  async startTrialPeriod(organizationId: number): Promise<Organization | undefined> {
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 21); // 21-day trial

    const [updatedOrg] = await db.update(organizations)
      .set({
        trialStartDate,
        trialEndDate,
        subscriptionStatus: 'trial',
        planType: 'basic' // Give them basic features during trial
      })
      .where(eq(organizations.id, organizationId))
      .returning();
    
    return updatedOrg || undefined;
  }

  async checkTrialStatus(organizationId: number): Promise<{
    isExpired: boolean;
    daysRemaining: number;
    subscriptionStatus: string;
  }> {
    const org = await this.getOrganization(organizationId);
    if (!org) {
      return { isExpired: false, daysRemaining: 0, subscriptionStatus: 'unknown' };
    }

    // Only show trial status for trial organizations
    if (org.subscriptionStatus !== 'trial') {
      return { isExpired: false, daysRemaining: 0, subscriptionStatus: org.subscriptionStatus || 'active' };
    }

    if (!org.trialEndDate) {
      return { isExpired: false, daysRemaining: 21, subscriptionStatus: 'trial' };
    }

    const now = new Date();
    const trialEndDate = new Date(org.trialEndDate);
    const timeDiff = trialEndDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      isExpired: daysRemaining <= 0,
      daysRemaining: Math.max(0, daysRemaining),
      subscriptionStatus: 'trial'
    };
  }

  async getExpiredTrialOrganizations(): Promise<Organization[]> {
    const now = new Date();
    return await db.select()
      .from(organizations)
      .where(
        and(
          eq(organizations.subscriptionStatus, 'trial'),
          lte(organizations.trialEndDate, now)
        )
      );
  }

  // User-Organization relationship methods
  async getUserOrganizations(userId: number): Promise<any[]> {
    const result = await db.select({
      id: userOrganizations.id,
      userId: userOrganizations.userId,
      organizationId: userOrganizations.organizationId,
      role: userOrganizations.role,
      joinedAt: userOrganizations.joinedAt,
      organizationName: organizations.name,
      organizationDescription: organizations.description,
      organizationIsActive: organizations.isActive,
      organizationEmail: organizations.email,
      organizationPrimaryColor: organizations.primaryColor,
      organizationLogo: organizations.logo
    })
    .from(userOrganizations)
    .innerJoin(organizations, eq(userOrganizations.organizationId, organizations.id))
    .where(eq(userOrganizations.userId, userId));
    
    return result;
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

  // Messages implementation
  async getUserMessages(userId: number): Promise<any[]> {
    // Get messages sent by the user
    const sentMessages = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        senderName: users.username,
        senderEmail: users.email,
        recipientType: messages.recipientType,
        recipientId: messages.recipientId,
        recipientName: organizations.name,
        subject: messages.subject,
        message: messages.message,
        status: messages.status,
        createdAt: messages.createdAt,
        messageType: sql<string>`'sent'`.as('messageType'),
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(organizations, eq(messages.recipientId, organizations.id))
      .where(eq(messages.senderId, userId))
      .orderBy(desc(messages.createdAt));

    // Get messages sent to organizations where the user is an ADMIN (not just a member)
    const userAdminOrgs = await db
      .select({ organizationId: userOrganizations.organizationId })
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.role, 'admin') // Only organization admins can receive messages
        )
      );

    const adminOrgIds = userAdminOrgs.map(org => org.organizationId);
    
    let receivedMessages: any[] = [];
    if (adminOrgIds.length > 0) {
      receivedMessages = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          senderName: users.username,
          senderEmail: users.email,
          recipientType: messages.recipientType,
          recipientId: messages.recipientId,
          recipientName: organizations.name,
          subject: messages.subject,
          message: messages.message,
          status: messages.status,
          createdAt: messages.createdAt,
          messageType: sql<string>`'received'`.as('messageType'),
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .leftJoin(organizations, eq(messages.recipientId, organizations.id))
        .where(
          and(
            inArray(messages.recipientId, adminOrgIds),
            ne(messages.senderId, userId) // Exclude messages sent by the current user
          )
        )
        .orderBy(desc(messages.createdAt));
    }

    // Combine and return all messages
    return [...sentMessages, ...receivedMessages].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getMessageWithReplies(messageId: number): Promise<any> {
    const message = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        senderName: users.username,
        senderEmail: users.email,
        recipientType: messages.recipientType,
        recipientId: messages.recipientId,
        recipientName: organizations.name,
        subject: messages.subject,
        message: messages.message,
        status: messages.status,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(organizations, eq(messages.recipientId, organizations.id))
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message.length) return null;

    const replies = await db
      .select({
        id: messageReplies.id,
        messageId: messageReplies.messageId,
        senderId: messageReplies.senderId,
        senderName: users.username,
        message: messageReplies.message,
        createdAt: messageReplies.createdAt,
      })
      .from(messageReplies)
      .leftJoin(users, eq(messageReplies.senderId, users.id))
      .where(eq(messageReplies.messageId, messageId))
      .orderBy(messageReplies.createdAt);

    return {
      ...message[0],
      replies
    };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async createMessageReply(reply: InsertMessageReply): Promise<MessageReply> {
    const [newReply] = await db
      .insert(messageReplies)
      .values(reply)
      .returning();
    return newReply;
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ 
        status: 'read',
        updatedAt: new Date()
      })
      .where(eq(messages.id, messageId));
  }

  // Debit Order Mandate methods
  async createDebitOrderMandate(mandateData: InsertDebitOrderMandate): Promise<DebitOrderMandate> {
    const mandateReference = `DO${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const [newMandate] = await db
      .insert(debitOrderMandates)
      .values({
        ...mandateData,
        mandateReference,
      })
      .returning();
    return newMandate;
  }

  async getDebitOrderMandatesByUser(userId: number): Promise<DebitOrderMandate[]> {
    return await db.select().from(debitOrderMandates).where(eq(debitOrderMandates.userId, userId));
  }

  async getDebitOrderMandate(id: number): Promise<DebitOrderMandate | undefined> {
    const [mandate] = await db.select().from(debitOrderMandates).where(eq(debitOrderMandates.id, id));
    return mandate || undefined;
  }

  async updateDebitOrderMandate(id: number, mandateData: Partial<InsertDebitOrderMandate>): Promise<DebitOrderMandate | undefined> {
    const [updatedMandate] = await db
      .update(debitOrderMandates)
      .set({ ...mandateData, updatedAt: new Date() })
      .where(eq(debitOrderMandates.id, id))
      .returning();
    return updatedMandate || undefined;
  }

  async activateDebitOrderMandate(id: number): Promise<DebitOrderMandate | undefined> {
    const [activatedMandate] = await db
      .update(debitOrderMandates)
      .set({ 
        status: 'active', 
        signedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(debitOrderMandates.id, id))
      .returning();
    return activatedMandate || undefined;
  }

  // Debit Order Transaction methods
  async createDebitOrderTransaction(transactionData: InsertDebitOrderTransaction): Promise<DebitOrderTransaction> {
    const transactionReference = `TX${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const [newTransaction] = await db
      .insert(debitOrderTransactions)
      .values({
        ...transactionData,
        transactionReference,
      })
      .returning();
    return newTransaction;
  }

  async getDebitOrderTransactionsByMandate(mandateId: number): Promise<DebitOrderTransaction[]> {
    return await db.select().from(debitOrderTransactions).where(eq(debitOrderTransactions.mandateId, mandateId));
  }

  async getDebitOrderTransaction(id: number): Promise<DebitOrderTransaction | undefined> {
    const [transaction] = await db.select().from(debitOrderTransactions).where(eq(debitOrderTransactions.id, id));
    return transaction || undefined;
  }

  async updateDebitOrderTransaction(id: number, transactionData: Partial<InsertDebitOrderTransaction>): Promise<DebitOrderTransaction | undefined> {
    const [updatedTransaction] = await db
      .update(debitOrderTransactions)
      .set(transactionData)
      .where(eq(debitOrderTransactions.id, id))
      .returning();
    return updatedTransaction || undefined;
  }

  async getActiveDebitOrderMandates(): Promise<DebitOrderMandate[]> {
    return await db
      .select()
      .from(debitOrderMandates)
      .where(
        and(
          eq(debitOrderMandates.status, 'active'),
          eq(debitOrderMandates.isActive, true)
        )
      );
  }

  async getPendingDebitOrderTransactions(): Promise<DebitOrderTransaction[]> {
    return await db
      .select()
      .from(debitOrderTransactions)
      .where(eq(debitOrderTransactions.status, 'pending'));
  }

  // Delete organization and all related data
  async deleteOrganization(id: number): Promise<void> {
    console.log(`Starting hard deletion of organization ID: ${id}`);
    
    // Get organization info before deletion for logging
    const orgToDelete = await this.getOrganization(id);
    if (!orgToDelete) {
      throw new Error(`Organization with ID ${id} not found`);
    }
    console.log(`Permanently deleting organization: ${orgToDelete.name} (ID: ${id})`);
    
    try {
      // Delete in correct order to handle foreign key constraints
      
      // 1. Delete debit order transactions first
      const transactionsResult = await db.delete(debitOrderTransactions).where(eq(debitOrderTransactions.organizationId, id));
      console.log(`Deleted ${transactionsResult.rowCount || 0} debit order transactions for org ${id}`);
      
      // 2. Delete debit order mandates
      const mandatesResult = await db.delete(debitOrderMandates).where(eq(debitOrderMandates.organizationId, id));
      console.log(`Deleted ${mandatesResult.rowCount || 0} debit order mandates for org ${id}`);
      
      // 3. Delete message replies first, then messages
      const orgMessages = await db.select({ id: messages.id }).from(messages).where(eq(messages.recipientId, id));
      const messageIds = orgMessages.map(m => m.id);
      if (messageIds.length > 0) {
        const repliesResult = await db.delete(messageReplies).where(inArray(messageReplies.messageId, messageIds));
        console.log(`Deleted ${repliesResult.rowCount || 0} message replies for org ${id}`);
      }
      const messagesResult = await db.delete(messages).where(eq(messages.recipientId, id));
      console.log(`Deleted ${messagesResult.rowCount || 0} messages for org ${id}`);
      
      // 4. Delete attendance records first, then bookings for classes in this organization
      const orgClasses = await db.select({ id: classes.id }).from(classes).where(eq(classes.organizationId, id));
      const classIds = orgClasses.map(c => c.id);
      if (classIds.length > 0) {
        const attendanceResult = await db.delete(attendance).where(inArray(attendance.classId, classIds));
        console.log(`Deleted ${attendanceResult.rowCount || 0} attendance records for org ${id}`);
        const bookingsResult = await db.delete(bookings).where(inArray(bookings.classId, classIds));
        console.log(`Deleted ${bookingsResult.rowCount || 0} bookings for org ${id}`);
      }
      
      // 5. Delete payments related to this organization
      const paymentsResult = await db.delete(payments).where(eq(payments.organizationId, id));
      console.log(`Deleted ${paymentsResult.rowCount || 0} payments for org ${id}`);
      
      // 6. Delete memberships
      const membershipsResult = await db.delete(memberships).where(eq(memberships.organizationId, id));
      console.log(`Deleted ${membershipsResult.rowCount || 0} memberships for org ${id}`);
      
      // 7. Delete coach availability and coach invitations
      const orgCoaches = await db.select({ id: coaches.id }).from(coaches).where(eq(coaches.organizationId, id));
      const coachIds = orgCoaches.map(c => c.id);
      if (coachIds.length > 0) {
        const availabilityResult = await db.delete(coachAvailability).where(inArray(coachAvailability.coachId, coachIds));
        console.log(`Deleted ${availabilityResult.rowCount || 0} coach availability records for org ${id}`);
        const invitationsResult = await db.delete(coachInvitations).where(inArray(coachInvitations.coachId, coachIds));
        console.log(`Deleted ${invitationsResult.rowCount || 0} coach invitations for org ${id}`);
      }
      
      // 8. Delete coaches
      const coachesResult = await db.delete(coaches).where(eq(coaches.organizationId, id));
      console.log(`Deleted ${coachesResult.rowCount || 0} coaches for org ${id}`);
      
      // 9. Delete daily schedules
      const schedulesResult = await db.delete(dailySchedules).where(eq(dailySchedules.organizationId, id));
      console.log(`Deleted ${schedulesResult.rowCount || 0} daily schedules for org ${id}`);
      
      // 10. Delete classes
      const classesResult = await db.delete(classes).where(eq(classes.organizationId, id));
      console.log(`Deleted ${classesResult.rowCount || 0} classes for org ${id}`);
      
      // 11. Delete user organization relationships
      const userOrgsResult = await db.delete(userOrganizations).where(eq(userOrganizations.organizationId, id));
      console.log(`Deleted ${userOrgsResult.rowCount || 0} user organization relationships for org ${id}`);
      
      // 12. Finally delete the organization itself
      const orgResult = await db.delete(organizations).where(eq(organizations.id, id));
      console.log(`Deleted organization ${id}, rows affected: ${orgResult.rowCount || 0}`);
      
      if ((orgResult.rowCount || 0) === 0) {
        throw new Error(`No organization found with ID ${id} to delete`);
      }
      
      console.log(`Successfully completed hard deletion of organization ID: ${id}`);
    } catch (error) {
      console.error(`Error during organization deletion for ID ${id}:`, error);
      throw error;
    }
  }

  // Global admin management
  async getGlobalAdmins(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'global_admin'));
  }

  // User management for global admin
  async getUserBookings(userId: number): Promise<any[]> {
    // First get the user to find their email
    const user = await this.getUserById(userId);
    if (!user) {
      return [];
    }

    // Then get bookings by email since bookings table uses participantEmail
    const result = await db.select({
      id: bookings.id,
      classId: bookings.classId,
      participantName: bookings.participantName,
      participantEmail: bookings.participantEmail,
      bookingDate: bookings.bookingDate,
      paymentStatus: bookings.paymentStatus,
      className: classes.name,
      organizationName: organizations.name
    })
    .from(bookings)
    .leftJoin(classes, eq(bookings.classId, classes.id))
    .leftJoin(organizations, eq(classes.organizationId, organizations.id))
    .where(eq(bookings.participantEmail, user.email))
    .orderBy(desc(bookings.bookingDate));
    
    return result;
  }

  async cleanupOrphanedUsers(): Promise<{ deletedCount: number; deletedUsers: string[] }> {
    // Find users that are not global admins and not associated with any organization
    const orphanedUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role
    })
    .from(users)
    .leftJoin(userOrganizations, eq(users.id, userOrganizations.userId))
    .where(
      and(
        isNull(userOrganizations.userId), // Not in any organization
        ne(users.role, 'global_admin') // Not a global admin
      )
    );

    console.log(`Found ${orphanedUsers.length} orphaned users:`, orphanedUsers.map(u => u.email));

    const deletedUsers: string[] = [];
    let deletedCount = 0;

    for (const user of orphanedUsers) {
      try {
        // Delete user's bookings by email (since bookings table uses participantEmail)
        await db.delete(bookings).where(eq(bookings.participantEmail, user.email));
        
        // Delete user's coach records (if any)
        await db.delete(coaches).where(eq(coaches.userId, user.id));
        
        // Delete user's attendance records as coach (if any)
        await db.delete(attendance).where(eq(attendance.markedBy, user.id));
        
        // Delete user's attendance records as participant by email (if any)
        await db.delete(attendance).where(eq(attendance.participantEmail, user.email));
        
        // Delete user's memberships (if any)
        await db.delete(memberships).where(eq(memberships.userId, user.id));
        
        // Delete user's debit order mandates (if any)
        await db.delete(debitOrderMandates).where(eq(debitOrderMandates.userId, user.id));
        
        // Delete user's messages (if any)
        await db.delete(messages).where(eq(messages.senderId, user.id));
        await db.delete(messageReplies).where(eq(messageReplies.senderId, user.id));
        
        // Delete user's user achievements (if any)
        await db.delete(userAchievements).where(eq(userAchievements.userId, user.id));
        
        // Delete user's user stats (if any)
        await db.delete(userStats).where(eq(userStats.userId, user.id));
        
        // Delete user's children (if any)
        await db.delete(children).where(eq(children.parentId, user.id));
        
        // Delete the user
        await db.delete(users).where(eq(users.id, user.id));
        
        deletedUsers.push(user.email);
        deletedCount++;
        
        console.log(`Deleted orphaned user: ${user.email} (ID: ${user.id})`);
      } catch (error) {
        console.error(`Failed to delete orphaned user ${user.email}:`, error);
      }
    }

    return { deletedCount, deletedUsers };
  }

  // Global settings management
  async getGlobalSettings(): Promise<any> {
    try {
      // Try to get PayFast settings from global_settings table
      const result = await db.execute(sql`
        SELECT value FROM global_settings WHERE key = 'payfast'
      `);
      
      if (result.rows.length > 0) {
        return { payfast: result.rows[0].value };
      }
      
      // Fallback to empty settings
      return { payfast: { merchantId: '', merchantKey: '', passphrase: '', sandbox: true } };
    } catch (error) {
      console.error('Error fetching global settings:', error);
      return { payfast: { merchantId: '', merchantKey: '', passphrase: '', sandbox: true } };
    }
  }

  async saveGlobalPayfastSettings(settings: any): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO global_settings (key, value, updated_at)
        VALUES ('payfast', ${JSON.stringify(settings)}, CURRENT_TIMESTAMP)
        ON CONFLICT (key)
        DO UPDATE SET 
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP
      `);
    } catch (error) {
      console.error('Error saving global PayFast settings:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
