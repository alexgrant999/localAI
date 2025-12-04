
import { PricingTier, Conversation, AnalyticsData, Campaign } from './types';

export const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Starter',
    price: 49,
    description: 'Perfect for solo practitioners',
    features: [
      '24/7 AI SMS responder',
      'Missed call → SMS handling',
      'Basic FAQ answering',
      'Up to 500 messages/mo',
      '1 staff inbox'
    ]
  },
  {
    name: 'Pro',
    price: 149,
    description: 'For growing clinics & studios',
    recommended: true,
    features: [
      'Everything in Starter',
      'Full AI Booking Assistant',
      'Bulk SMS campaigns',
      'Lead qualification',
      'Mini CRM + History',
      '3 staff inboxes',
      '3000 messages/mo'
    ]
  },
  {
    name: 'Premium',
    price: 299,
    description: 'For multi-location businesses',
    features: [
      'Everything in Pro',
      'Unlimited staff',
      'Priority routing',
      'Advanced AI memory & tone',
      'Multi-location support',
      'Monthly analytics reports'
    ]
  }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    clientName: 'Sarah Jenkins',
    phone: '+1 (555) 123-4567',
    lastMessage: 'Great, see you then!',
    time: '2m ago',
    status: 'booked',
    channel: 'sms',
    tags: ['New Client', 'Massage'],
    messages: [
      { id: 'm1', sender: 'user', text: 'Hi, do you have any openings for a massage this Friday?', timestamp: '10:30 AM' },
      { id: 'm2', sender: 'ai', text: 'Hi Sarah! I have a 2:00 PM and a 4:30 PM available with Dr. Smith this Friday. Do either of those work for you?', timestamp: '10:30 AM' },
      { id: 'm3', sender: 'user', text: '2:00 PM works perfect.', timestamp: '10:31 AM' },
      { id: 'm4', sender: 'ai', text: 'You are all set for a 60-min Deep Tissue Massage at 2:00 PM on Friday. I\'ve sent a calendar invite to your email.', timestamp: '10:31 AM' },
      { id: 'm5', sender: 'user', text: 'Great, see you then!', timestamp: '10:32 AM' }
    ]
  },
  {
    id: '2',
    clientName: 'Mike Ross',
    phone: '+1 (555) 987-6543',
    lastMessage: 'How much is a consultation?',
    time: '15m ago',
    status: 'new',
    channel: 'sms',
    tags: ['Price Shopper'],
    messages: [
      { id: 'm6', sender: 'system', text: 'Missed Call from Mike Ross', timestamp: '11:15 AM' },
      { id: 'm7', sender: 'ai', text: 'Sorry we missed your call! This is the automated assistant for Byron Acu. How can we help you today?', timestamp: '11:15 AM' },
      { id: 'm8', sender: 'user', text: 'How much is a consultation?', timestamp: '11:20 AM' }
    ]
  },
  {
    id: '3',
    clientName: 'Emma Stone',
    phone: '+1 (555) 333-2222',
    lastMessage: 'Can I reschedule?',
    time: '1h ago',
    status: 'replied',
    channel: 'whatsapp',
    tags: ['Existing Client'],
    messages: [
      { id: 'm9', sender: 'user', text: 'Hey, I can\'t make it today. Can I reschedule?', timestamp: '9:00 AM' },
      { id: 'm10', sender: 'ai', text: 'No problem, Emma. I see your appointment is for 3 PM today. Our cancellation policy requires 24h notice, but I can help you find a new time next week. Would Monday work?', timestamp: '9:01 AM' }
    ]
  }
];

export const MOCK_ANALYTICS: AnalyticsData[] = [
  { name: 'Mon', messages: 45, bookings: 12 },
  { name: 'Tue', messages: 52, bookings: 15 },
  { name: 'Wed', messages: 38, bookings: 8 },
  { name: 'Thu', messages: 65, bookings: 20 },
  { name: 'Fri', messages: 85, bookings: 25 },
  { name: 'Sat', messages: 40, bookings: 10 },
  { name: 'Sun', messages: 15, bookings: 2 },
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'Summer Promo',
    message: 'Hey {name}, summer is here! Get 20% off your next massage when you book this week.',
    status: 'sent',
    audience: 'All Clients',
    sentAt: '2 days ago',
    stats: { delivered: 450, replied: 42 }
  },
  {
    id: 'c2',
    name: 'Holiday Hours',
    message: 'Just a heads up! We will be closed for the 4th of July. Book your appointments early!',
    status: 'scheduled',
    audience: 'Active Clients',
    sentAt: 'Tomorrow, 9:00 AM',
    stats: { delivered: 120, replied: 0 }
  }
];
