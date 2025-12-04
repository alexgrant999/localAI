
import React from 'react';
import { MessageSquare, Megaphone, BarChart2, Settings, X, LogOut } from 'lucide-react';
import { DashboardTab, User } from '../../types';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen, user, onLogout 
}) => {
  
  const SidebarItem = ({ tab, icon: Icon, label }: { tab: DashboardTab, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
        activeTab === tab 
          ? 'bg-indigo-600 text-white' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0
      ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <span className="font-bold text-slate-900">LocalAI</span>
        </div>
        <button className="md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      <div className="px-3 space-y-1">
        <SidebarItem tab="inbox" icon={MessageSquare} label="Inbox" />
        <SidebarItem tab="campaigns" icon={Megaphone} label="Campaigns" />
        <SidebarItem tab="analytics" icon={BarChart2} label="Analytics" />
        <SidebarItem tab="settings" icon={Settings} label="Settings" />
      </div>

      <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-slate-900 truncate">{user.companyName}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{user.plan} Plan</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-rose-600 transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
