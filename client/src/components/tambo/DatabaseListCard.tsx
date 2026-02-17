"use client";

import { Card } from "@/components/ui/card";
import { Database } from "lucide-react";

export function DatabaseListCard({ databases }: { databases?: any[] }) {
  const rawList = Array.isArray(databases) ? databases : [];
  const flattened = rawList.map(item => item?.getAllDatabases ? item.getAllDatabases : item).flat();

  const uniqueDbs = Array.from(new Set(flattened.map(db => {
    return typeof db === 'string' ? db : (db?.name || db?.id);
  })))
  .filter(val => val && val !== "null" && val !== "undefined")
  .filter((val, index, self) => {
    const isId = /^[A-Za-z0-9+/=]+$/.test(val) && val.includes('=');
    if (isId) {
      const decoded = atob(val.split('.')[0]).toLowerCase();
      return !self.some(other => other !== val && decoded.includes(other.toLowerCase()));
    }
    return true;
  });

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
        Detected Databases ({uniqueDbs.length})
      </h3>
      <div className="grid gap-2">
        {uniqueDbs.length > 0 ? (
          uniqueDbs.map((dbName, idx) => (
            <Card key={idx} className="p-3 bg-[#0f172a]/60 border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <Database className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                  {dbName}
                </span>
              </div>
              
              <span className="text-[9px] font-black text-primary/70 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                Online
              </span>
            </Card>
          ))
        ) : (
          <div className="p-4 text-center border border-dashed border-white/10 rounded-lg">
            <p className="text-xs text-muted-foreground italic">No unique databases found.</p>
          </div>
        )}
      </div>
    </div>
  );
}