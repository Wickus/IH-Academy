import {DefaultTheme} from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#20366B', // IH Academy primary blue
    secondary: '#278DD4', // IH Academy secondary blue  
    accent: '#24D367', // IH Academy green
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1F2937',
    placeholder: '#9CA3AF',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    onSurface: '#1F2937',
    disabled: '#D1D5DB',
    error: '#EF4444',
    notification: '#24D367',
  },
};