# IH Academy Mobile App

React Native mobile application for iOS and Android platforms providing sports academy management capabilities for Organization Admins, Coaches, and Members.

## Project Structure

```
mobile/
├── src/
│   ├── components/         # Reusable UI components
│   ├── navigation/         # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   ├── MemberTabNavigator.tsx
│   │   ├── CoachTabNavigator.tsx
│   │   └── AdminTabNavigator.tsx
│   ├── screens/           # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── member/        # Member interface screens
│   │   ├── coach/         # Coach interface screens
│   │   ├── admin/         # Admin interface screens
│   │   └── shared/        # Shared screens
│   ├── services/          # API and external services
│   │   └── api.ts         # API client with token management
│   ├── store/             # Redux store configuration
│   │   ├── index.ts       # Store setup
│   │   └── authSlice.ts   # Authentication state management
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions and helpers
│   └── App.tsx            # Main application component
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── babel.config.js        # Babel configuration
└── README.md             # This file
```

## Features

### Authentication
- ✅ Login/Register screens
- ✅ Token-based authentication with refresh
- ✅ Biometric authentication support (planned)
- ✅ Session persistence with AsyncStorage

### Navigation
- ✅ Role-based navigation (Member, Coach, Admin)
- ✅ Organization selection flow
- ✅ Tab-based navigation for each role
- ✅ Deep linking support (planned)

### State Management
- ✅ Redux Toolkit for global state
- ✅ Async storage for persistence
- ✅ API integration with caching
- ✅ Error handling and loading states

### API Integration
- ✅ Shared API client with web application
- ✅ Automatic token refresh
- ✅ Offline capability (planned)
- ✅ Real-time updates via WebSocket (planned)

## Technology Stack

- **React Native 0.72.6**
- **TypeScript 4.8.4**
- **Redux Toolkit** - State management
- **React Navigation 6** - Navigation
- **React Native Paper** - UI components
- **AsyncStorage** - Local data persistence
- **Axios** - HTTP client

## Development Setup

### Prerequisites
- Node.js 16+
- React Native CLI
- iOS: Xcode 14+ and iOS Simulator
- Android: Android Studio and Android SDK

### Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. iOS setup:
```bash
cd ios && pod install && cd ..
```

3. Start Metro bundler:
```bash
npm start
```

4. Run on iOS:
```bash
npm run ios
```

5. Run on Android:
```bash
npm run android
```

## API Configuration

The app connects to the existing web API:
- **Development**: `http://localhost:5000/api`
- **Production**: `https://academy.itshappening.africa/api`

## Build for Production

### iOS
1. Open `ios/IHAcademyMobile.xcworkspace` in Xcode
2. Select your device/simulator
3. Build and archive for App Store

### Android
1. Generate release APK:
```bash
npm run build:android
```

2. Generate AAB for Play Store:
```bash
npm run build:android:bundle
```

## App Store Deployment

### iOS App Store
- Apple Developer Account required
- App Store Connect configuration
- Privacy policy and app review

### Google Play Store
- Google Play Console account
- App signing and security
- Store listing and metadata

## Shared Code with Web App

The mobile app shares:
- **TypeScript types** from `../shared/schema.ts`
- **API client logic** (adapted for React Native)
- **Business logic** and validation
- **Data models** and interfaces

## Next Development Phases

### Phase 1: Core Foundation ✅
- Authentication system
- Basic navigation structure
- API integration layer
- User profile management

### Phase 2: Member Features ✅
- Class discovery and booking with search/filter
- Comprehensive booking management
- Organization management and messaging
- Profile management with settings
- Multi-organization support

### Phase 3: Coach Features ✅
- Comprehensive coach dashboard with class overview
- Schedule management with attendance tracking
- Availability settings with weekly configuration
- Coach profile management with qualifications
- Real-time attendance marking system

### Phase 4: Admin Features ✅
- Complete organization dashboard with real-time analytics
- Comprehensive member management with invitation system
- Advanced coach management with status controls
- Detailed analytics and reporting with export capabilities
- Multi-period reporting with revenue and performance metrics

### Phase 5: Advanced Features ✅
- Comprehensive push notification system with Firebase integration
- Advanced offline capabilities with intelligent caching and sync queue
- Biometric authentication for login and payments (Touch ID/Face ID)
- Enhanced security settings with session management
- Notification preferences with granular controls
- Offline data synchronization with conflict resolution
- Camera integration

### Phase 6: Production (Planned)
- App store deployment
- Performance optimization
- Testing and QA

## Contributing

1. Follow TypeScript best practices
2. Use React Native Paper components
3. Maintain shared API client compatibility
4. Test on both iOS and Android
5. Follow the existing navigation patterns

## Support

For technical support or questions about the mobile app development, refer to the main project documentation or contact the development team.