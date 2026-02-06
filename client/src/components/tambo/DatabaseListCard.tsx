import { Card } from "@/components/ui/card";
import { Database, AlertCircle } from "lucide-react";

// 🔥 Props ko any rakha hai taaki Tambo ka args object handle ho sake
export function DatabaseListCard(props: any) {
  // Tambo AI data ko 'args' mein bhejta hai, ya direct props mein
  const data = props.args || props;
  
  // 🔥 Safe Fallback: Agar databases undefined hai toh empty array use karo
  const databases = data.databases || [];

  // Map database types to colors
  const getTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      MySQL: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      PostgreSQL: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      MongoDB: "bg-green-500/10 text-green-400 border-green-500/20",
      Redis: "bg-red-500/10 text-red-400 border-red-500/20",
      Cassandra: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return typeColors[type] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 text-primary" />
        {/* 🔥 Ab length check safe hai, crash nahi hoga */}
        <h3 className="text-lg font-semibold">Databases ({databases.length})</h3>
      </div>

      <div className="grid gap-3">
        {databases.map((db: any) => (
          <Card
            key={db.id}
            className="p-4 bg-card/40 border-white/10 hover:bg-card/60 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg">
                  <Database className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{db.name}</h4>
                  <p className="text-xs text-muted-foreground">ID: {db.id}</p>
                </div>
              </div>

              <div
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(
                  db.type
                )}`}
              >
                {db.type}
              </div>
            </div>
          </Card>
        ))}

        {/* Empty state logic */}
        {databases.length === 0 && (
          <Card className="p-8 text-center border-dashed bg-card/10 border-white/10">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No databases detected</p>
          </Card>
        )}
      </div>
    </div>
  );
}