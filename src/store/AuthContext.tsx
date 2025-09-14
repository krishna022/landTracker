import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens } from '../types';
import { apiService } from '../services/api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phoneCode: string;
  phone: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokens: AuthTokens | null;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<{ user: User; tokens: AuthTokens }>;
  loginWithPin: (pin: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasExistingSession: () => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  completeAuthentication: () => Promise<void>;
  user: User | null;
}

// Auth actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TOKENS'; payload: AuthTokens | null }
  | { type: 'LOGOUT' };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  tokens: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload,
        isLoading: false 
      };
    case 'SET_TOKENS':
      return { ...state, tokens: action.payload };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already authenticated on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load tokens from storage
      const tokens = await AsyncStorage.getItem('auth_tokens');
      const userData = await AsyncStorage.getItem('auth_user');
      
      if (tokens && userData) {
        const parsedTokens = JSON.parse(tokens);
        const parsedUser = JSON.parse(userData);
        
        dispatch({ type: 'SET_TOKENS', payload: parsedTokens });
        dispatch({ type: 'SET_USER', payload: parsedUser });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.login({
        email,
        password,
      });
      
      const authData = response?.data as { user: User; tokens: AuthTokens };
      
      // Store user data and tokens but don't set as authenticated yet
      // Authentication will be completed after PIN setup or PIN validation
      await AsyncStorage.setItem('auth_user', JSON.stringify(authData.user));
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(authData.tokens));
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // Return the data so the navigation can decide what to do next
      return authData;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const loginWithPin = async (pin: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.pinLogin({
        pin,
      });
      
      const authData = response?.data as { user: User; tokens: AuthTokens };
      
      dispatch({ type: 'SET_USER', payload: authData.user });
      dispatch({ type: 'SET_TOKENS', payload: authData.tokens });
      
      await AsyncStorage.setItem('auth_user', JSON.stringify(authData.user));
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(authData.tokens));
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.register(userData);
      const authData = response?.data as { user: User; tokens: AuthTokens };
      
      dispatch({ type: 'SET_USER', payload: authData.user });
      dispatch({ type: 'SET_TOKENS', payload: authData.tokens });
      
      await AsyncStorage.setItem('auth_user', JSON.stringify(authData.user));
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(authData.tokens));
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout API if needed
      await apiService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage
      await AsyncStorage.removeItem('auth_user');
      await AsyncStorage.removeItem('auth_tokens');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshToken = async () => {
    try {
      const response = await apiService.refreshToken();
      const tokens = (response as any).data as AuthTokens;
      
      dispatch({ type: 'SET_TOKENS', payload: tokens });
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokens));
    } catch (error) {
      // Refresh failed, logout user
      await logout();
      throw error;
    }
  };

  const hasExistingSession = async (): Promise<boolean> => {
    try {
      const tokens = await AsyncStorage.getItem('auth_tokens');
      const userData = await AsyncStorage.getItem('auth_user');
      return !!(tokens && userData);
    } catch (error) {
      return false;
    }
  };

  const setupPin = async (pin: string): Promise<void> => {
    try {
      await AsyncStorage.setItem('user_pin', pin);
    } catch (error) {
      throw new Error('Failed to setup PIN');
    }
  };

  const completeAuthentication = async (): Promise<void> => {
    try {
      const userData = await AsyncStorage.getItem('auth_user');
      const tokens = await AsyncStorage.getItem('auth_tokens');
      
      if (userData && tokens) {
        const user = JSON.parse(userData);
        const authTokens = JSON.parse(tokens);
        
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_TOKENS', payload: authTokens });
      }
    } catch (error) {
      throw new Error('Failed to complete authentication');
    }
  };

  const value: AuthContextType = {
    state,
    login,
    loginWithPin,
    register,
    logout,
    refreshToken,
    hasExistingSession,
    setupPin,
    completeAuthentication,
    user: state.user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
