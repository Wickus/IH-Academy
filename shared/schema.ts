import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(), // Full name field
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  role: text("role", { enum: ["global_admin", "organization_admin", "coach", "member"] }).notNull().default("member"),
  organizationId: integer("organization_id"), // which organization they belong to
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organizations (renamed from academies for better multi-tenant support)
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  phone: text("phone"),
  email: text("email").notNull().unique(),
  website: text("website"),
  logo: text("logo"),
  // Custom theming
  primaryColor: text("primary_color").default("#20366B"),
  secondaryColor: text("secondary_color").default("#278DD4"),
  accentColor: text("accent_color").default("#24D367"),
  // Business model
  businessModel: text("business_model", { enum: ["membership", "pay_per_class"] }).notNull().default("pay_per_class"),
  // Membership settings (for membership model)
  membershipPrice: decimal("membership_price", { precision: 10, scale: 2 }).default("0.00"),
  membershipBillingCycle: text("membership_billing_cycle", { enum: ["monthly", "quarterly", "yearly"] }).default("monthly"),
  // Subscription/plan info
  planType: text("plan_type", { enum: ["free", "basic", "premium"] }).default("free"),
  maxClasses: integer("max_classes").default(10),
  maxMembers: integer("max_members").default(100),
  // Payment gateway credentials
  payfastMerchantId: text("payfast_merchant_id"),
  payfastMerchantKey: text("payfast_merchant_key"),
  payfastPassphrase: text("payfast_passphrase"),
  payfastSandbox: boolean("payfast_sandbox").default(true),
  // Status
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User-Organization relationships (for following organizations)
export const userOrganizations = pgTable("user_organizations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  organizationId: integer("organization_id").notNull(),
  role: text("role", { enum: ["member", "coach", "admin"] }).default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const sports = pgTable("sports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(), // hex color for UI
  icon: text("icon").notNull(), // fontawesome icon class
});

export const coaches = pgTable("coaches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  academyId: integer("academy_id").notNull(),
  organizationId: integer("organization_id"),
  specializations: text("specializations").array(),
  bio: text("bio"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  profilePicture: text("profile_picture"),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  sportId: integer("sport_id").notNull(),
  coachId: integer("coach_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  capacity: integer("capacity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: text("recurrence_pattern"), // weekly, daily, etc.
  location: text("location"),
  requirements: text("requirements"),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  participantName: text("participant_name").notNull(),
  participantEmail: text("participant_email").notNull(),
  participantPhone: text("participant_phone"),
  participantAge: integer("participant_age"),
  bookingDate: timestamp("booking_date").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, confirmed, failed, refunded
  paymentMethod: text("payment_method").default("payfast"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  payfastPaymentId: text("payfast_payment_id"),
  notes: text("notes"),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  status: text("status").notNull().default("pending"), // present, absent, pending
  markedAt: timestamp("marked_at"),
  markedBy: integer("marked_by"), // coach id
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("ZAR"),
  status: text("status").notNull().default("pending"),
  payfastPaymentId: text("payfast_payment_id"),
  payfastData: json("payfast_data"),
  processedAt: timestamp("processed_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserOrganizationSchema = createInsertSchema(userOrganizations).omit({
  id: true,
  joinedAt: true,
});

export const insertSportSchema = createInsertSchema(sports).omit({
  id: true,
});

export const insertCoachSchema = createInsertSchema(coaches).omit({
  id: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;

export type Sport = typeof sports.$inferSelect;
export type InsertSport = z.infer<typeof insertSportSchema>;

export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = z.infer<typeof insertCoachSchema>;

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Achievement definitions
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "booking", "attendance", "social", "milestone"
  icon: text("icon").notNull(),
  color: text("color").notNull().default("#20366B"),
  points: integer("points").notNull().default(10),
  threshold: integer("threshold").notNull().default(1), // Number needed to unlock
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User achievements (unlocked badges)
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  progress: integer("progress").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
});

// User stats for tracking achievements
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  totalBookings: integer("total_bookings").notNull().default(0),
  completedClasses: integer("completed_classes").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0), // Days in a row
  longestStreak: integer("longest_streak").notNull().default(0),
  organizationsFollowed: integer("organizations_followed").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Daily schedules for membership organizations
export const dailySchedules = pgTable("daily_schedules", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: text("start_time").notNull(), // Format: "09:00"
  endTime: text("end_time").notNull(), // Format: "10:00"
  className: text("class_name").notNull(),
  description: text("description"),
  sportId: integer("sport_id").references(() => sports.id),
  coachId: integer("coach_id").references(() => coaches.id),
  capacity: integer("capacity").notNull().default(20),
  location: text("location"),
  requirements: text("requirements"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);
export const insertUserStatsSchema = createInsertSchema(userStats);
export const insertDailyScheduleSchema = createInsertSchema(dailySchedules);

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type DailySchedule = typeof dailySchedules.$inferSelect;
export type InsertDailySchedule = z.infer<typeof insertDailyScheduleSchema>;

// Memberships for organizations using membership business model
export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  status: text("status", { enum: ["active", "expired", "cancelled", "pending"] }).notNull().default("pending"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingCycle: text("billing_cycle", { enum: ["monthly", "quarterly", "yearly"] }).notNull(),
  autoRenew: boolean("auto_renew").notNull().default(true),
  // Payment tracking
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  nextBillingDate: timestamp("next_billing_date"),
  lastPaymentDate: timestamp("last_payment_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Parent-Child relationships for family bookings
export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  dateOfBirth: date("date_of_birth"),
  medicalInfo: text("medical_info"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMembershipSchema = createInsertSchema(memberships);
export const insertChildSchema = createInsertSchema(children);

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;

// Relations
export const childrenRelations = relations(children, ({ one }) => ({
  parent: one(users, { fields: [children.parentId], references: [users.id] }),
}));

export const usersChildrenRelations = relations(users, ({ many }) => ({
  children: many(children),
}));

// Legacy types for backward compatibility (will be removed)
export type Academy = Organization;
export type InsertAcademy = InsertOrganization;
