import { DefaultTheme, MD3DarkTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

// Color palette
const colors = {
  primary: '#2E7D32',      // Green
  onPrimary: '#FFFFFF',
  primaryContainer: '#C8E6C9',
  onPrimaryContainer: '#1B5E20',
  secondary: '#FF8F00',    // Orange  
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FFE0B2',
  onSecondaryContainer: '#E65100',
  background: '#FAFAFA',
  onBackground: '#1C1C1C',
  surface: '#FFFFFF',
  onSurface: '#1C1C1C',
  surfaceVariant: '#F5F5F5',
  onSurfaceVariant: '#424242',
  error: '#B00020',
  onError: '#FFFFFF',
  errorContainer: '#FFEBEE',
  onErrorContainer: '#B00020',
  outline: '#BDBDBD',
  outlineVariant: '#E0E0E0',
  inverseSurface: '#2F2F2F',
  inverseOnSurface: '#F1F1F1',
  inversePrimary: '#4CAF50',
  shadow: '#000000',
  surfaceTint: '#2E7D32',
};

const darkColors = {
  primary: '#4CAF50',
  onPrimary: '#000000',
  primaryContainer: '#1B5E20',
  onPrimaryContainer: '#C8E6C9',
  secondary: '#FFB74D',
  onSecondary: '#000000',
  secondaryContainer: '#E65100',
  onSecondaryContainer: '#FFE0B2',
  background: '#0F0F0F',
  onBackground: '#E1E1E1',
  surface: '#1A1A1A',
  onSurface: '#E1E1E1',
  surfaceVariant: '#2A2A2A',
  onSurfaceVariant: '#C7C7C7',
  error: '#FF6B6B',
  onError: '#000000',
  errorContainer: '#B71C1C',
  onErrorContainer: '#FFCCCB',
  outline: '#757575',
  outlineVariant: '#424242',
  inverseSurface: '#E1E1E1',
  inverseOnSurface: '#2F2F2F',
  inversePrimary: '#2E7D32',
  shadow: '#000000',
  surfaceTint: '#4CAF50',
};

export const lightTheme = {
  ...DefaultTheme,
  ...NavigationDefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...NavigationDefaultTheme.colors,
    ...colors,
  },
  roundness: 8,
};

export const darkTheme = {
  ...MD3DarkTheme,
  ...NavigationDarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...NavigationDarkTheme.colors,
    ...darkColors,
  },
  roundness: 8,
};

// Common styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  padding: {
    padding: 16,
  },
  margin: {
    margin: 16,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  card: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: 8,
    padding: 16,
    margin: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
};

// Export default theme for backward compatibility
export const theme = lightTheme;
