import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#20366B',
    secondary: '#278DD4',
    tertiary: '#24D367',
    surface: '#FFFFFF',
    background: '#F5F7FA',
    error: '#BA1A1A',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1A1C1E',
    onBackground: '#1A1C1E',
  },
  roundness: 8,
};