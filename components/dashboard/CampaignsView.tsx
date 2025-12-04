
import React from 'react';
import { Plus } from 'lucide-react';
import { Campaign } from '../../types';

interface CampaignsViewProps {
  campaigns: Campaign[];
  handleOpenCampaignModal: () => void;
}

const CampaignsView: React.FC<CampaignsViewProps> = ({ campaigns, handleOpenCampaignModal }) => {
  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto">
       <div className="flex items-center justify-between mb-8">
         <div>
           <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
           <p className="text-slate-500">Blast offers and updates to your clients.</p>
         </div>
         <button 
           onClick={handleOpenCampaignModal}
           className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-lg shadow-indigo-200"
         >
           <Plus size={18} /> New Campaign
         </button>
       </div>

       <div className="grid gap-6">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-slate-900">{campaign.name}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      campaign.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {campaign.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{campaign.sentAt} • Audience: {campaign.audience}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-slate-900">{campaign.stats.delivered}</div>
                    <div className="text-xs text-slate-500">Delivered</div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic border border-slate-100">
                "{campaign.message}"
              </div>
            </div>
          ))}
       </div>
    </div>
  );
};

export default CampaignsView;
