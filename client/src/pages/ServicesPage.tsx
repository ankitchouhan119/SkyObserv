"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_SERVICES } from '@/apollo/queries/services';
import { GET_ALL_DATABASES } from '@/apollo/queries/database';
import { useDurationStore } from '@/store/useDurationStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import { Search, Server, ArrowRight, Activity, Zap, Database, HeartOff } from 'lucide-react';

export default function ServicesPage() {
  const { durationObj } = useDurationStore();
  const [search, setSearch] = useState('');

  const { data: servicesData, loading: servicesLoading, error: servicesError } = useQuery(GET_ALL_SERVICES, {
    variables: { duration: durationObj },
    pollInterval: 60000,
  });

  const { data: dbData } = useQuery(GET_ALL_DATABASES, {
    variables: { duration: durationObj },
  });

  const realServices = (servicesData?.getAllServices || []).filter((s: any) => {
    const isDb = s.layers?.some((l: string) => l.includes('DATABASE') || l.includes('CACHE'));
    return !isDb
  });

  const databases = dbData?.getAllDatabases || [];


  const healthyCount = realServices.filter((s: any) => s.normal === true).length;
  const unhealthyCount = realServices.length - healthyCount;

  const filteredServices = realServices.filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.group?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-transparent border-blue-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg"><Server className="w-6 h-6 text-blue-400" /></div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Services</p>
                <h2 className="text-3xl font-bold">{servicesLoading ? '...' : realServices.length}</h2>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-transparent border-purple-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg"><Database className="w-6 h-6 text-purple-400" /></div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Databases</p>
                <h2 className="text-3xl font-bold">{databases.length}</h2>
              </div>
            </div>
          </Card>

          {/* Healthy Card */}
          <Card className="p-6 bg-gradient-to-br from-green-900/20 to-transparent border-green-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg"><Activity className="w-6 h-6 text-green-400" /></div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Healthy</p>
                <h2 className="text-3xl font-bold text-green-400">{servicesLoading ? '...' : healthyCount}</h2>
              </div>
            </div>
          </Card>

          {/* Unhealthy Card */}
          <Card className="p-6 bg-gradient-to-br from-red-900/20 to-transparent border-red-500/20">
             <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg"><HeartOff className="w-6 h-6 text-red-400" /></div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Unhealthy</p>
                <h2 className="text-3xl font-bold text-red-400">{servicesLoading ? '...' : unhealthyCount}</h2>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search services..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card/50 border-white/10"
          />
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service: any) => {
            // Dynamic Status Logic
            const isNormal = service.normal === true;

            return (
              <Link key={service.id} href={`/services/${service.id}`}>
                <div className="group relative rounded-xl border border-white/10 bg-card/40 p-6 hover:border-primary/50 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-lg bg-secondary text-primary"><Zap className="w-5 h-5" /></div>
                    <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-muted-foreground">
                      {service.group || 'General'}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{service.shortName || service.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Layers</p>
                      <p className="text-sm font-medium truncate">{(service.layers || []).join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                      
                      {/* FINAL STATUS CHECK */}
                      <div className={`flex items-center text-sm font-medium ${isNormal ? 'text-green-400' : 'text-red-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isNormal ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-400 shadow-[0_0_8px_#f87171]'}`} />
                        {isNormal ? 'Normal' : 'Abnormal'}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}