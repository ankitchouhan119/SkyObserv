"use client";

import React, { useEffect, useState } from 'react';
import { useQuery, useApolloClient } from '@apollo/client';
import { useLocation } from 'wouter';
import { GET_ALL_DATABASES, GET_DATABASE_METRICS, GET_TRACES_FOR_DB } from '@/apollo/queries/database';
import { useDurationStore } from '@/store/useDurationStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Database, Search, AlertCircle, ExternalLink, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';


function DatabaseStatus({ dbId, duration, dbName }: { dbId: string, duration: any, dbName: string }) {
  const client = useApolloClient();
  const [status, setStatus] = useState<'HEALTHY' | 'IDLE' | 'DIAGNOSING'>('DIAGNOSING');

  useEffect(() => {
    async function checkRealTimeHealth() {
      try {
        const { data: metricsData } = await client.query({
          query: GET_DATABASE_METRICS,
          variables: { id: dbId, duration },
          fetchPolicy: 'network-only'
        });

        const { data: traceData } = await client.query({
          query: GET_TRACES_FOR_DB,
          variables: {
            condition: {
              queryDuration: duration,
              traceState: 'ALL',
              queryOrder: 'BY_START_TIME',
              paging: { pageNum: 1, pageSize: 5 }
            }
          },
          fetchPolicy: 'network-only'
        });

        const hasMetrics = (metricsData?.sla || 0) > 0 || (metricsData?.latency || 0) > 0;
        const hasTraces = (traceData?.queryBasicTraces?.traces || []).length > 0;

        if (hasMetrics || hasTraces) {
          setStatus('HEALTHY');
        } else {
          setStatus('IDLE');
        }
      } catch (e) {
        setStatus('IDLE');
      }
    }
    checkRealTimeHealth();
  }, [dbId, duration, client]);

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest border transition-all duration-500 ${
      status === 'HEALTHY' 
        ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]' 
        : status === 'DIAGNOSING'
        ? 'bg-primary/10 text-primary border-primary/20 animate-pulse'
        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'HEALTHY' ? 'bg-green-400 animate-pulse' : status === 'DIAGNOSING' ? 'bg-primary' : 'bg-yellow-400'}`} />
      {status}
    </div>
  );
}

export default function DatabasesPage() {
  const [, setLocation] = useLocation();
  const { durationObj } = useDurationStore();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, loading, error, refetch } = useQuery(GET_ALL_DATABASES, {
    variables: { duration: durationObj },
    fetchPolicy: "network-only",
  });

  const databases = data?.getAllDatabases || [];
  const filteredDbs = databases.filter((db: any) => 
    db.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 px-4 py-6 font-sans text-slate-200">
        
  
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <LayoutGrid className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight italic uppercase">Database Storage</h1>
            </div>
            <p className="text-muted-foreground text-xs font-medium ml-1">
              Monitoring <span className="text-primary font-bold">{filteredDbs.length}</span> active clusters
            </p>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Filter by engine name..." 
              className="pl-10 w-full md:w-80 bg-card/40 border-white/10 h-10 rounded-lg focus:border-primary/50 transition-all font-medium text-white text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
             ))}
           </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center justify-center bg-red-500/5 border border-red-500/10 rounded-2xl gap-4">
            <AlertCircle className="w-10 h-10 text-red-500 opacity-50" />
            <div className="text-center">
              <h3 className="text-lg font-bold text-white uppercase italic">Telemetry Offline</h3>
              <p className="text-muted-foreground text-xs max-w-xs mx-auto mt-1">Unable to reach the OAP telemetry server.</p>
            </div>
            <button onClick={() => refetch()} className="px-6 py-2 bg-primary text-white font-bold text-[10px] rounded-md hover:bg-primary/80 transition-all uppercase tracking-widest">Retry Connection</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {filteredDbs.map((db: any) => (
              <Card 
                key={db.id} 
                className="group relative flex flex-col bg-card/40 border-white/10 hover:border-primary/40 hover:bg-card/60 transition-all duration-300 rounded-xl overflow-hidden shadow-lg"
              >
        
                <div className="absolute -right-4 -top-4 text-white/[0.03] group-hover:text-primary/[0.06] transition-all rotate-12 group-hover:scale-110 pointer-events-none">
                  <Database className="w-32 h-32" />
                </div>

                <div className="p-5 space-y-5 flex-1 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                      <Database className="text-primary w-5 h-5" />
                    </div>
                    <DatabaseStatus dbId={db.id} duration={durationObj} dbName={db.name} />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors tracking-tight">
                      {db.name}
                    </h3>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter opacity-50 truncate">
                      NODE ID: {db.id}
                    </p>
                  </div>
                </div>

                <div className="p-3 mt-auto border-t border-white/5 bg-white/[0.02]">
                  <button 
                    onClick={() => setLocation(`/databases/${db.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary transition-all text-[10px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    View Instance Metrics
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}