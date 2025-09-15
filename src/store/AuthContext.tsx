import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens } from '../types';
import { apiService } from '../services/api';
import { tokenManager } from '../services/api';

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
  requiresEmailVerification: boolean;
  emailVerificationEmail: string | null;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<{ user: User; tokens: AuthTokens } | null>;
  register: (userData: RegisterData) => Promise<{ user: User }>;
  verifyEmail: (email: string, code: string) => Promise<{ user: User; tokens: AuthTokens }>;
  setupPin: (pin: string, biometricEnabled?: boolean) => Promise<{ user: User }>;
  validatePin: (pin: string) => Promise<{ user: User }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasExistingSession: () => Promise<boolean>;
  completeAuthentication: () => Promise<void>;
  user: User | null;
}

// Auth actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TOKENS'; payload: AuthTokens | null }
  | { type: 'LOGOUT' }
  | { type: 'SET_EMAIL_VERIFICATION'; payload: { required: boolean; email: string | null } };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  tokens: null,
  requiresEmailVerification: false,
  emailVerificationEmail: null,
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
    case 'SET_EMAIL_VERIFICATION':
      return { 
        ...state, 
        requiresEmailVerification: action.payload.required,
        emailVerificationEmail: action.payload.email,
        isLoading: false
      };
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
      
      // Initialize token manager with stored tokens
      await tokenManager.loadTokens();
      
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

// AuthContext.tsx - login function
const login = async (email: string, password: string) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    console.log('AuthContext login called with:', { email });
    
    const response = await apiService.auth.login({
      email,
      password,
    });
    
    console.log('AuthContext login response:', response);

    // Check if this is the email verification required case
    if (response?.requiresEmailVerification) {
      console.log('Email verification required in AuthContext');
      
      // Set the email verification state instead of throwing an error
      dispatch({ 
        type: 'SET_EMAIL_VERIFICATION', 
        payload: { required: true, email: email } 
      });
      
      // Return a resolved promise with null to indicate email verification needed
      return null;
    }

    // Normal success case - should have response.data
    if (response?.data) {
      const authData = response.data as { user: User; tokens: AuthTokens };
      
      console.log('Normal login success in AuthContext');

      // Store user data and tokens
      await AsyncStorage.setItem('auth_user', JSON.stringify(authData.user));
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(authData.tokens));
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return authData;
    }

    // If we get here, something unexpected happened
    throw new Error('Unexpected response from login API');

  } catch (error) {
    console.log('AuthContext login error:', error);
    dispatch({ type: 'SET_LOADING', payload: false });
    throw error;
  }
};

  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.auth.register(userData);
      const authData = response?.data as { user: User; tokens: AuthTokens };
      
      // Don't auto-login after registration, just return user data
      dispatch({ type: 'SET_LOADING', payload: false });
      return { user: authData.user };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout API if needed
      await apiService.auth.logout();
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
      const response = await apiService.auth.refreshToken();
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

  const verifyEmail = async (email: string, code: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.auth.verifyEmail(email, code);
      const authData = response as { user: User; tokens: AuthTokens };
      
      // After email verification, store tokens but don't complete auth yet
      await AsyncStorage.setItem('auth_user', JSON.stringify(authData.user));
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(authData.tokens));
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return authData;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const setupPin = async (pin: string, biometricEnabled: boolean = false) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.auth.setupPin(pin, biometricEnabled);
      const userData = response as { user: User };
      
      // Update stored user data with PIN info
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData.user));
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return userData;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const validatePin = async (pin: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await apiService.auth.validatePin(pin);
      const userData = response as { user: User };
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return userData;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
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
    register,
    verifyEmail,
    setupPin,
    validatePin,
    logout,
    refreshToken,
    hasExistingSession,
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
