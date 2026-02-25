// "use client";
// import React, { useState } from 'react';
// import { useApolloClient } from '@apollo/client';
// import { GET_MQE_METRICS } from '@/apollo/queries/kubernetes';
// import { useDurationStore } from '@/store/useDurationStore';

// export default function K8sMetricDebugger() {
//   const client = useApolloClient();
//   const { durationObj } = useDurationStore();
  
//   const [metricName, setMetricName] = useState("k8s_node_cpu_usage");
//   const [nodeName, setNodeName] = useState("minikube");
//   const [rawData, setRawData] = useState<any>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const fetchRawMetric = async () => {
//     setLoading(true);
//     setError("");
//     setRawData(null);
    
//     try {
//       console.log(`🚀 Querying: ${metricName} for ${nodeName}`);
      
//       const res = await client.query({
//         query: GET_MQE_METRICS,
//         variables: {
//           expression: metricName,
//           entity: {
//             scope: 'ServiceInstance',
//             serviceName: 'k8s-cluster::k8s-cluster',
//             serviceInstanceName: nodeName,
//             normal: true
//           },
//           duration: durationObj
//         },
//         fetchPolicy: 'no-cache'
//       });

//       if (res.data?.result?.error) {
//         setError(res.data.result.error);
//       } else {
//         setRawData(res.data?.result?.results || []);
//       }
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: 'white', fontFamily: 'monospace', minHeight: '100vh' }}>
//       <h1>🛠️ SKYWALKING METRIC DEBUGGER</h1>
//       <hr />
      
//       <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
//         <div>
//           <label>Metric Expression:</label><br />
//           <input 
//             value={metricName} 
//             onChange={(e) => setMetricName(e.target.value)}
//             style={{ width: '300px', padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
//           />
//         </div>
//         <div>
//           <label>Node Name:</label><br />
//           <input 
//             value={nodeName} 
//             onChange={(e) => setNodeName(e.target.value)}
//             style={{ width: '150px', padding: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
//           />
//         </div>
//         <button 
//           onClick={fetchRawMetric}
//           style={{ marginTop: '20px', padding: '5px 20px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none' }}
//         >
//           {loading ? 'FETCHING...' : 'FETCH DATA'}
//         </button>
//       </div>

//       {error && (
//         <div style={{ color: '#ff4444', padding: '10px', border: '1px solid #ff4444', marginBottom: '20px' }}>
//           <strong>ERROR:</strong> {error}
//         </div>
//       )}

//       <h3>JSON RAW RESPONSE:</h3>
//       <pre style={{ backgroundColor: '#000', padding: '15px', borderRadius: '5px', overflowX: 'auto', maxHeight: '500px' }}>
//         {rawData ? JSON.stringify(rawData, null, 2) : 'No data yet. Hit Fetch Data.'}
//       </pre>

//       <div style={{ marginTop: '20px' }}>
//         <h3>Suggested Metric Names to Try:</h3>
//         <ul>
//           <li>k8s_node_cpu_usage</li>
//           <li>k8s_node_cpu_cores_usage</li>
//           <li>meter_k8s_node_cpu_usage</li>
//           <li>k8s_node_memory_usage</li>
//           <li>k8s_node_memory_usage_percentage</li>
//         </ul>
//       </div>
//     </div>
//   );
// }










"use client";
import React, { useState, useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import { GET_MQE_METRICS } from '@/apollo/queries/kubernetes';
import { useDurationStore } from '@/store/useDurationStore';
import { AlertTriangle, CheckCircle, Search, Server, Box, Activity, Play } from 'lucide-react';

export default function K8sMetricDebugger() {
  const client = useApolloClient();
  const { durationObj } = useDurationStore();
  
  // 1. Debug Mode Selection
  const [mode, setMode] = useState<'NODE' | 'POD'>('POD');

  // 2. Entity Construction State
  const [serviceName, setServiceName] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [metricName, setMetricName] = useState("k8s_service_pod_cpu_usage");
  
  // 3. Inputs for Auto-Generation
  const [namespace, setNamespace] = useState("default");
  const [deployment, setDeployment] = useState("demo-app");
  const [podName, setPodName] = useState("demo-app-xyz");
  const [nodeName, setNodeName] = useState("minikube");

  // 4. Output State
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [constructedEntity, setConstructedEntity] = useState<any>(null);

  // Auto-fill Logic based on Mode
  useEffect(() => {
    if (mode === 'NODE') {
      setServiceName("k8s-cluster::k8s-cluster");
      setInstanceName(nodeName);
      setMetricName("k8s_node_cpu_usage");
    } else {
      // SkyWalking Logic: Service usually = "k8s-cluster::{deployment}.{namespace}"
      setServiceName(`k8s-cluster::${deployment}.${namespace}`);
      setInstanceName(podName);
      setMetricName("k8s_service_pod_cpu_usage");
    }
  }, [mode, namespace, deployment, podName, nodeName]);

  const fetchRawMetric = async () => {
    setLoading(true);
    setError("");
    setRawData(null);
    
    // Construct Entity Object
    const entity = {
      scope: 'ServiceInstance',
      serviceName: serviceName,
      serviceInstanceName: instanceName,
      normal: true
    };
    setConstructedEntity(entity);

    try {
      console.log(`🚀 [DEBUGGER] Querying: ${metricName}`);
      console.log(`   Entity:`, entity);
      
      const res = await client.query({
        query: GET_MQE_METRICS,
        variables: {
          expression: metricName,
          entity: entity,
          duration: durationObj
        },
        fetchPolicy: 'no-cache'
      });

      if (res.errors) {
        setError(res.errors.map(e => e.message).join(", "));
      } else {
        setRawData(res.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono">
      <header className="mb-8 border-b border-white/10 pb-4 flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black text-blue-500 flex items-center gap-2">
             <Activity /> SKYWALKING METRIC DEBUGGER
           </h1>
           <p className="text-xs text-slate-500 mt-1">Diagnose why your metrics are returning NULL or N/A</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setMode('NODE')}
                className={`px-4 py-2 text-xs font-bold rounded border ${mode === 'NODE' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-white/10 text-slate-500'}`}
            >
                DEBUG NODE
            </button>
            <button 
                onClick={() => setMode('POD')}
                className={`px-4 py-2 text-xs font-bold rounded border ${mode === 'POD' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-transparent border-white/10 text-slate-500'}`}
            >
                DEBUG POD
            </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ─── LEFT PANEL: CONTROLS ─── */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* 1. AUTO GENERATOR */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">
                    1. Input Parameters
                </h3>
                
                {mode === 'POD' ? (
                    <>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500">Namespace</label>
                            <input value={namespace} onChange={e => setNamespace(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500">Deployment / Service Name</label>
                            <input value={deployment} onChange={e => setDeployment(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500">Full Pod Name</label>
                            <input value={podName} onChange={e => setPodName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-emerald-400" />
                        </div>
                    </>
                ) : (
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-500">Node Name (e.g. minikube)</label>
                        <input value={nodeName} onChange={e => setNodeName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-blue-400" />
                    </div>
                )}
            </div>

            {/* 2. ENTITY PREVIEW (The most critical part) */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">
                    2. Constructed Entity (SkyWalking Key)
                </h3>
                
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-orange-400 font-bold">Service Name (Critical)</label>
                    <input 
                        value={serviceName} 
                        onChange={e => setServiceName(e.target.value)} 
                        className="w-full bg-black/40 border border-orange-500/30 rounded p-2 text-xs text-orange-300 font-bold" 
                    />
                    <p className="text-[9px] text-slate-600">Try removing 'k8s-cluster::' prefix if data is null.</p>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500">Instance Name</label>
                    <input value={instanceName} onChange={e => setInstanceName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-slate-300" />
                </div>
            </div>

            {/* 3. METRIC SELECTOR */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">
                    3. Metric Expression
                </h3>
                <input value={metricName} onChange={e => setMetricName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-yellow-400" />
                
                <div className="flex flex-wrap gap-2">
                    {mode === 'POD' ? (
                        <>
                            <Badge onClick={() => setMetricName('k8s_service_pod_cpu_usage')}>CPU</Badge>
                            <Badge onClick={() => setMetricName('k8s_service_pod_memory_usage')}>MEM</Badge>
                            <Badge onClick={() => setMetricName('k8s_service_pod_status_restarts_total')}>RESTARTS</Badge>
                        </>
                    ) : (
                        <>
                            <Badge onClick={() => setMetricName('k8s_node_cpu_usage')}>Node CPU</Badge>
                            <Badge onClick={() => setMetricName('k8s_node_memory_usage')}>Node MEM</Badge>
                        </>
                    )}
                </div>

                <button 
                    onClick={fetchRawMetric}
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? 'Fetching...' : <><Play size={12} fill="currentColor" /> Run Query</>}
                </button>
            </div>

        </div>

        {/* ─── RIGHT PANEL: RESULTS ─── */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* ERROR BOX */}
            {error && (
                <div className="p-4 bg-red-950/30 border border-red-500/50 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-red-400 text-sm">GraphQL Error</h4>
                        <p className="text-xs text-red-300/80 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* RESULTS BOX */}
            <div className="h-full min-h-[500px] p-0 rounded-xl bg-black border border-white/10 overflow-hidden flex flex-col">
                <div className="bg-slate-900 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500">JSON Response</span>
                    {rawData && (
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rawData?.result?.results?.length > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {rawData?.result?.results?.length > 0 ? 'DATA FOUND' : 'NO DATA / NULL'}
                         </span>
                    )}
                </div>
                <pre className="flex-1 p-4 overflow-auto text-[11px] text-green-400 leading-relaxed font-mono">
                    {rawData ? JSON.stringify(rawData, null, 2) : <span className="text-slate-700">// No request sent yet.</span>}
                </pre>
            </div>
        </div>
      </div>
    </div>
  );
}

// Simple Badge Component
function Badge({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
    return (
        <span 
            onClick={onClick}
            className="cursor-pointer px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[9px] font-bold text-slate-400 hover:text-white transition-colors"
        >
            {children}
        </span>
    );
}