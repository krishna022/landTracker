import { useTheme } from '../store/ThemeContext';

export const useThemedStyles = <T extends Record<string, any>>(
  stylesFunction: (theme: ReturnType<typeof useTheme>['state']['theme'], rtlStyles?: ReturnType<typeof useTheme>['state']['rtlStyles']) => T
): T => {
  try {
    const { state } = useTheme();
    return stylesFunction(state.theme, state.rtlStyles);
  } catch (error) {
    // Fallback to light theme if theme context is not available
    console.warn('Theme context not available, using fallback theme');
    const { lightTheme, getRTLStyles } = require('../utils/theme');
    const fallbackRTLStyles = getRTLStyles(false);
    return stylesFunction(lightTheme, fallbackRTLStyles);
  }
};
