import React from 'react';
import { Box, Server, Activity, Shield, Database, LayoutGrid } from 'lucide-react';

const NamespaceCard = ({ namespace }) => {
  // Default data agar backend se props na milein
  const {
    name = "default",
    pods = { total: 0, running: 0 },
    services = 0,
    deployments = 0,
    sts = 0,
    daemonsets = 0,
    status = "healthy"
  } = namespace;

  const stats = [
    { label: 'Pods', value: pods.total, icon: <Box size={16} className="text-blue-500" />, sub: `${pods.running} Running` },
    { label: 'Services', value: services, icon: <Activity size={16} className="text-green-500" /> },
    { label: 'Deployments', value: deployments, icon: <LayoutGrid size={16} className="text-purple-500" /> },
    { label: 'StatefulSets', value: sts, icon: <Database size={16} className="text-orange-500" /> },
    { label: 'DaemonSets', value: daemonsets, icon: <Shield size={16} className="text-red-500" /> },
  ];

  return (
    <div className="bg-[#1a1b1e] border border-gray-800 rounded-xl p-5 hover:border-blue-500 transition-all duration-300 shadow-lg w-full max-w-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <h3 className="text-xl font-bold text-gray-100 truncate w-40">{name}</h3>
        </div>
        <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
          Namespace
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`p-3 rounded-lg bg-[#25262b] border border-transparent hover:border-gray-700 transition-colors ${stat.label === 'Pods' ? 'col-span-2' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
              {stat.icon}
              <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{stat.value}</span>
              {stat.sub && <span className="text-[10px] text-gray-500 font-medium">{stat.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button className="w-full mt-6 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg text-sm font-semibold transition-all duration-200 border border-blue-600/20">
        View Details
      </button>
    </div>
  );
};

export default NamespaceCard;