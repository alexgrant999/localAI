
import React from 'react';
import { X, Mail, Loader2, Send } from 'lucide-react';

interface CampaignFormState {
  name: string;
  audience: string;
  message: string;
}

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CampaignFormState;
  setForm: (form: CampaignFormState) => void;
  handleSendTest: () => void;
  handleCreate: () => void;
  isSending: boolean;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ 
  isOpen, onClose, form, setForm, handleSendTest, handleCreate, isSending 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">New SMS Campaign</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
            <input 
              type="text" 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
              placeholder="e.g. Summer Promo"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Audience</label>
            <select 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
              value={form.audience}
              onChange={(e) => setForm({...form, audience: e.target.value})}
            >
              <option>All Clients (Active)</option>
              <option>Leads (Not Booked)</option>
              <option>Past Clients (90+ days)</option>
              <option>VIP Members</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message Content</label>
            <div className="relative">
              <textarea 
                className="w-full p-3 border border-slate-200 rounded-lg text-sm h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 bg-white"
                placeholder="Hey {first_name}, we have openings this week! Reply BOOK to grab a spot."
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button 
            onClick={handleSendTest}
            className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 hover:underline flex items-center gap-1"
          >
            <Mail size={14} /> Send Test to Me
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreate}
              disabled={!form.name || !form.message || isSending}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Launch Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignModal;
