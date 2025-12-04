import React, { useState, useRef, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { DashboardTab, User as UserType, Message } from '../types';
import { supabase, SUPABASE_URL } from '../supabaseClient';
import { getErrorMessage } from '../utils';
import { useDashboardData } from '../hooks/useDashboardData';

// Sub-components
import Sidebar from './dashboard/Sidebar';
import InboxView from './dashboard/InboxView';
import CampaignsView from './dashboard/CampaignsView';
import AnalyticsView from './dashboard/AnalyticsView';
import SettingsView from './dashboard/SettingsView';
import ToastContainer, { Toast } from './dashboard/ToastContainer';
import SqlModal from './dashboard/SqlModal';
import CampaignModal from './dashboard/CampaignModal';
import NewConversationModal from './dashboard/NewConversationModal';
import DeleteModal from './dashboard/DeleteModal';

interface DashboardProps {
  onLogout: () => void;
  user: UserType;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('inbox');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  // UI States
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isTrainingAi, setIsTrainingAi] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Modals
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isNewConvModalOpen, setIsNewConvModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id: string | null; name: string }>({ isOpen: false, id: null, name: '' });
  
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: '', audience: 'All Clients', message: '' });

  // Phone Editing
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Custom Hook for Data Logic
  const {
    conversations, setConversations,
    messages, setMessages,
    selectedConversationId, setSelectedConversationId, selectedConversationIdRef,
    campaigns, setCampaigns,
    isMessagesLoading,
    integration, setIntegration,
    aiSettings, setAiSettings,
    showSqlModal, setShowSqlModal,
    realtimeStatus, lastSynced,
    fetchData, fetchMessagesById, newIncomingMessageId
  } = useDashboardData(user);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Toast Helper
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // Listen for new messages just for Toast notifications (Auto-Pilot is now Server-Side)
  useEffect(() => {
    if (newIncomingMessageId && !processedMessageIdsRef.current.has(newIncomingMessageId)) {
        processedMessageIdsRef.current.add(newIncomingMessageId);
        
        const checkMessage = async () => {
             const { data: msg } = await supabase
                 .from('messages')
                 .select('sender, conversation_id')
                 .eq('id', newIncomingMessageId)
                 .single();
             
             if (msg && msg.sender === 'user') {
                 addToast('info', 'New message received');
                 if (integration.autoPilotEnabled) {
                     addToast('info', 'Server Auto-Pilot is responding in background...');
                 }
             }
        };
        checkMessage();
    }
  }, [newIncomingMessageId, integration.autoPilotEnabled]);

  // Initial Fetch on Mount
  useEffect(() => {
    fetchData();
    const onFocus = () => fetchData(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchData]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 150);
  };

  // --- ACTIONS ---

  const handleTestIncomingSMS = async () => {
    if (!integration.phoneNumber) {
      addToast('error', 'Please save a phone number in settings first');
      return;
    }
    const fakeFrom = '+15550009999';
    const fakeBody = `Test message at ${new Date().toLocaleTimeString()}`;
    addToast('info', 'Sending test webhook...');
    try {
      const formData = new FormData();
      formData.append('From', fakeFrom);
      formData.append('To', integration.phoneNumber); 
      formData.append('Body', fakeBody);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/incoming-sms`, { method: 'POST', body: formData });
      const text = await response.text();
      if (response.ok) {
        addToast('success', 'Test Webhook Sent!');
        fetchData(true);
      } else {
        addToast('error', `Webhook Failed: ${text}`);
      }
    } catch (e: any) {
      addToast('error', `Network Error: ${e.message}`);
    }
  };

  const callSendMessage = async (to: string, body: string, channel: string = 'sms') => {
    try {
      // Use the unified sender function
      let result = await supabase.functions.invoke('send-message', {
        body: { to, body, channel }
      });
      
      const { data, error } = result;
      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.warn("Message Sending Failed", err);
      const errorMessage = getErrorMessage(err);
      addToast('error', `Send Failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId || !selectedConversation) return;

    const tempMsg: Message = {
      id: Date.now().toString(),
      sender: 'ai', // We display user sent messages as 'ai' or 'system' usually, strictly 'user' is the client
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Optimistic Update
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    scrollToBottom();

    // DB Insert
    await supabase.from('messages').insert({
      conversation_id: selectedConversationId,
      sender: 'ai', // sent by business
      text: tempMsg.text
    });
    
    await supabase.from('conversations').update({
      last_message: tempMsg.text,
      last_message_at: new Date().toISOString(),
      status: 'replied'
    }).eq('id', selectedConversationId);

    // Network Send
    await callSendMessage(selectedConversation.phone, tempMsg.text, selectedConversation.channel);

    // NEW: Background Learning
    const lastUserMessage = messages.slice().reverse().find(m => m.sender === 'user');
    if (lastUserMessage) {
      supabase.functions.invoke('learn-from-interaction', {
        body: { user_question: lastUserMessage.text, admin_reply: tempMsg.text }
      });
    }
  };

  const handleAiAutoReply = async (targetConversationId?: string) => {
    const id = targetConversationId || selectedConversationId;
    if (!id) return;
    
    setIsAiProcessing(true);
    if (!targetConversationId) addToast('info', 'Generating AI Reply...');

    try {
      // Resolve Context (Phone & Channel)
      let targetPhone = '';
      let targetChannel = 'sms';

      const loadedConv = conversations.find(c => c.id === id);
      if (loadedConv) {
        targetPhone = loadedConv.phone;
        targetChannel = loadedConv.channel;
      } else {
        const { data } = await supabase.from('conversations').select('*').eq('id', id).single();
        if (data) {
          targetPhone = data.phone;
          targetChannel = data.channel;
        }
      }

      if (!targetPhone) throw new Error("Could not find conversation details");

      const { data, error } = await supabase.functions.invoke('generate-reply', {
        body: { conversation_id: id }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      const responseText = data.reply;
      if (!responseText) throw new Error("Empty response from AI");

      await supabase.from('messages').insert({ conversation_id: id, sender: 'ai', text: responseText });
      await supabase.from('conversations').update({ last_message: responseText, last_message_at: new Date().toISOString(), status: 'replied' }).eq('id', id);
      await callSendMessage(targetPhone, responseText, targetChannel);
      
      if (id === selectedConversationId) fetchMessagesById(id);
      if (!targetConversationId) addToast('success', 'AI Reply Sent');

    } catch (e: any) {
      const errMsg = getErrorMessage(e);
      addToast('error', `AI Failed: ${errMsg}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleCreateConversation = async (name: string, phone: string) => {
    try {
        let cleanPhone = phone.replace(/[^\d+]/g, '');
        if (cleanPhone.length > 0 && !cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;

        const { data: newConv, error } = await supabase.from('conversations').insert({
            user_id: user.id,
            client_name: name,
            phone: cleanPhone,
            channel: 'sms',
            last_message: '',
            status: 'new'
        }).select().single();

        if (error) throw error;
        await fetchData(true);
        if (newConv) {
            setSelectedConversationId(newConv.id);
            addToast('success', 'New conversation started');
        }
    } catch (e: any) {
        addToast('error', getErrorMessage(e));
    }
  };

  const confirmDeleteConversation = (id: string, name: string) => {
    setDeleteModalState({ isOpen: true, id, name });
  };

  const handleDeleteConversation = async () => {
    const id = deleteModalState.id;
    if (!id) return;
    setConversations(prev => prev.filter(c => c.id !== id));
    if (selectedConversationId === id) setSelectedConversationId(null);
    try {
      const { error } = await supabase.from('conversations').delete().eq('id', id);
      if (error) throw error;
      addToast('success', 'Conversation deleted');
    } catch (e: any) {
      const msg = getErrorMessage(e);
      addToast('error', 'Failed to delete: ' + msg);
      fetchData(true); 
    }
  };

  const handleSaveIntegrations = async (overrides?: any) => {
    setIsSavingSettings(true);
    try {
      let cleanPhone = integration.phoneNumber.replace(/[^\d+]/g, '');
      if (cleanPhone.length > 0 && !cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;
      
      const payload = {
        user_id: user.id,
        provider: 'twilio',
        account_sid: integration.accountSid,
        auth_token: integration.authToken,
        phone_number: cleanPhone,
        meta_page_id: integration.metaPageId,
        meta_access_token: integration.metaAccessToken,
        whatsapp_phone_id: integration.whatsappPhoneId,
        website_url: aiSettings.websiteUrl,
        business_goal: aiSettings.businessGoal,
        ai_context: aiSettings.aiContext,
        ai_api_key: aiSettings.aiApiKey,
        notification_phone: integration.notificationPhone,
        voice_enabled: integration.voiceEnabled,
        voice_id: integration.voiceId,
        voice_greeting: integration.voiceGreeting,
        auto_pilot_enabled: integration.autoPilotEnabled,
        ...overrides
      };

      const { data, error } = await supabase
        .from('integrations')
        .upsert(payload, { onConflict: 'user_id' })
        .select().single();

      if (error) throw error;
      if (data) setIntegration(prev => ({
        ...prev, 
        id: data.id, 
        phoneNumber: cleanPhone,
        autoPilotEnabled: data.auto_pilot_enabled ?? false
      }));
      addToast('success', 'Settings saved!');
    } catch (e: any) {
      if (e.code === '42P01' || e.code === '42703') setShowSqlModal(true);
      else addToast('error', getErrorMessage(e));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTrainAi = async () => {
     if (!aiSettings.websiteUrl) return addToast('error', 'Please enter a URL');
     setIsTrainingAi(true);
     addToast('info', 'Scanning website...');
     try {
       const result = await supabase.functions.invoke('train-ai', {
         body: { url: aiSettings.websiteUrl, goal: aiSettings.businessGoal }
       });
       if (result.error) throw result.error;
       const newContext = result.data.context;
       setAiSettings(prev => ({ ...prev, aiContext: newContext }));
       await handleSaveIntegrations({ ai_context: newContext });
       addToast('success', 'AI Training Complete!');
     } catch (e: any) {
       addToast('error', 'Failed to train AI: ' + e.message);
     } finally {
       setIsTrainingAi(false);
     }
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.message) return;
    setIsSendingCampaign(true);
    try {
      const { error } = await supabase.from('campaigns').insert({
          user_id: user.id,
          name: campaignForm.name,
          audience: campaignForm.audience,
          message: campaignForm.message,
          status: 'sent',
          sent_at: new Date().toISOString(),
          stats_delivered: conversations.length,
          stats_replied: 0
        }).select().single();

      if (error) throw error;
      
      if (conversations.length > 0) {
        const messagesToInsert = conversations.map(c => ({
          conversation_id: c.id,
          sender: 'ai',
          text: `[CAMPAIGN] ${campaignForm.message}`
        }));
        await supabase.from('messages').insert(messagesToInsert);
        for (const c of conversations) {
          await supabase.from('conversations').update({
            last_message: `[CAMPAIGN] ${campaignForm.message}`,
            last_message_at: new Date().toISOString(),
            status: 'replied'
          }).eq('id', c.id);
          await callSendMessage(c.phone, campaignForm.message, c.channel);
        }
      }
      addToast('success', 'Campaign Sent!');
      setTimeout(() => { setIsCampaignModalOpen(false); setActiveTab('inbox'); }, 1000);
    } catch (e: any) {
      addToast('error', getErrorMessage(e));
    } finally {
      setIsSendingCampaign(false);
    }
  };

  const handleStartEditingPhone = () => { if (selectedConversation) { setTempPhone(selectedConversation.phone); setIsEditingPhone(true); } };
  const handleSavePhone = async () => {
    if (!selectedConversationId || !tempPhone.trim()) { setIsEditingPhone(false); return; }
    let cleanPhone = tempPhone.replace(/[^\d+]/g, '');
    if (cleanPhone.length > 0 && !cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;
    try {
      await supabase.from('conversations').update({ phone: cleanPhone }).eq('id', selectedConversationId);
      setConversations(prev => prev.map(c => c.id === selectedConversationId ? { ...c, phone: cleanPhone } : c));
      addToast('success', 'Phone updated');
    } catch { addToast('error', 'Update failed'); }
    setIsEditingPhone(false);
  };

  // Populate this so the modal is actually useful
  const REQUIRED_SQL = `
-- Run this to fix missing columns (42703) or missing tables (42P01)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'notification_phone') then
    alter table public.integrations add column notification_phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'auto_pilot_enabled') then
    alter table public.integrations add column auto_pilot_enabled boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'voice_enabled') then
    alter table public.integrations add column voice_enabled boolean default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'voice_id') then
    alter table public.integrations add column voice_id text default 'Polly.Joanna';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'voice_greeting') then
    alter table public.integrations add column voice_greeting text;
  end if;
  -- Meta columns
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'meta_page_id') then
    alter table public.integrations add column meta_page_id text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'meta_access_token') then
    alter table public.integrations add column meta_access_token text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'whatsapp_phone_id') then
    alter table public.integrations add column whatsapp_phone_id text;
  end if;
  -- AI columns
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'ai_api_key') then
    alter table public.integrations add column ai_api_key text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'ai_context') then
    alter table public.integrations add column ai_context text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'business_goal') then
    alter table public.integrations add column business_goal text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'integrations' and column_name = 'website_url') then
    alter table public.integrations add column website_url text;
  end if;
end $$;
  `; 

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />}
      
      <SqlModal isOpen={showSqlModal} onClose={() => setShowSqlModal(false)} sql={REQUIRED_SQL} copySql={() => { navigator.clipboard.writeText(REQUIRED_SQL); setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2000); }} copied={sqlCopied} />
      <CampaignModal isOpen={isCampaignModalOpen} onClose={() => setIsCampaignModalOpen(false)} form={campaignForm} setForm={setCampaignForm} handleSendTest={() => {}} handleCreate={handleCreateCampaign} isSending={isSendingCampaign} />
      <NewConversationModal isOpen={isNewConvModalOpen} onClose={() => setIsNewConvModalOpen(false)} onCreate={handleCreateConversation} />
      <DeleteModal isOpen={deleteModalState.isOpen} onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })} onConfirm={handleDeleteConversation} clientName={deleteModalState.name} />

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} user={user} onLogout={onLogout} />
      <div className="hidden md:block fixed bottom-2 left-2 z-50 pointer-events-none"><p className="text-[10px] text-slate-400 font-mono">Synced: {lastSynced}</p></div>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between md:hidden">
           <button onClick={() => setMobileMenuOpen(true)}><Menu size={24} className="text-slate-600" /></button>
           <span className="font-bold text-slate-900 capitalize">{activeTab}</span>
           <div className="w-6" /> 
        </header>

        <div className="hidden md:flex absolute top-4 right-6 items-center gap-2 z-10 pointer-events-none">
           <div className={`w-2 h-2 rounded-full ${realtimeStatus === 'live' ? 'bg-green-500' : 'bg-amber-500'}`} />
        </div>

        {activeTab === 'inbox' && (
          <InboxView 
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            setSelectedConversationId={setSelectedConversationId}
            messages={messages}
            isLoading={isMessagesLoading}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSendMessage={handleSendMessage}
            isEditingPhone={isEditingPhone}
            tempPhone={tempPhone}
            setTempPhone={setTempPhone}
            handleSavePhone={handleSavePhone}
            handleStartEditingPhone={handleStartEditingPhone}
            handleAiAutoReply={() => handleAiAutoReply()}
            isAiProcessing={isAiProcessing}
            messagesEndRef={messagesEndRef}
            onRefresh={() => fetchData(true)}
            onNewConversation={() => setIsNewConvModalOpen(true)}
            isAutoPilotEnabled={integration.autoPilotEnabled}
            setIsAutoPilotEnabled={(enabled) => handleSaveIntegrations({ auto_pilot_enabled: enabled })}
            onDeleteConversation={confirmDeleteConversation}
          />
        )}
        {activeTab === 'campaigns' && <CampaignsView campaigns={campaigns} handleOpenCampaignModal={() => setIsCampaignModalOpen(true)} />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'settings' && (
          <SettingsView 
            integration={integration}
            setIntegration={setIntegration}
            handleSaveIntegrations={() => handleSaveIntegrations()}
            isSavingSettings={isSavingSettings}
            user={user}
            onTestWebhook={handleTestIncomingSMS}
            aiSettings={aiSettings}
            setAiSettings={setAiSettings}
            handleTrainAi={handleTrainAi}
            isTrainingAi={isTrainingAi}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;