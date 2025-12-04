
import React from 'react';
import { Database, Copy, Check, ArrowRight } from 'lucide-react';

interface SqlModalProps {
  isOpen: boolean;
  onClose: () => void;
  sql: string;
  copySql: () => void;
  copied: boolean;
}

const SqlModal: React.FC<SqlModalProps> = ({ isOpen, onClose, sql, copySql, copied }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-start gap-4 bg-amber-50">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Database Setup Required</h2>
            <p className="text-slate-600 text-sm mt-1">
              Run the SQL below in your Supabase Dashboard to enable Chats, Campaigns, and Integrations.
            </p>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50">
          <div className="relative">
            <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap border border-slate-800">
              {sql}
            </pre>
            <button 
              onClick={copySql}
              className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              title="Copy to Clipboard"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
          >
            I'll do it later
          </button>
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noreferrer"
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            Open Supabase Dashboard <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SqlModal;
