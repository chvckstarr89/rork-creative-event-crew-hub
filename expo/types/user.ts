export type UserRole = 'photographer' | 'videographer' | 'client' | 'assistant' | 'director';

export type ServiceType = 'photography' | 'videography' | 'hybrid';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  serviceType: ServiceType;
  company?: string;
  bio?: string;
  portfolio?: string[];
  skills?: string[];
  location?: string;
  isOnline: boolean;
  lastSeen: Date;
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
  hasCheckedIn?: boolean;
  checkedInEventId?: string;
  hubspotContactId?: string;
  hubspotDealIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  name: string;
  role: UserRole;
  serviceType: ServiceType;
  company?: string;
  phone?: string;
  hubspotContactId?: string;
}

export interface HubSpotUserData {
  email: string;
  firstname: string;
  lastname: string;
  company?: string;
  phone?: string;
  jobtitle?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CheckInData {
  eventId: string;
  selfieUri: string;
  locationUri?: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}