import { useTheme } from '../store/ThemeContext';
import { useRTL } from '../store/RTLContext';
import { getRTLStyles } from '../utils/theme';

export const useThemedStyles = <T extends Record<string, any>>(
  stylesFunction: (theme: ReturnType<typeof useTheme>['state']['theme'], rtlStyles?: ReturnType<typeof getRTLStyles>) => T
): T => {
  try {
    const { state } = useTheme();
    const { isRTL } = useRTL();
    const rtlStyles = getRTLStyles(isRTL);
    return stylesFunction(state.theme, rtlStyles);
  } catch (error) {
    // Fallback to light theme if theme context is not available
    console.warn('Theme context not available, using fallback theme');
    const { lightTheme } = require('../utils/theme');
    const fallbackRTLStyles = getRTLStyles(false);
    return stylesFunction(lightTheme, fallbackRTLStyles);
  }
};
