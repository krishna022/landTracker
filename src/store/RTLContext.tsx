import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { usePreferences } from '../store/PreferencesContext';
import { isRTLLanguage, forceRTL } from '../utils/rtl';

interface RTLContextType {
  isRTL: boolean;
  languageCode: string;
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

export const RTLProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { preferences } = usePreferences();
  const isRTL = isRTLLanguage(preferences.language.code);

  useEffect(() => {
    // Force RTL layout when Arabic is selected
    forceRTL(isRTL);
  }, [isRTL]);

  const value: RTLContextType = {
    isRTL,
    languageCode: preferences.language.code,
  };

  return (
    <RTLContext.Provider value={value}>
      {children}
    </RTLContext.Provider>
  );
};

export const useRTL = (): RTLContextType => {
  const context = useContext(RTLContext);
  if (context === undefined) {
    throw new Error('useRTL must be used within an RTLProvider');
  }
  return context;
};