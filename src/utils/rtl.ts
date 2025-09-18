import { I18nManager } from 'react-native';

// RTL language codes
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

/**
 * Check if a language code is RTL
 */
export const isRTLLanguage = (languageCode: string): boolean => {
  return RTL_LANGUAGES.includes(languageCode.toLowerCase());
};

/**
 * Force RTL layout for RTL languages
 */
export const forceRTL = (isRTL: boolean) => {
  if (isRTL !== I18nManager.isRTL) {
    I18nManager.forceRTL(isRTL);
    // Note: In a real app, you might need to restart the app or reload the component tree
    // for RTL changes to take full effect
  }
};

/**
 * Get the appropriate text alignment for the current layout direction
 */
export const getTextAlign = (languageCode: string): 'left' | 'right' | 'auto' => {
  return isRTLLanguage(languageCode) ? 'right' : 'left';
};

/**
 * Get the appropriate flex direction for the current layout direction
 */
export const getFlexDirection = (languageCode: string): 'row' | 'row-reverse' => {
  return isRTLLanguage(languageCode) ? 'row-reverse' : 'row';
};

/**
 * Get the appropriate margin/padding direction for RTL layouts
 */
export const getDirectionalStyle = (languageCode: string) => {
  const isRTL = isRTLLanguage(languageCode);
  return {
    marginStart: isRTL ? undefined : 0,
    marginEnd: isRTL ? 0 : undefined,
    paddingStart: isRTL ? undefined : 0,
    paddingEnd: isRTL ? 0 : undefined,
  };
};