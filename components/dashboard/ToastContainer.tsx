
import React from 'react';
import { X, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`
            pointer-events-auto px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-right duration-300 max-w-sm
            ${toast.type === 'success' ? 'bg-white border-green-100 text-green-800' : ''}
            ${toast.type === 'error' ? 'bg-white border-rose-100 text-rose-800' : ''}
            ${toast.type === 'info' ? 'bg-slate-800 border-slate-700 text-slate-50 shadow-2xl' : ''}
          `}
        >
          {toast.type === 'success' && <CheckCircle2 size={18} className="text-green-500 shrink-0"/>}
          {toast.type === 'error' && <AlertCircle size={18} className="text-rose-500 shrink-0"/>}
          {toast.type === 'info' && <Zap size={18} className="text-yellow-400 shrink-0"/>}
          <p className="text-sm font-medium leading-tight">{toast.message}</p>
          <button 
            onClick={() => removeToast(toast.id)} 
            className="ml-2 opacity-50 hover:opacity-100 p-1 rounded-full hover:bg-black/5 transition"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
