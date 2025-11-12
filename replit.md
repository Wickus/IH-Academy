# ItsHappening.Africa - Sports Academy Management System

## Overview

ItsHappening.Africa is a comprehensive sports academy management system designed to streamline management for sports organizations. Built with a full-stack TypeScript architecture, the platform enables efficient handling of classes, bookings, payments, and memberships through a modern web interface with real-time capabilities. The business vision is to provide a robust, multi-tenant solution with custom branding, offering a competitive edge in the sports academy market by improving operational efficiency and user engagement.

## User Preferences

Preferred communication style: Simple, everyday language.
Keep communications on-platform using in-app notifications instead of mailto for organization messaging.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Framework**: Shadcn/ui with Radix UI
- **Styling**: Tailwind CSS (custom brand theming)
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM (Neon serverless)
- **Real-time**: WebSocket integration
- **Multi-tenancy**: Organization-based with role-based access control (global_admin, organization_admin, coach, member) and isolated data.
- **UI/UX**: Dynamic, organization-specific branding (colors, logos) across all interfaces. Professional email templates for notifications and invites. Responsive design for mobile and desktop.

### Core Features
- **Authentication & Authorization**: Session-based with cookie management, role-based permissions, organization membership validation.
- **Payment Integration**: PayFast gateway with support for memberships and pay-per-class, including debit order system for South African users.
- **Real-time Features**: Live updates for class availability, booking status, and push notifications (disabled due to mobile blocking issues).
- **Data Flow**: Manages user journeys from discovery to booking and attendance, and admin workflows from organization setup to revenue tracking.
- **Key Modules**: Users, Organizations, Classes, Bookings, Payments, Memberships, Achievements, Daily Schedules.
- **Mobile Application (Planned/Integrated)**: React Native (Android/iOS) with role-based interfaces, push notifications (disabled), offline capabilities, biometric authentication, and organization-specific theming.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe ORM
- **@tanstack/react-query**: Server state management
- **web-push**: Push notification service (functionality disabled)
- **nodemailer**: Email delivery system
- **PayFast**: Payment gateway for South African transactions
- **SendGrid**: Email notification system for global admins
- **@radix-ui**: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-hook-form**: Form handling
- **zod**: Runtime type validation
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling
- **vite**: Development server and build tool