import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../utils/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  theme: typeof lightTheme;
}

interface ThemeContextType {
  state: ThemeState;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

type ThemeAction =
  | { type: 'SET_MODE'; payload: ThemeMode; systemIsDark?: boolean }
  | { type: 'SET_THEME'; payload: { isDark: boolean; theme: typeof lightTheme } };

const initialState: ThemeState = {
  mode: 'system',
  isDark: false,
  theme: lightTheme,
};

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'SET_MODE':
      const systemIsDark = action.systemIsDark ?? false;
      const isDark = action.payload === 'system' ? systemIsDark : action.payload === 'dark';
      const theme = isDark ? darkTheme : lightTheme;

      return {
        ...state,
        mode: action.payload,
        isDark,
        theme,
      };
    case 'SET_THEME':
      return {
        ...state,
        isDark: action.payload.isDark,
        theme: action.payload.theme,
      };
    default:
      return state;
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);
  const systemColorScheme = useColorScheme();

  // Initialize theme based on system preference
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode') as ThemeMode;
        const mode = savedMode || 'system';
        dispatch({ type: 'SET_MODE', payload: mode, systemIsDark: systemColorScheme === 'dark' });
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Fallback to system theme if AsyncStorage fails
        dispatch({ type: 'SET_MODE', payload: 'system', systemIsDark: systemColorScheme === 'dark' });
      }
    };

    // Initialize immediately with system preference as fallback
    dispatch({ type: 'SET_MODE', payload: 'system', systemIsDark: systemColorScheme === 'dark' });
    initializeTheme();
  }, []);

  // Update theme when system color scheme changes
  useEffect(() => {
    if (state.mode === 'system') {
      dispatch({ type: 'SET_MODE', payload: 'system', systemIsDark: systemColorScheme === 'dark' });
    }
  }, [systemColorScheme]);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      dispatch({ type: 'SET_MODE', payload: mode, systemIsDark: systemColorScheme === 'dark' });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode: ThemeMode = state.mode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    state,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a fallback context if ThemeProvider is not available
    console.warn('useTheme called outside of ThemeProvider, using fallback');
    return {
      state: initialState,
      setThemeMode: async () => {},
      toggleTheme: () => {},
    };
  }
  return context;
};
