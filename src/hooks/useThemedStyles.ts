import { useTheme } from '../store/ThemeContext';

export const useThemedStyles = <T extends Record<string, any>>(
  stylesFunction: (theme: ReturnType<typeof useTheme>['state']['theme']) => T
): T => {
  try {
    const { state } = useTheme();
    return stylesFunction(state.theme);
  } catch (error) {
    // Fallback to light theme if theme context is not available
    console.warn('Theme context not available, using fallback theme');
    const { lightTheme } = require('../utils/theme');
    return stylesFunction(lightTheme);
  }
};
