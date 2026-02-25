import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function K8sNamespaceSelector({ selected, onSelect, namespaces = [] }: any) {
  return (
    <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 px-3 py-1 rounded-lg">
      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">NS Context:</span>
      <Select value={selected} onValueChange={onSelect}>
        <SelectTrigger className="w-[140px] h-7 bg-transparent border-none text-white text-[11px] font-black focus:ring-0 uppercase">
          <SelectValue placeholder="Select NS" />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-white/10 text-white shadow-2xl">
          {namespaces.map((ns: string) => (
            <SelectItem key={ns} value={ns} className="text-[10px] font-black uppercase focus:bg-blue-500/20">
              {ns}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}