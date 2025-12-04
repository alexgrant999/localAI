
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_ANALYTICS } from '../../constants';

const AnalyticsView: React.FC = () => {
  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto">
       <div className="mb-8">
         <h1 className="text-2xl font-bold text-slate-900">Performance Overview</h1>
         <p className="text-slate-500">Track how LocalAI is growing your business.</p>
       </div>
       {/* Charts Area */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96">
         <h3 className="font-bold text-slate-900 mb-6">Activity (Last 7 Days)</h3>
         <ResponsiveContainer width="100%" height="100%">
           <AreaChart data={MOCK_ANALYTICS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
             <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
             <CartesianGrid vertical={false} stroke="#f1f5f9" />
             <Tooltip />
             <Area type="monotone" dataKey="messages" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} />
           </AreaChart>
         </ResponsiveContainer>
       </div>
    </div>
  );
};

export default AnalyticsView;
