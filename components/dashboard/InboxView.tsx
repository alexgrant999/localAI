


import React from 'react';
import { Search, Pencil, RefreshCw, Sparkles, Plus, ToggleLeft, ToggleRight, Trash2, Smartphone, Facebook, Instagram, MessageCircle, Send } from 'lucide-react';
import { Conversation, Message, Channel } from '../../types';

interface InboxViewProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string) => void;
  messages: Message[];
  isLoading: boolean;
  newMessage: string;
  setNewMessage: (msg: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isEditingPhone: boolean;
  tempPhone: string;
  setTempPhone: (phone: string) => void;
  handleSavePhone: () => void;
  handleStartEditingPhone: () => void;
  handleAiAutoReply: () => void;
  isAiProcessing: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onRefresh: () => void;
  onNewConversation: () => void;
  isAutoPilotEnabled?: boolean;
  setIsAutoPilotEnabled?: (enabled: boolean) => void;
  onDeleteConversation?: (id: string, name: string) => void;
}

const ChannelIcon = ({ channel }: { channel: Channel }) => {
  switch (channel) {
    case 'facebook': return <Facebook size={14} className="text-blue-600" />;
    case 'instagram': return <Instagram size={14} className="text-pink-600" />;
    case 'whatsapp': return <MessageCircle size={14} className="text-green-600" />;
    default: return <Smartphone size={14} className="text-slate-400" />;
  }
};

const InboxView: React.FC<InboxViewProps> = ({
  conversations, selectedConversationId, setSelectedConversationId, messages, isLoading,
  newMessage, setNewMessage, handleSendMessage, isEditingPhone, tempPhone, setTempPhone,
  handleSavePhone, handleStartEditingPhone, handleAiAutoReply, isAiProcessing, messagesEndRef,
  onRefresh, onNewConversation, isAutoPilotEnabled, setIsAutoPilotEnabled, onDeleteConversation
}) => {
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Conversation List */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>
          <button onClick={onNewConversation} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm">
            <Plus size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No conversations yet.</div>
          ) : (
            conversations.map(conv => (
              <div key={conv.id} className="relative group overflow-hidden">
                <button
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full p-4 text-left border-b border-slate-50 hover:bg-slate-50 transition-all duration-300 ${
                    selectedConversationId === conv.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'
                  } group-hover:-translate-x-12`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${selectedConversationId === conv.id ? 'text-indigo-900' : 'text-slate-900'}`}>
                        {conv.clientName}
                      </span>
                      <ChannelIcon channel={conv.channel} />
                    </div>
                    <span className="text-xs text-slate-400">{conv.time}</span>
                  </div>
                  <p className="text-sm text-slate-500 truncate mb-2 min-h-[1.25em]">
                    {conv.lastMessage || <span className="italic opacity-50">No messages yet</span>}
                  </p>
                </button>
                
                {onDeleteConversation && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id, conv.clientName); }}
                    className="absolute top-0 right-0 bottom-0 w-12 bg-rose-500 text-white flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-300 hover:bg-rose-600 z-10"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 hidden md:flex flex-col bg-slate-50/50">
        {selectedConversation ? (
          <>
            <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                   {selectedConversation.clientName}
                   <ChannelIcon channel={selectedConversation.channel} />
                </h2>
                {isEditingPhone ? (
                  <input 
                    autoFocus
                    className="text-xs text-slate-900 border border-indigo-200 rounded px-2 py-1 mt-0.5 bg-white"
                    value={tempPhone}
                    onChange={e => setTempPhone(e.target.value)}
                    onBlur={handleSavePhone}
                    onKeyDown={e => e.key === 'Enter' && handleSavePhone()}
                  />
                ) : (
                  <button onClick={handleStartEditingPhone} className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 group mt-0.5">
                    {selectedConversation.phone}
                    <Pencil size={10} className="opacity-0 group-hover:opacity-100" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={onRefresh} disabled={isLoading} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition">
                    <RefreshCw size={16} className={`${isLoading ? 'animate-spin' : ''}`} />
                 </button>
                 <div className="h-4 w-px bg-slate-200 mx-1"></div>
                 {isAutoPilotEnabled !== undefined && setIsAutoPilotEnabled && (
                   <div 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer ${isAutoPilotEnabled ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                      onClick={() => setIsAutoPilotEnabled(!isAutoPilotEnabled)}
                   >
                     <span className="text-xs font-bold uppercase">{isAutoPilotEnabled ? 'Auto-Pilot ON' : 'OFF'}</span>
                     {isAutoPilotEnabled ? <ToggleRight size={20} className="text-purple-600"/> : <ToggleLeft size={20}/>}
                   </div>
                 )}
                 {!isAutoPilotEnabled && (
                   <button onClick={handleAiAutoReply} disabled={isAiProcessing} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition disabled:opacity-50">
                      {isAiProcessing ? <span className="animate-pulse">Thinking...</span> : <><Sparkles size={14}/> AI Reply</>}
                    </button>
                 )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'ai' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[75%] rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed
                    ${msg.sender === 'ai' ? 'bg-indigo-600 text-white rounded-br-none' : msg.sender === 'system' ? 'bg-rose-50 text-rose-800 w-full max-w-full text-center py-2' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}
                  `}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a reply..." className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                <button type="submit" disabled={!newMessage.trim()} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50"><Send size={20} /></button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">Select a conversation</div>
        )}
      </div>
    </div>
  );
};
export default InboxView;