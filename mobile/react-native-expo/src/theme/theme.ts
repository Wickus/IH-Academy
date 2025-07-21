import { MD3LightTheme } from 'react-native-paper';

// IH Academy Brand Colors
const brandColors = {
  primary: '#20366B',      // Navy Blue
  secondary: '#278DD4',    // Sky Blue
  accent: '#24D367',       // Green
  background: '#F5F7FA',   // Light Blue-Gray
  surface: '#FFFFFF',      // White
  error: '#DC3232',        // Red
  warning: '#FFA500',      // Orange
  success: '#24D367',      // Green (same as accent)
  
  // Text Colors
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onBackground: '#202020',
  onSurface: '#202020',
  onError: '#FFFFFF',
  
  // Supporting Colors
  outline: '#E5EAEF',
  outlineVariant: '#6F757C',
  surfaceVariant: '#F5F7FA',
  onSurfaceVariant: '#6F757C',
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...brandColors,
    primary: brandColors.primary,
    onPrimary: brandColors.onPrimary,
    primaryContainer: brandColors.secondary,
    onPrimaryContainer: brandColors.onPrimary,
    secondary: brandColors.secondary,
    onSecondary: brandColors.onSecondary,
    secondaryContainer: `${brandColors.secondary}20`,
    onSecondaryContainer: brandColors.secondary,
    tertiary: brandColors.accent,
    onTertiary: brandColors.onPrimary,
    tertiaryContainer: `${brandColors.accent}20`,
    onTertiaryContainer: brandColors.accent,
    error: brandColors.error,
    onError: brandColors.onError,
    errorContainer: `${brandColors.error}20`,
    onErrorContainer: brandColors.error,
    background: brandColors.background,
    onBackground: brandColors.onBackground,
    surface: brandColors.surface,
    onSurface: brandColors.onSurface,
    surfaceVariant: brandColors.surfaceVariant,
    onSurfaceVariant: brandColors.onSurfaceVariant,
    outline: brandColors.outline,
    outlineVariant: brandColors.outlineVariant,
    scrim: '#000000',
    inverseSurface: brandColors.primary,
    inverseOnSurface: brandColors.onPrimary,
    inversePrimary: brandColors.accent,
    elevation: {
      level0: 'transparent',
      level1: brandColors.surface,
      level2: '#F8F9FA',
      level3: '#F1F3F4',
      level4: '#F0F2F3',
      level5: '#ECEEF0',
    },
  },
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: {
      ...MD3LightTheme.fonts.displayLarge,
      fontWeight: '700',
    },
    displayMedium: {
      ...MD3LightTheme.fonts.displayMedium,
      fontWeight: '600',
    },
    headlineLarge: {
      ...MD3LightTheme.fonts.headlineLarge,
      fontWeight: '600',
    },
    headlineMedium: {
      ...MD3LightTheme.fonts.headlineMedium,
      fontWeight: '600',
    },
    titleLarge: {
      ...MD3LightTheme.fonts.titleLarge,
      fontWeight: '600',
    },
    titleMedium: {
      ...MD3LightTheme.fonts.titleMedium,
      fontWeight: '500',
    },
    labelLarge: {
      ...MD3LightTheme.fonts.labelLarge,
      fontWeight: '500',
    },
  },
  roundness: 12,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const layout = {
  borderRadius: 12,
  cardBorderRadius: 16,
  buttonHeight: 50,
  headerHeight: 60,
  tabBarHeight: 70,
};

export type Theme = typeof theme;