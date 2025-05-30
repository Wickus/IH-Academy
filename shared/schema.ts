import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"), // admin, coach, participant
  academyId: integer("academy_id"),
});

export const academies = pgTable("academies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logo: text("logo"),
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
  specializations: text("specializations").array(),
  bio: text("bio"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  academyId: integer("academy_id").notNull(),
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
});

export const insertAcademySchema = createInsertSchema(academies).omit({
  id: true,
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

export type Academy = typeof academies.$inferSelect;
export type InsertAcademy = z.infer<typeof insertAcademySchema>;

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
