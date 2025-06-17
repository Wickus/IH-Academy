# ItsHappening.Africa - Sports Academy Management System

## Overview

ItsHappening.Africa is a comprehensive sports academy management system built with a full-stack TypeScript architecture. The application enables sports organizations to manage classes, bookings, payments, memberships, and user interactions through a modern web interface with real-time capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query for server state management
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom brand theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Real-time**: WebSocket integration for live updates
- **File Handling**: Express static file serving

### Multi-tenant Architecture
- Organization-based multi-tenancy
- Role-based access control (global_admin, organization_admin, coach, member)
- Custom branding per organization (colors, logos)
- Isolated data per organization

## Key Components

### Database Schema (Drizzle ORM)
- **Users**: Authentication and profile management
- **Organizations**: Multi-tenant structure with custom branding
- **Classes**: Sports class scheduling and management
- **Bookings**: Class registration and attendance tracking
- **Payments**: Financial transaction handling
- **Memberships**: Subscription-based access control
- **Achievements**: Gamification system
- **Daily Schedules**: Recurring class templates

### Authentication & Authorization
- Session-based authentication with cookie management
- Role-based permissions system
- Organization membership validation
- Public access for booking and discovery

### Payment Integration
- PayFast payment gateway integration
- Support for both membership and pay-per-class models
- Sandbox and production environment handling
- Webhook processing for payment confirmations

### Real-time Features
- WebSocket connections for live updates
- Real-time class availability tracking
- Push notifications for mobile devices
- Live booking status updates

## Data Flow

### User Journey
1. **Discovery**: Public users browse organizations and classes
2. **Registration**: Users create accounts and optionally join organizations
3. **Booking**: Members book classes with payment processing
4. **Attendance**: Coaches mark attendance during classes
5. **Analytics**: Organization admins view reports and revenue data

### Admin Workflow
1. **Organization Setup**: Create organization with branding
2. **Class Management**: Schedule classes with coaches
3. **Member Management**: Handle registrations and memberships
4. **Revenue Tracking**: Monitor payments and analytics

### Real-time Data Synchronization
- Class availability updates broadcast to all subscribers
- Booking confirmations sent via WebSocket
- Attendance tracking with immediate UI updates
- Notification system for important events

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database queries and migrations
- **@tanstack/react-query**: Server state management
- **@stripe/stripe-js**: Payment processing (alternative to PayFast)
- **web-push**: Push notification service
- **nodemailer**: Email delivery system

### UI Dependencies
- **@radix-ui**: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-hook-form**: Form handling with validation
- **zod**: Runtime type validation

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling
- **vite**: Development server and build tool

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reload
- **Production**: Node.js server with static file serving
- **Database**: Neon PostgreSQL with connection pooling

### Build Process
1. Frontend: Vite builds React app to `dist/public`
2. Backend: esbuild bundles server code to `dist/index.js`
3. Database: Drizzle migrations applied on deployment

### Hosting Requirements
- Node.js 20+ runtime environment
- PostgreSQL database access
- Environment variables for API keys and database connection
- Static file serving capability

### Ports Configuration
- **Development**: Port 5000 (backend), Port 5001 (frontend)
- **Production**: Port 80 (external), internal routing handled by Express

## Changelog

Changelog:
- June 13, 2025. Initial setup
- June 13, 2025. Completed comprehensive dynamic branding implementation across all organization pages (Dashboard, Classes, Bookings, Coaches, Payments, Reports, Settings) - replaced all hardcoded ItsHappening.Africa colors with custom organization theme colors, including empty states, action buttons, form elements, and tab navigation with inline styling for Radix UI component overrides
- June 13, 2025. Implemented PayFast payment gateway integration for South African payment processing - added payment creation endpoints, webhook handling, notification processing, payment success/cancellation pages with proper routing, and organization-specific PayFast credentials storage with sandbox/production environment support
- June 13, 2025. Fixed PayFast settings save functionality in Global Admin Dashboard - implemented proper form validation, API integration, mutation handling, and dynamic connection status checking with real-time PayFast API testing capabilities
- June 13, 2025. Implemented editable pricing configuration in Global Admin Dashboard - added price input fields for membership plans (Free/Basic/Premium), commission fields for pay-per-class plans, database persistence via organization 20 as global settings storage, and API endpoints for loading/saving pricing configuration that organizations use during signup
- June 13, 2025. Resolved critical authentication UX issues - eliminated jarring login/logout experience by preloading organization data during authentication to prevent style flash, implementing consistent logout navigation with proper state reset, fixing routing conflicts that caused 404 errors, and ensuring smooth transitions between authenticated and unauthenticated states with professional user experience
- June 17, 2025. Completed comprehensive dashboard styling consistency - replaced all hardcoded yellow elements with dynamic organization colors, including upcoming class borders, pending status badges, Plan Usage slider backgrounds, and ensured all dashboard cards have consistent rounded corners with proper multi-tenant theming throughout the interface
- June 17, 2025. Resolved critical service worker navigation blocking issues - completely disabled problematic push notification service worker that was preventing app navigation on mobile devices, fixed coach editing form data prepopulation by improving data mapping and form reset timing, and corrected button text to show "Update Coach" instead of "Create Coach" when editing existing coaches
- June 17, 2025. Fixed critical class assignment bug where classes assigned to coaches were incorrectly moved to wrong organization - restored missing classes to proper organization, updated class form component to preserve organizationId during updates, and applied complete dynamic theming to Classes page with organization-specific colors for sport badges, action buttons, and all UI elements
- June 17, 2025. Enhanced coach availability page UX by replacing Edit button redirect with inline Edit Class Modal for streamlined workflow, and implemented comprehensive dynamic theming across ClassForm component - replaced all hardcoded ItsHappening.Africa colors with organization-specific branding including form labels, input focus states, select components, and submit buttons using primaryColor, secondaryColor, and accentColor values
- June 17, 2025. Fixed all dropdown menu highlighting in Edit Class Modal to use organization-specific color scheme - updated SelectItem hover states in sport selection, coach selection, and recurrence pattern dropdowns to use organization.secondaryColor instead of hardcoded gray colors, ensuring complete visual consistency with organization branding throughout the modal
- June 17, 2025. Built comprehensive Update Availability function with full dynamic theming - created AvailabilityForm component with day selection, availability toggle, working hours, break times, and notes fields, integrated form into coach availability page replacing placeholder modals, added backend API endpoints for POST/PUT coach availability operations, and applied complete organization-specific color scheme to all form elements including dropdown menus, input fields, checkboxes, and submit buttons
- June 17, 2025. Enhanced bookings page with dynamic organization theming and move booking functionality - applied organization-specific colors to Class column (sport badges), Status column (payment status badges), and Actions column (all action buttons), implemented comprehensive move booking feature for organization admins with modal interface, class filtering by same cost and future dates, backend API integration, and complete form validation ensuring seamless booking transfers between appropriate classes
- June 17, 2025. Fixed Move Booking modal styling inconsistencies - corrected yellow border to use organization's secondary color (#f97316), updated Cancel button from default yellow to organization's primary color (#ea580c) with proper hover effects, ensuring complete visual consistency with organization branding throughout the move booking workflow
- June 17, 2025. Improved Booked column time format in bookings table - removed seconds display from time ago function, now shows "Just now" for recent bookings (under 1 minute) and starts time display from minutes for cleaner, more professional booking timestamp presentation
- June 17, 2025. Enhanced Move Booking functionality with reason tracking and email notifications - added mandatory reason dropdown with three options (inappropriate class, make-up class, custom reason), implemented comprehensive email notification system that automatically sends professional emails to clients explaining the booking change with old/new class details and reason, integrated complete form validation requiring both class selection and reason before allowing booking moves
- June 17, 2025. Implemented comprehensive payment follow-up system for pending bookings - added payment reminder emails with PayFast payment buttons, booking cancellation for non-payment with automated email notifications, backend API endpoints for payment management, frontend action buttons for organization admins with tooltips and confirmation dialogs, professional email templates for payment reminders and cancellation notices using organization branding, complete integration with PayFast payment gateway for generating secure payment URLs

## User Preferences

Preferred communication style: Simple, everyday language.