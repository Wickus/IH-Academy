# IH Academy Mobile App

This is the React Native mobile application for IH Academy - Sports Academy Management Platform.

## Features

- **Multi-tenant Sports Academy Management**
- **Class Booking and Management**
- **User Profile Management**
- **Real-time Updates**
- **IH Academy 6 Whistle Branding**
- **South African Market Focus**

## Architecture

### Technology Stack
- **React Native 0.72.6** - Cross-platform mobile development
- **TypeScript** - Type safety and better development experience
- **React Navigation** - Navigation between screens
- **Android Target SDK 33** - Android 13 compatibility

### Key Components
- **LoginScreen** - User authentication
- **DashboardScreen** - Main dashboard with stats and quick actions
- **ClassesScreen** - Browse and book classes
- **BookingsScreen** - Manage bookings (upcoming/past)
- **ProfileScreen** - User profile management and settings

## Build Instructions

### Prerequisites
- Android SDK 33
- Node.js 18+
- React Native CLI

### Development Build
```bash
npm install
npm run android
```

### Production Build (AAB)
```bash
chmod +x build-aab.sh
./build-aab.sh
```

This will generate `ih-academy-production.aab` ready for Google Play Store submission.

## App Details

- **Package Name**: `africa.itshappening.ihacademy`
- **Version**: 1.0.0
- **Target SDK**: 33 (Android 13)
- **Min SDK**: 21 (Android 5.0)

## Branding

The app features the IH Academy 6 whistle logo design with:
- Primary Color: #20366B (Dark Blue)
- Secondary Color: #278DD4 (Light Blue)
- Accent Color: #24D367 (Green)

## Google Play Store Submission

The app is configured for Google Play Store with:
- All required permissions
- Proper app signing configuration
- Optimized AAB generation
- Professional app icons and branding
- Complete store listing assets