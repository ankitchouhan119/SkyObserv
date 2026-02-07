"use client";

import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_DATABASES } from '@/apollo/queries/services';
import { useDurationStore } from '@/store/useDurationStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Database, Activity, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function DatabasesPage() {
  const { durationObj, setCustomRange } = useDurationStore();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, loading, error, refetch } = useQuery(GET_ALL_DATABASES, {
    variables: { duration: durationObj },
    fetchPolicy: "network-only",
  });

  // Catch time updates or database filters
  useEffect(() => {
    const handleAutoUpdate = (e: any) => {
      const { filters } = e.detail;
      if (filters) {
        if (filters.startDate && filters.endDate) {
          setCustomRange(filters.startDate, filters.endDate);
        }
        if (filters.serviceId) {
          setSearchTerm(filters.serviceId);
        }
        setTimeout(() => refetch(), 500);
      }
    };
    window.addEventListener("skyobserv:query-update", handleAutoUpdate);
    return () => window.removeEventListener("skyobserv:query-update", handleAutoUpdate);
  }, [refetch, setCustomRange]);

  const databases = data?.getAllDatabases || [];
  const filteredDbs = databases.filter((db: any) => 
    db.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              Database Inventory
            </h1>
            <p className="text-muted-foreground text-sm">Monitoring health and traffic for all storage engines</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search databases..." 
                className="pl-9 bg-card/40 border-white/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-red-400 gap-2">
            <AlertCircle className="w-10 h-10 opacity-50" />
            <p>Error loading databases: {error.message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto pb-6">
            {filteredDbs.map((db: any) => (
              <Card key={db.id} className="p-5 bg-[#0f172a]/40 border-white/5 hover:border-primary/40 transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Database className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{db.name}</h3>
                      <Badge variant="secondary" className="text-[10px] font-mono mt-1 opacity-70">
                        {db.type || 'Storage Engine'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                    <Activity className="w-3 h-3" />
                    Online
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-mono">{db.id.substring(0, 12)}...</span>
                  <button className="text-xs text-primary font-bold hover:underline">View Details</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}