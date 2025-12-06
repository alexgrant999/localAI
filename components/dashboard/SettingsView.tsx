
import React, { useState } from 'react';
import { Zap, Save, Loader2, Link, Copy, Check, AlertTriangle, Globe, Key, Brain, Sparkles, MessageCircle, Facebook, Instagram, HelpCircle, ChevronDown, ChevronUp, Smartphone, Mic } from 'lucide-react';
import { IntegrationSettings, User, AiSettings } from '../../types';
import { SUPABASE_URL } from '../../supabaseClient';

interface SettingsViewProps {
  integration: IntegrationSettings;
  setIntegration: React.Dispatch<React.SetStateAction<IntegrationSettings>>;
  handleSaveIntegrations: () => void;
  isSavingSettings: boolean;
  user: User;
  onTestWebhook?: () => void;
  aiSettings?: AiSettings;
  setAiSettings?: React.Dispatch<React.SetStateAction<AiSettings>>;
  handleTrainAi?: () => void;
  isTrainingAi?: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  integration, setIntegration, handleSaveIntegrations, isSavingSettings, user, onTestWebhook,
  aiSettings, setAiSettings, handleTrainAi, isTrainingAi
}) => {
  const [copied, setCopied] = useState(false);
  const [showMetaGuide, setShowMetaGuide] = useState(false);
  const [isTestingMeta, setIsTestingMeta] = useState(false);
  
  const webhookUrl = `${SUPABASE_URL}/functions/v1/incoming-sms`; // Twilio Webhook
  const voiceWebhookUrl = `${SUPABASE_URL}/functions/v1/incoming-voice`; // Twilio Voice Webhook
  const metaWebhookUrl = `${SUPABASE_URL}/functions/v1/incoming-meta`; // Meta Webhook

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestMetaWebhook = async () => {
    if (!integration.metaPageId) {
      alert("Please save a Meta Page ID first.");
      return;
    }
    setIsTestingMeta(true);
    try {
      const payload = {
        object: "page",
        entry: [{
          id: integration.metaPageId,
          messaging: [{
            sender: { id: "123456789_TEST_USER" },
            recipient: { id: integration.metaPageId },
            timestamp: Date.now(),
            message: { text: "This is a simulated Facebook message." }
          }]
        }]
      };

      const response = await fetch(metaWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const text = await response.text();
      if (response.ok) {
        alert("Success! Check your Inbox for a new Facebook conversation.");
      } else {
        alert(`Failed: ${text}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsTestingMeta(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

        {/* AI TRAINING SECTION */}
        {aiSettings && setAiSettings && handleTrainAi && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center gap-3">
               <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Brain size={20} /></div>
               <div><h3 className="font-bold text-slate-900">AI Business Training</h3><p className="text-sm text-slate-500">Train your AI agent by scanning your website.</p></div>
             </div>
             <div className="p-6 space-y-4">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4">
                   <label className="block text-sm font-bold text-indigo-900 mb-1 flex items-center gap-2"><Key size={14} /> Google Gemini API Key</label>
                   <input type="password" className="w-full p-2.5 border border-indigo-200 rounded-lg text-sm bg-white text-slate-900" placeholder="AIzaSy..." value={aiSettings.aiApiKey} onChange={e => setAiSettings(prev => ({...prev, aiApiKey: e.target.value}))} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                    <input type="url" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" placeholder="https://mybusiness.com" value={aiSettings.websiteUrl} onChange={e => setAiSettings(prev => ({...prev, websiteUrl: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Goal</label>
                    <input type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" value={aiSettings.businessGoal} onChange={e => setAiSettings(prev => ({...prev, businessGoal: e.target.value}))} />
                  </div>
                </div>
                <button onClick={handleTrainAi} disabled={isTrainingAi || !aiSettings.websiteUrl} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-70">
                   {isTrainingAi ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Scan & Train AI
                </button>
                
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1 mt-4">Knowledge Base (AI Context)</label>
                   <p className="text-xs text-slate-500 mb-2">The AI uses this information to answer questions. You can edit this manually.</p>
                   <textarea 
                      className="w-full p-3 border border-slate-200 rounded-lg text-sm h-64 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white font-mono leading-relaxed"
                      value={aiSettings.aiContext}
                      onChange={e => setAiSettings(prev => ({...prev, aiContext: e.target.value}))}
                      placeholder="e.g. Opening hours are 9-5. Parking is free on Sundays..."
                   />
                </div>
             </div>
          </div>
        )}

        {/* VOICE AI SETTINGS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Mic size={20} /></div>
             <div><h3 className="font-bold text-slate-900">AI Voice Receptionist</h3><p className="text-sm text-slate-500">Answer phone calls automatically.</p></div>
          </div>
          <div className="p-6 space-y-4">
             <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="voiceEnabled"
                  checked={integration.voiceEnabled !== false}
                  onChange={e => setIntegration(prev => ({...prev, voiceEnabled: e.target.checked}))}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="voiceEnabled" className="text-sm font-bold text-slate-900">Enable Voice AI Answering</label>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">AI Voice ID</label>
                <select 
                   className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900"
                   value={integration.voiceId}
                   onChange={e => setIntegration(prev => ({...prev, voiceId: e.target.value}))}
                >
                   <option value="Polly.Joanna">Joanna (Female, US)</option>
                   <option value="Polly.Matthew">Matthew (Male, US)</option>
                   <option value="Polly.Amy">Amy (Female, UK)</option>
                </select>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Welcome Greeting</label>
                <input 
                   type="text" 
                   className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" 
                   value={integration.voiceGreeting}
                   onChange={e => setIntegration(prev => ({...prev, voiceGreeting: e.target.value}))}
                />
                <p className="text-xs text-slate-500 mt-1">What the AI says when it first picks up.</p>
             </div>

             <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
               <span className="text-xs font-bold text-slate-700 block mb-1">Twilio Voice Webhook</span>
               <div className="flex gap-2">
                 <code className="flex-1 text-xs bg-white p-2 rounded border border-slate-200 text-slate-600">{voiceWebhookUrl}</code>
                 <button onClick={() => handleCopy(voiceWebhookUrl)} className="p-2 bg-white border border-slate-200 rounded hover:text-indigo-600"><Copy size={14}/></button>
               </div>
               <p className="text-[10px] text-slate-500 mt-2">Paste this URL in Twilio Console &gt; Phone Numbers &gt; Voice & Fax &gt; "A Call Comes In"</p>
            </div>
          </div>
        </div>
        
        {/* OMNICHANNEL (Meta/WhatsApp) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Facebook size={20} /></div>
               <div><h3 className="font-bold text-slate-900">Omnichannel (Meta)</h3><p className="text-sm text-slate-500">Connect Facebook, Instagram & WhatsApp.</p></div>
             </div>
             <button onClick={() => setShowMetaGuide(!showMetaGuide)} className="text-slate-400 hover:text-slate-600">
               {showMetaGuide ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
             </button>
          </div>
          
          {showMetaGuide && (
            <div className="bg-blue-50 p-6 border-b border-blue-100">
              <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2"><HelpCircle size={14}/> Setup Guide</h4>
              <div className="space-y-3">
                <div className="text-xs text-blue-800">
                  <h5 className="font-bold underline mb-1">Part 1: Link Instagram</h5>
                  <ol className="list-decimal list-inside space-y-1 ml-1">
                    <li>Switch Instagram App to <strong>Professional Account</strong>.</li>
                    <li>Connect Instagram to your Facebook Page in Page Settings.</li>
                    <li>In Instagram App: Settings &gt; Messages &gt; Enable "Allow Access to Messages".</li>
                  </ol>
                </div>
                <div className="text-xs text-blue-800 border-t border-blue-200 pt-2">
                  <h5 className="font-bold underline mb-1">Part 2: Get IDs & Token (Avoid 'manage_pages')</h5>
                  <ol className="list-decimal list-inside space-y-1 ml-1">
                    <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" className="underline font-bold">Meta Developers</a>. Create a Business App.</li>
                    <li>Add <strong>Messenger</strong>. Generate Token for your Page.</li>
                    <li><strong>Important:</strong> When generating token, select permissions: <code>pages_messaging</code>, <code>pages_read_engagement</code>. For Instagram, add <code>instagram_basic</code>, <code>instagram_manage_messages</code>.</li>
                    <li>Do NOT select <code>manage_pages</code> (it is deprecated).</li>
                  </ol>
                </div>
                <div className="text-xs text-blue-800 border-t border-blue-200 pt-2">
                  <h5 className="font-bold underline mb-1">Part 3: Connect Webhook</h5>
                  <ol className="list-decimal list-inside space-y-1 ml-1">
                    <li>In Meta App &gt; Messenger &gt; Settings &gt; Webhooks: Click "Edit Callback URL".</li>
                    <li>Paste the URL below. Verify Token: <code>localai</code>.</li>
                    <li>Add Subscriptions: <code>messages</code> and <code>messaging_postbacks</code>.</li>
                  </ol>
                </div>
                 <div className="text-xs text-blue-800 border-t border-blue-200 pt-2">
                  <h5 className="font-bold underline mb-1">Part 4: "Insufficient Developer Role" Error?</h5>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>If you see this error, your Meta App is likely in <strong>Development Mode</strong>.</li>
                    <li>In Dev Mode, you can only message people listed as "Testers" in the Meta App (Roles &gt; Roles).</li>
                    <li>To message real customers, switch the Meta App to <strong>Live Mode</strong> (Toggle at top of screen).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta Page ID (Facebook)</label>
              <input type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" placeholder="1000..." value={integration.metaPageId} onChange={e => setIntegration(prev => ({...prev, metaPageId: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Instagram Business ID (Optional)</label>
              <input type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" placeholder="1784..." value={integration.metaInstagramId || ''} onChange={e => setIntegration(prev => ({...prev, metaInstagramId: e.target.value}))} />
              <p className="text-xs text-slate-500 mt-1">Required for Instagram DMs. Find it using Graph API Explorer.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta Access Token</label>
              <input type="password" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" placeholder="EAA..." value={integration.metaAccessToken} onChange={e => setIntegration(prev => ({...prev, metaAccessToken: e.target.value}))} />
              <p className="text-xs text-slate-500 mt-1">Requires <code>pages_messaging</code> and <code>instagram_manage_messages</code>. Do NOT use <code>manage_pages</code>.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Phone ID (Optional)</label>
              <input type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" placeholder="1234..." value={integration.whatsappPhoneId} onChange={e => setIntegration(prev => ({...prev, whatsappPhoneId: e.target.value}))} />
            </div>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
               <span className="text-xs font-bold text-slate-700 block mb-1">Meta Webhook URL (Verify Token: 'localai')</span>
               <div className="flex gap-2">
                 <code className="flex-1 text-xs bg-white p-2 rounded border border-slate-200 text-slate-600">{metaWebhookUrl}</code>
                 <button onClick={() => handleCopy(metaWebhookUrl)} className="p-2 bg-white border border-slate-200 rounded hover:text-indigo-600"><Copy size={14}/></button>
               </div>
            </div>
            <div className="mt-4 text-right">
              <button onClick={handleTestMetaWebhook} disabled={isTestingMeta} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg font-bold hover:bg-blue-100 disabled:opacity-50">
                 {isTestingMeta ? "Simulating..." : "Test Facebook Message"}
              </button>
            </div>
          </div>
        </div>

        {/* SMS Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Smartphone size={20} /></div>
            <div><h3 className="font-bold text-slate-900">SMS (Twilio)</h3><p className="text-sm text-slate-500">Connect your Twilio account for texts.</p></div>
          </div>
          <div className="p-6 space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Account SID</label><input type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" value={integration.accountSid} onChange={e => setIntegration(prev => ({...prev, accountSid: e.target.value}))} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Auth Token</label><input type="password" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" value={integration.authToken} onChange={e => setIntegration(prev => ({...prev, authToken: e.target.value}))} /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label><input type="text" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" value={integration.phoneNumber} onChange={e => setIntegration(prev => ({...prev, phoneNumber: e.target.value}))} /></div>
            
            {/* New Notification Phone Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Admin Notification Phone</label>
              <input 
                type="text" 
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" 
                placeholder="+1555..." 
                value={integration.notificationPhone || ''} 
                onChange={e => setIntegration(prev => ({...prev, notificationPhone: e.target.value}))} 
              />
              <p className="text-xs text-slate-500 mt-1">Receive SMS alerts when new leads arrive.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={handleSaveIntegrations} disabled={isSavingSettings} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-70">
                {isSavingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save All Keys
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
               <span className="text-xs font-bold text-slate-700 block mb-1">Twilio Webhook URL</span>
               <div className="flex gap-2">
                 <code className="flex-1 text-xs bg-white p-2 rounded border border-slate-200 text-slate-600">{webhookUrl}</code>
                 <button onClick={() => handleCopy(webhookUrl)} className="p-2 bg-white border border-slate-200 rounded hover:text-indigo-600"><Copy size={14}/></button>
               </div>
            </div>
            {onTestWebhook && <div className="mt-2 text-right"><button onClick={onTestWebhook} className="text-xs text-rose-600 hover:underline">Simulate Test SMS</button></div>}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsView;
