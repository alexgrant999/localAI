






import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Conversation, Message, Campaign, IntegrationSettings, AiSettings, User } from '../types';
import { useInterval } from '../utils';

export const useDashboardData = (user: User) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'live' | 'disconnected'>('connecting');
  const [lastSynced, setLastSynced] = useState<string>('');
  const [newIncomingMessageId, setNewIncomingMessageId] = useState<string | null>(null);

  const [integration, setIntegration] = useState<IntegrationSettings>({
    provider: 'twilio',
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    metaPageId: '',
    metaInstagramId: '',
    metaAccessToken: '',
    whatsappPhoneId: '',
    notificationPhone: '',
    voiceEnabled: true,
    voiceId: 'Polly.Joanna',
    voiceGreeting: 'Thanks for calling. How can I help you today?',
    autoPilotEnabled: false
  });

  const [aiSettings, setAiSettings] = useState<AiSettings>({
    websiteUrl: '',
    businessGoal: 'Book more appointments',
    aiContext: '',
    aiApiKey: ''
  });

  // Sync Ref
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);

    const { data: convs, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (convError?.code === '42P01') setShowSqlModal(true);

    if (!silent) {
      const { data: camps, error: campError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (campError?.code === '42P01') setShowSqlModal(true);

      if (camps) {
        setCampaigns(camps.map((c: any) => ({
          id: c.id,
          name: c.name,
          message: c.message,
          status: c.status,
          audience: c.audience,
          sentAt: c.sent_at ? new Date(c.sent_at).toLocaleDateString() : 'Scheduled',
          stats: c.stats_delivered ? { delivered: c.stats_delivered, replied: c.stats_replied } : { delivered: 0, replied: 0 }
        })));
      }

      const { data: ints, error: intError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (intError?.code === '42P01') setShowSqlModal(true);

      if (ints) {
        setIntegration({
          id: ints.id,
          provider: 'twilio',
          accountSid: ints.account_sid || '',
          authToken: ints.auth_token || '',
          phoneNumber: ints.phone_number || '',
          metaPageId: ints.meta_page_id || '',
          metaInstagramId: ints.meta_instagram_id || '',
          metaAccessToken: ints.meta_access_token || '',
          whatsappPhoneId: ints.whatsapp_phone_id || '',
          notificationPhone: ints.notification_phone || '',
          voiceEnabled: ints.voice_enabled ?? true,
          voiceId: ints.voice_id || 'Polly.Joanna',
          voiceGreeting: ints.voice_greeting || 'Thanks for calling. How can I help you today?',
          autoPilotEnabled: ints.auto_pilot_enabled ?? false
        });
        setAiSettings({
          websiteUrl: ints.website_url || '',
          businessGoal: ints.business_goal || 'Book more appointments',
          aiContext: ints.ai_context || '',
          aiApiKey: ints.ai_api_key || ''
        });
      }
    }

    if (!convError && convs) {
      const formattedConvs: Conversation[] = convs.map((c: any) => ({
        id: c.id,
        clientName: c.client_name,
        lastMessage: c.last_message,
        time: new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: c.status,
        messages: [],
        phone: c.phone,
        tags: c.tags || [],
        channel: c.channel || 'sms'
      }));

      setConversations(formattedConvs);
      setLastSynced(new Date().toLocaleTimeString());

      if (!selectedConversationId && formattedConvs.length > 0 && !silent) {
        setSelectedConversationId(formattedConvs[0].id);
      }
    }

    if (!silent) setIsLoading(false);
  }, [user.id, selectedConversationId]);

  const fetchMessagesById = useCallback(async (idToFetch: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', idToFetch)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const formattedMsgs = data.map((m: any) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setMessages(formattedMsgs);
    }
  }, []);

  // Polling
  useInterval(() => {
    fetchData(true);
    if (selectedConversationIdRef.current) {
      fetchMessagesById(selectedConversationIdRef.current);
    }
  }, 3000);

  // Realtime
  useEffect(() => {
    setRealtimeStatus('connecting');
    const channel = supabase
      .channel('global_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
        setRealtimeStatus('live');
        fetchData(true);
        const updatedRecord = payload.new as any;
        if (updatedRecord && updatedRecord.id === selectedConversationIdRef.current) {
          fetchMessagesById(updatedRecord.id);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setRealtimeStatus('live');
        const newMsg = payload.new as any;
        if (newMsg && newMsg.conversation_id === selectedConversationIdRef.current) {
          fetchMessagesById(newMsg.conversation_id);
        }
        setNewIncomingMessageId(newMsg.id); // Triggers toast in UI
        fetchData(true);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('live');
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setRealtimeStatus('disconnected');
      });

    return () => { supabase.removeChannel(channel); };
  }, [fetchData, fetchMessagesById]);

  // Load messages on select
  useEffect(() => {
    if (selectedConversationId) {
      setIsMessagesLoading(true);
      setMessages([]);
      fetchMessagesById(selectedConversationId).then(() => {
        setIsMessagesLoading(false);
      });
    }
  }, [selectedConversationId, fetchMessagesById]);

  return {
    conversations,
    setConversations,
    messages,
    setMessages,
    selectedConversationId,
    setSelectedConversationId,
    selectedConversationIdRef,
    campaigns,
    setCampaigns,
    isLoading,
    isMessagesLoading,
    integration,
    setIntegration,
    aiSettings,
    setAiSettings,
    showSqlModal,
    setShowSqlModal,
    realtimeStatus,
    lastSynced,
    fetchData,
    fetchMessagesById,
    newIncomingMessageId
  };
};