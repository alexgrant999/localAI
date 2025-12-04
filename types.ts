

export type ViewState = 'landing' | 'dashboard' | 'login' | 'register';
export type DashboardTab = 'inbox' | 'analytics' | 'campaigns' | 'settings';
export type Channel = 'sms' | 'whatsapp' | 'facebook' | 'instagram' | 'voice';

export interface User {
  id: string;
  name: string;
  email: string;
  companyName: string;
  plan: 'starter' | 'pro' | 'premium';
}

export interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  clientName: string;
  lastMessage: string;
  time: string;
  status: 'new' | 'booked' | 'replied';
  messages: Message[];
  phone: string;
  tags: string[];
  channel: Channel;
}

export interface AnalyticsData {
  name: string;
  messages: number;
  bookings: number;
}

export interface Campaign {
  id: string;
  name: string;
  message: string;
  status: 'sent' | 'scheduled' | 'draft';
  audience: string;
  sentAt: string;
  stats: {
    delivered: number;
    replied: number;
  }
}

export interface IntegrationSettings {
  id?: string;
  provider: 'twilio'; // Keep primary provider as Twilio for now
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  
  // Meta / Omnichannel
  metaPageId: string;
  metaAccessToken: string;
  whatsappPhoneId: string;
  
  // Notification
  notificationPhone?: string;

  // Voice
  voiceEnabled?: boolean;
  voiceId?: string;
  voiceGreeting?: string;

  // Auto Pilot
  autoPilotEnabled?: boolean;
}

export interface AiSettings {
  websiteUrl: string;
  businessGoal: string;
  aiContext: string;
  aiApiKey: string;
}