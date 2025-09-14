import axios, { AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthTokens, ApiResponse } from '../types';

// For now, we'll use a default API URL. In production, this should come from environment variables
// Use 10.0.2.2 for Android emulator to access localhost on host machine
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async loadTokens(): Promise<AuthTokens | null> {
    try {
      const tokens = await AsyncStorage.getItem('auth_tokens');
      if (tokens) {
        const parsedTokens = JSON.parse(tokens);
        this.accessToken = parsedTokens.accessToken;
        this.refreshToken = parsedTokens.refreshToken;
        return parsedTokens;
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
    return null;
  }

  async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  async clearTokens(): Promise<void> {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      await AsyncStorage.removeItem('auth_tokens');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }
}

const tokenManager = TokenManager.getInstance();

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken
          });
          
          const newTokens = response.data.data;
          await tokenManager.saveTokens(newTokens);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          await tokenManager.clearTokens();
          // Emit event for logout
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.success) {
    return response.data.data as T;
  } else {
    throw new Error(response.data.message || 'API request failed');
  }
};

// Helper function to handle API errors
const handleApiError = (error: any): never => {
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  } else if (error.message) {
    throw new Error(error.message);
  } else {
    throw new Error('Network error occurred');
  }
};

// API service class
class ApiService {
  // Initialize token manager
  async initialize() {
    await tokenManager.loadTokens();
  }

  // Auth endpoints
  async login(credentials: any) {
    try {
      const response = await api.post('/auth/login', credentials);
      const data = handleApiResponse(response) as any;
      // Backend returns accessToken and refreshToken directly in data, not in data.tokens
      const tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
      await tokenManager.saveTokens(tokens);
      return { data: { user: data.user, tokens } };
    } catch (error) {
      handleApiError(error);
    }
  }

  async pinLogin(credentials: any) {
    try {
      const response = await api.post('/auth/pin-login', credentials);
      const data = handleApiResponse(response) as any;
      // Backend returns accessToken and refreshToken directly in data, not in data.tokens
      const tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
      await tokenManager.saveTokens(tokens);
      return { data: { user: data.user, tokens } };
    } catch (error) {
      handleApiError(error);
    }
  }

  async register(userData: any) {
    try {
      const response = await api.post('/auth/register', userData);
      const data = handleApiResponse(response) as any;
      // Backend returns accessToken and refreshToken directly in data, not in data.tokens
      const tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
      await tokenManager.saveTokens(tokens);
      return { data: { user: data.user, tokens } };
    } catch (error) {
      handleApiError(error);
    }
  }

  async logout() {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      await tokenManager.clearTokens();
    }
  }

  async changePin(currentPin: string, newPin: string) {
    try {
      const response = await api.post('/auth/change-pin', {
        currentPin,
        newPin
      });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async refreshToken() {
    try {
      const currentRefreshToken = tokenManager.getRefreshToken();
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/auth/refresh-token', {
        refreshToken: currentRefreshToken
      });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  // User endpoints
  async getProfile() {
    try {
      const response = await api.get('/users/profile');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async updateProfile(data: any) {
    try {
      const response = await api.put('/users/profile', data);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async uploadProfilePicture(imageData: FormData) {
    try {
      const response = await api.post('/users/profile-picture', imageData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async searchUsers(query: string, limit: number = 10) {
    try {
      const response = await api.get('/users/search', {
        params: { query, limit }
      });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async getUserStats() {
    try {
      const response = await api.get('/users/stats');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  // Property endpoints
  async getProperties(filters: any = {}) {
    try {
      const response = await api.get('/properties', { params: filters });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async getProperty(id: string) {
    try {
      const response = await api.get(`/properties/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async createProperty(propertyData: any) {
    try {
      const response = await api.post('/properties', propertyData);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async updateProperty(id: string, propertyData: any) {
    try {
      const response = await api.put(`/properties/${id}`, propertyData);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async deleteProperty(id: string) {
    try {
      const response = await api.delete(`/properties/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async uploadPropertyPhotos(propertyId: string, photos: FormData) {
    try {
      const response = await api.post(`/properties/${propertyId}/photos`, photos, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async deletePropertyPhoto(propertyId: string, photoId: string) {
    try {
      const response = await api.delete(`/properties/${propertyId}/photos/${photoId}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async setMainPhoto(propertyId: string, photoId: string) {
    try {
      const response = await api.patch(`/properties/${propertyId}/photos/${photoId}/main`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async grantAccess(propertyId: string, userId: string, role: string) {
    try {
      const response = await api.post(`/properties/${propertyId}/access`, {
        userId,
        role
      });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async revokeAccess(propertyId: string, userId: string) {
    try {
      const response = await api.delete(`/properties/${propertyId}/access/${userId}`);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async findNearbyProperties(longitude: number, latitude: number, maxDistance: number = 1000) {
    try {
      const response = await api.get('/properties/nearby/search', {
        params: { longitude, latitude, maxDistance }
      });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async exportProperty(propertyId: string, format: string = 'geojson') {
    try {
      const response = await api.get(`/properties/${propertyId}/export`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }

  // Subscription endpoints
  async getCurrentSubscription() {
    try {
      const response = await api.get('/subscriptions/current');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async getPlans() {
    try {
      const response = await api.get('/subscriptions/plans');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async createPaymentOrder(planId: string) {
    try {
      const response = await api.post('/subscriptions/create-order', { planId });
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async verifyPayment(paymentData: any) {
    try {
      const response = await api.post('/subscriptions/verify-payment', paymentData);
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }

  async cancelSubscription() {
    try {
      const response = await api.post('/subscriptions/cancel');
      return handleApiResponse(response);
    } catch (error) {
      handleApiError(error);
    }
  }
}

export const apiService = new ApiService();
export { tokenManager };
export default api;

