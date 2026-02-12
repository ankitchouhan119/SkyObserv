"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useApolloClient } from '@apollo/client';
import { GET_ALL_DATABASES, GET_TRACES_FOR_DB, GET_TRACE_DETAILS } from '@/apollo/queries/database';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { useDurationStore } from '@/store/useDurationStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Database, Activity, ShieldCheck, Zap,
    Loader2, Clock, Terminal, ArrowLeft,
    Server, Cpu, RefreshCw, Search
} from 'lucide-react';

export default function DatabaseDetailPage() {
    const { id } = useParams();
    const client = useApolloClient();
    const { durationObj } = useDurationStore();
    const decodedId = decodeURIComponent(id || "");

    const [dbSpans, setDbSpans] = useState<any[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [searchQuery, setSearchQuery] = useState("");

    const formatDisplayTime = (timeStr: string) => {
        if (!timeStr) return "";
        try {
            const parts = timeStr.split(' ');
            const [year, month, day] = parts[0].split('-').map(Number);
            const timePart = parts[1] || "0000";
            const hour = parseInt(timePart.slice(0, 2));
            const min = timePart.length >= 4 ? parseInt(timePart.slice(2, 4)) : 0;
            const utcDate = new Date(Date.UTC(year, month - 1, day, hour, min));
            return utcDate.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) { return timeStr; }
    };

    const { data: dbListData } = useQuery(GET_ALL_DATABASES, { variables: { duration: durationObj } });
    const db = dbListData?.getAllDatabases?.find((d: any) => d.id === decodedId);

    useEffect(() => {
        async function performUniversalScan() {
            setIsScanning(true);
            try {
                const { data: listData } = await client.query({
                    query: GET_TRACES_FOR_DB,
                    variables: {
                        condition: { queryDuration: durationObj, traceState: 'ALL', queryOrder: 'BY_START_TIME', paging: { pageNum: 1, pageSize: 60 } }
                    },
                    fetchPolicy: 'network-only'
                });

                const basicTraces = listData?.queryBasicTraces?.traces || [];
                const foundSpans: any[] = [];

                const detailResults = await Promise.all(basicTraces.map(t =>
                    client.query({ query: GET_TRACE_DETAILS, variables: { traceId: t.traceIds[0] } })
                ));

                detailResults.forEach((res) => {
                    const spans = res.data?.queryTrace?.spans || [];
                    spans.forEach((span: any) => {
                        const isStorage = span.layer?.toLowerCase() === 'database' ||
                            span.layer?.toLowerCase() === 'cache' ||
                            /mysql|postgres|mongodb|redis/i.test(span.component || "");

                        if (span.type === 'Exit' && isStorage) {
                            const statementTag = span.tags?.find((t: any) => ['db.statement', 'redis.command', 'mongodb.command'].includes(t.key));
                            foundSpans.push({
                                key: span.spanId + span.startTime,
                                statement: statementTag ? statementTag.value : span.endpointName,
                                latency: span.endTime - span.startTime,
                                time: span.startTime,
                                component: span.component || "Storage",
                                peer: span.peer,
                                isError: span.isError
                            });
                        }
                    });
                });

                setDbSpans(foundSpans.sort((a, b) => b.time - a.time));
            } catch (err) { console.error(err); } finally { setIsScanning(false); }
        }
        performUniversalScan();
    }, [durationObj, client, decodedId]);

    const liveMetrics = useMemo(() => {
        const hasData = dbSpans.length > 0;
        return {
            latency: hasData ? Math.round(dbSpans.reduce((acc, s) => acc + s.latency, 0) / dbSpans.length) : 0,
            ops: dbSpans.length,
            health: hasData ? "ONLINE" : "IDLE"
        };
    }, [dbSpans]);

    const filteredSpans = useMemo(() => {
        return dbSpans.filter(s =>
            s.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.component.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [dbSpans, searchQuery]);

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4 font-sans text-slate-200">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link href="/databases"><span className="text-sm text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1 transition-colors"><ArrowLeft className="w-3 h-3" /> Back</span></Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white tracking-tight">{db?.name || "Storage Engine"}</h1>
                            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase text-[10px] tracking-widest px-2 py-0.5"><Database className="w-3 h-3 mr-1" /> Engine</Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block px-4 border-r border-white/10 text-xs font-mono text-white/70">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5 text-primary/60">Observation Window (IST)</p>
                            {formatDisplayTime(durationObj.start)} — {formatDisplayTime(durationObj.end)}
                        </div>
                        <Button variant="outline" size="sm" className="bg-card/50 border-white/10 text-white hover:bg-white/5" onClick={() => window.location.reload()}>
                            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isScanning ? 'animate-spin' : ''}`} /> Sync
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-card/50 border border-white/10 p-1">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="queries">Queries ({dbSpans.length})</TabsTrigger>
                        <TabsTrigger value="topology">Infrastructure</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 text-slate-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MetricCard label="Avg Latency" value={`${liveMetrics.latency}ms`} icon={<Zap className="w-4 h-4" />} color="text-yellow-400" />
                            <MetricCard label="Throughput" value={liveMetrics.ops} icon={<Activity className="w-4 h-4" />} color="text-blue-400" />
                            <MetricCard label="Success Rate" value={dbSpans.length > 0 ? "100%" : "0%"} icon={<ShieldCheck className="w-4 h-4" />} color="text-green-400" />
                        </div>

                        <Card className="bg-card/40 border-white/10 p-6 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold flex items-center gap-2"><Terminal className="w-4 h-4 text-primary" /> Latest Executions</h3>
                                <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/5" onClick={() => setActiveTab("queries")}>View All</Button>
                            </div>
                            <div className="space-y-2">
                                {dbSpans.length > 0 ? dbSpans.slice(0, 3).map(span => (
                                    <div key={span.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 text-sm hover:bg-white/10 transition-colors">
                                        <span className="font-mono text-white/60 truncate max-w-xl italic">{span.statement}</span>
                                        <span className="font-bold text-primary">{span.latency}ms</span>
                                    </div>
                                )) : (
                                    <p className="text-xs text-muted-foreground italic p-2">Waiting for database activity...</p>
                                )}
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="queries" className="space-y-4">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input type="text" placeholder="Search SQL..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-card/40 border border-white/10 rounded-lg py-2.5 pl-10 text-sm focus:border-primary/50 outline-none text-white" />
                        </div>
                        <div className="grid gap-3">
                            {filteredSpans.map((span) => (
                                <Card key={span.key} className="p-5 bg-card/40 border-white/10 hover:border-primary/30 transition-all group">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[13px] text-blue-300/90 leading-relaxed italic mb-3">{span.statement}</div>
                                            <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(span.time).toLocaleTimeString()}</span>
                                                <span className="px-2 py-0.5 bg-primary/10 rounded text-primary border border-primary/10 font-bold lowercase">{span.component}</span>
                                                <span className="opacity-50 lowercase">{span.peer}</span>
                                            </div>
                                        </div>
                                        <div className="text-right min-w-[100px]">
                                            <span className="text-xl font-bold text-white group-hover:text-primary transition-colors">{span.latency}ms</span>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold widests">Latency</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>


                    <TabsContent value="topology" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-6 bg-card/40 border-white/10 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                                    <h3 className="text-sm font-semibold flex items-center gap-2 text-white italic">
                                        <Server className="w-4 h-4 text-primary" /> Node Specifications
                                    </h3>

                                    <Badge className={`${liveMetrics.health === 'ONLINE'
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                        } text-[10px] px-2 py-0`}>
                                        {liveMetrics.health}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-x-8 gap-y-8 px-2">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.12em]">Host IP</p>
                                        <p className="font-mono text-sm text-white truncate">{decodedId.split(':')[0]}</p>
                                    </div>

                                    <div className="space-y-1.5 text-right md:text-left">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.12em]">Access Port</p>
                                        <p className="font-mono text-sm text-white">{decodedId.split(':')[1]?.split('.')[0] || "3306"}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.12em]">Client Driver</p>
                                        <p className="text-sm text-primary font-bold lowercase truncate">
                                            {dbSpans[0]?.component || "mysql-jdbc"}
                                        </p>
                                    </div>

                                    <div className="space-y-1.5 text-right md:text-left">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.12em]">Uptime Status</p>
                                        <p className="text-sm text-white font-medium flex items-center justify-end md:justify-start gap-2">

                                            <span className={`w-1.5 h-1.5 rounded-full ${liveMetrics.health === 'ONLINE'
                                                    ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]'
                                                    : 'bg-yellow-500 shadow-[0_0_8px_#eab308]'
                                                }`} />
                                            {liveMetrics.health === 'ONLINE' ? 'Active' : 'Standby'}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-card/40 border-white/10 flex flex-col justify-center relative overflow-hidden shadow-sm">
                                <h3 className="text-sm font-semibold flex items-center gap-2 mb-12 text-white italic">
                                    <Activity className="w-4 h-4 text-primary" /> Service Dependency
                                </h3>

                                <div className="flex items-center justify-around relative z-10 px-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                                            <Cpu className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">App Backend</span>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center px-6">

                                        <div className={`h-[1px] w-full relative opacity-60 ${liveMetrics.health === 'ONLINE'
                                                ? 'bg-gradient-to-r from-blue-500 via-primary to-green-500'
                                                : 'bg-white/20'
                                            }`}>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0c0d10] px-2 py-0.5 border border-white/10 rounded text-[9px] font-bold text-primary italic uppercase whitespace-nowrap shadow-xl">
                                                {liveMetrics.latency}ms latency
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                                            <Database className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">{db?.name || "Target DB"}</span>
                                    </div>
                                </div>

                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

function MetricCard({ label, value, icon, color }: any) {
    return (
        <Card className="p-6 bg-card/40 border-white/10 hover:border-primary/20 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4"><span className={color}>{icon}</span> {label}</div>
            <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        </Card>
    );
}