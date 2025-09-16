export interface User {
  _id: string;
  id?: string; // alias for _id
  name: string;
  email: string;
  phone?: string;
  phoneCode?: string;
  avatar?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  preferredLanguage: string;
  timezone?: string;
  dateFormat?: string;
  pinHash?: string | null;
  pinEnabled?: boolean;
  hasPinSetup?: boolean;
  biometricEnabled: boolean;
  deviceId?: string;
  pushToken?: string;
  lastLogin?: Date;
  lastLoginAt?: Date;
  isActive?: boolean;
  role: 'user' | 'admin';
  permissions?: UserPermission[];
  preferences?: UserPreferences;
  subscription?: Subscription;
  profilePicture?: {
    filename?: string;
    url?: string;
    thumbUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPermission {
  resource: string;
  actions: string[];
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisible: boolean;
    contactInfoVisible: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    mapStyle: 'standard' | 'satellite' | 'hybrid' | 'terrain';
    units: 'metric' | 'imperial';
  };
}

export interface Property {
  _id: string;
  name: string;
  description?: string;
  propertyType: 'agricultural' | 'residential' | 'commercial' | 'industrial' | 'vacant' | 'other';
  status: 'verified' | 'pending' | 'disputed' | 'inactive';
  
  // Location
  location: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  address: {
    street?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    landmark?: string;
  };
  
  // Ownership
  owner: string | User;
  co_owners?: (string | User)[];
  
  // Basic Details
  area: {
    total: number;
    unit: 'sqft' | 'sqm' | 'acre' | 'hectare';
    cultivable?: number;
    builtup?: number;
  };
  boundaries: string[];
  surveyNumber?: string;
  registrationNumber?: string;
  
  // Valuation
  marketValue?: {
    amount: number;
    currency: string;
    assessedDate: Date;
    assessedBy?: string;
  };
  taxDetails?: {
    annualTax: number;
    lastPaidDate?: Date;
    taxId?: string;
  };
  
  // Documents
  documents: PropertyDocument[];
  
  // Additional Info
  features?: string[];
  restrictions?: string[];
  utilities?: {
    electricity: boolean;
    water: boolean;
    gas: boolean;
    internet: boolean;
    sewage: boolean;
  };
  
  // Collaboration
  access: PropertyAccess[];
  transferHistory: TransferRecord[];
  splitHistory: SplitRecord[];
  
  // AI & Analysis
  aiData?: AIData;
  
  // Metadata
  tags: string[];
  notes?: string;
  isActive: boolean;
  visibility: 'private' | 'public' | 'shared';
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyDocument {
  _id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  type: 'ownership' | 'survey' | 'tax' | 'mutation' | 'other';
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
}

export interface Neighbour {
  name: string;
  contact?: string;
  direction: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  notes?: string;
}

export interface PropertyAccess {
  user: string | User;
  role: 'owner' | 'editor' | 'viewer';
  grantedBy: string | User;
  grantedAt: Date;
}

export interface TransferRecord {
  fromUser: string | User;
  toUser: string | User;
  date: Date;
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  documents?: string[];
}

export interface SplitRecord {
  originalProperty: string | Property;
  createdProperties: string[] | Property[];
  splitDate: Date;
  splitBy: string | User;
  reason?: string;
}

export interface AIData {
  extractedText?: string;
  suggestedTags: string[];
  encroachmentAlerts: EncroachmentAlert[];
}

export interface EncroachmentAlert {
  date: Date;
  severity: 'low' | 'medium' | 'high';
  description: string;
  satelliteImageUrl?: string;
}

export interface Subscription {
  _id: string;
  user: string;
  plan: 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  autoRenew: boolean;
  paymentMethod?: string;
  features: SubscriptionFeatures;
  transactions: Transaction[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isCurrentlyActive?: boolean;
  daysRemaining?: number;
}

export interface SubscriptionFeatures {
  maxProperties: number; // -1 for unlimited
  aiFeatures: boolean;
  advancedAnalytics: boolean;
  priority_support: boolean;
}

export interface Transaction {
  transactionId: string;
  amount: number;
  currency: string;
  date: Date;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  gatewayResponse?: any;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
  features: SubscriptionFeatures & { storage: string };
  discount?: string;
  popular: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
  deviceInfo?: DeviceInfo;
}

export interface PinLoginCredentials {
  email: string;
  pin: string;
  deviceInfo?: DeviceInfo;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  pin: string;
  preferredLanguage?: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  biometricSupported?: boolean;
  pushToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Map types
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface PolygonCoordinate {
  latitude: number;
  longitude: number;
}

export interface MapPolygon {
  coordinates: PolygonCoordinate[];
  holes?: PolygonCoordinate[][];
}

// Filter types
export interface PropertyFilters {
  propertyType?: Property['propertyType'];
  status?: Property['status'];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  near?: string;
  maxDistance?: number;
}

export interface UserStats {
  properties: {
    total: number;
    owned: number;
    shared: number;
    totalArea: number;
    typeBreakdown: Record<string, number>;
  };
  subscription: {
    plan: string;
    status: string;
    daysRemaining: number | null;
    features: SubscriptionFeatures;
  } | null;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Permissions: undefined;
  EmailVerification: { email: string };
  PinAuth: undefined;
  PinSetup: { userData: { user: User; tokens: AuthTokens } };
  Dashboard: undefined;
  Properties: undefined;
  PropertyDetail: { propertyId: string; property?: Property };
  AddProperty: undefined;
  PropertyImage: { propertyId: string; property?: Property };
  PropertyMap: { propertyId: string; property?: Property };
  PropertyDocuments: { propertyId: string; property?: Property };
  PropertyNeighbors: { propertyId: string; property?: Property };
  Map: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Subscription: undefined;
  Analytics: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
};

export type AuthStackParamList = {
  Permissions: undefined;
  Login: undefined;
  Register: undefined;
  EmailVerification: { email: string };
  PinAuth: undefined;
  PinSetup: { userData: { user: User; tokens: AuthTokens } };
};
