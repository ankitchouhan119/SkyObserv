import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_SERVICES } from '@/apollo/queries/services';
import { useDurationStore } from '@/store/useDurationStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Search, Server, ArrowRight, Activity, Zap, AlertTriangle } from 'lucide-react';

export default function ServicesPage() {
  const { durationObj } = useDurationStore();
  const [search, setSearch] = useState('');

  const { data, loading, error } = useQuery(GET_ALL_SERVICES, {
    variables: { duration: durationObj },
    pollInterval: 60000, // Refresh list every minute
  });

  const services = data?.getAllServices || [];
  const filteredServices = services.filter((s: any) => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.group?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Hero / Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-transparent border-blue-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Server className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Services</p>
                <h2 className="text-3xl font-bold">{loading ? '-' : services.length}</h2>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-900/20 to-transparent border-green-500/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Healthy</p>
                <h2 className="text-3xl font-bold text-green-400">
                  {loading ? '-' : Math.floor(services.length * 0.9)} {/* Mock healthy count for visual */}
                </h2>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-900/20 to-transparent border-orange-500/20">
             <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Warnings</p>
                <h2 className="text-3xl font-bold text-orange-400">
                  {loading ? '-' : Math.ceil(services.length * 0.1)} {/* Mock warning count */}
                </h2>
              </div>
            </div>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search services..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card/50 border-white/10 focus:border-primary/50"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/10 bg-card/50">Filter by Group</Button>
          </div>
        </div>

        {/* Service Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-card/50 rounded-xl border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center border border-dashed border-red-900/50 bg-red-950/10 rounded-xl text-red-400">
            Failed to load services. Check connection to SkyWalking OAP.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service: any) => (
              <Link key={service.id} href={`/services/${service.id}`}>
                <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-card/40 p-6 hover:bg-card/60 hover:border-primary/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-primary/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-lg bg-secondary border border-white/5 text-primary group-hover:scale-110 transition-transform">
                      <Zap className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="bg-white/5 text-muted-foreground font-normal">
                      {service.group || 'General'}
                    </Badge>
                  </div>

                  <h3 className="relative text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  
                  <div className="relative grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Type</p>
                      <p className="text-sm font-medium">Agent</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                      <div className="flex items-center text-green-400 text-sm font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2" />
                        Online
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Badge({ className, variant, children }: any) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>;
}
