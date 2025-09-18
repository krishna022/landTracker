import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Country {
  _id: string;
  id: number;
  name: string;
  code: string;
  flag?: string;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface UserPreferences {
  country: Country | null;
  language: Language;
  isInitialized: boolean;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  setCountry: (country: Country) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  initializePreferences: () => Promise<void>;
  clearPreferences: () => Promise<void>;
}

type PreferencesAction =
  | { type: 'SET_PREFERENCES'; payload: UserPreferences }
  | { type: 'SET_COUNTRY'; payload: Country }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_INITIALIZED'; payload: boolean };

const initialState: UserPreferences = {
  country: null,
  language: { code: 'en', name: 'English', nativeName: 'English' },
  isInitialized: false,
};

const preferencesReducer = (state: UserPreferences, action: PreferencesAction): UserPreferences => {
  switch (action.type) {
    case 'SET_PREFERENCES':
      return { ...action.payload };
    case 'SET_COUNTRY':
      return { ...state, country: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    default:
      return state;
  }
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(preferencesReducer, initialState);

  useEffect(() => {
    initializePreferences();
  }, []);

  const initializePreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_preferences');
      if (stored) {
        const preferences = JSON.parse(stored);
        dispatch({ type: 'SET_PREFERENCES', payload: { ...preferences, isInitialized: true } });
      } else {
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    }
  };

  const setCountry = async (country: Country) => {
    try {
      const newPreferences = { ...state, country };
      await AsyncStorage.setItem('user_preferences', JSON.stringify(newPreferences));
      dispatch({ type: 'SET_COUNTRY', payload: country });
    } catch (error) {
      console.error('Error saving country:', error);
      throw error;
    }
  };

  const setLanguage = async (language: Language) => {
    try {
      const currentPrefs = await AsyncStorage.getItem('user_preferences');
      const existingPrefs = currentPrefs ? JSON.parse(currentPrefs) : {};

      const newPreferences = {
        ...existingPrefs,
        language,
        timestamp: Date.now(),
        isInitialized: true,
      };

      console.log('Setting new language:', language);
      await AsyncStorage.setItem('user_preferences', JSON.stringify(newPreferences));

      // Update the state
      dispatch({ type: 'SET_LANGUAGE', payload: language });

      console.log('Language updated successfully');
    } catch (error) {
      console.error('Error saving language:', error);
      throw error;
    }
  };

  const clearPreferences = async () => {
    try {
      await AsyncStorage.removeItem('user_preferences');
      dispatch({ type: 'SET_PREFERENCES', payload: initialState });
    } catch (error) {
      console.error('Error clearing preferences:', error);
      throw error;
    }
  };

  const value: PreferencesContextType = {
    preferences: state,
    setCountry,
    setLanguage,
    initializePreferences,
    clearPreferences,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
